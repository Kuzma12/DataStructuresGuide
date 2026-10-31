'use strict';
// Zero-dependency local server: serves the study site, generates problems and checks Java code.
// Problem harnesses and reference solutions stay on the server; the browser gets public parts only.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { exec } = require('child_process');
const { findJava, compileAndRun } = require('./java');
const progress = require('./progress');

const PORT = Number(process.env.PORT) || 4317;
const HOST = '127.0.0.1';
const PUBLIC = path.join(__dirname, '..', 'public');
const MAX_BODY = 256 * 1024;

// Only these file types are ever served, and never dotfiles or package.json.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const BLOCKED = /(^|[\\/])(\.[^\\/]*|package\.json)$/i;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; '),
};

let service; // loaded once at startup (ES module)

// One compile at a time keeps the machine responsive and output deterministic.
let queue = Promise.resolve();
const serialized = (task) => (queue = queue.then(task, task));

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Request too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Rejects requests that do not come from this site (DNS rebinding / cross-site POSTs). */
function trusted(req) {
  const allowed = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
  if (!allowed.has(req.headers.host)) return false;
  if (req.method !== 'GET') {
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin.replace(/^https?:\/\//, ''))) return false;
  }
  return true;
}

function serveStatic(pathname, res) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  const inside = file === PUBLIC || file.startsWith(PUBLIC + path.sep);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!inside || !type || BLOCKED.test(file)) return send(res, 404, 'Not found', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

/** Validates the {templateId, seed, mode} part of a request. */
function problemRef(src) {
  const templateId = String(src.templateId || src.t || '');
  const seed = Number(src.seed ?? src.s);
  const mode = String(src.mode || src.m || 'medium');
  if (!service.exists(templateId) || !Number.isInteger(seed) || seed < 0 || seed > 0x7fffffff) return null;
  return { templateId, seed, mode };
}

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/health') {
    const jdk = findJava();
    return send(res, 200, { ok: true, java: jdk ? { found: true, version: jdk.version, dir: jdk.dir } : { found: false } });
  }
  if (route === 'GET /api/catalog') return send(res, 200, service.catalog());
  if (route === 'GET /api/problem') {
    const ref = problemRef(Object.fromEntries(url.searchParams));
    if (!ref) return send(res, 404, { ok: false, error: 'Unknown problem' });
    return send(res, 200, service.publicProblem(ref.templateId, ref.seed, ref.mode, progress));
  }

  const body = req.method === 'POST' ? JSON.parse((await readBody(req)) || '{}') : {};
  if (route === 'POST /api/progress/reset') {
    progress.reset();
    return send(res, 200, { ok: true });
  }
  const ref = problemRef(body);
  if (!ref) return send(res, 404, { ok: false, error: 'Unknown problem' });
  const key = `${ref.templateId}:${ref.seed}`;

  if (route === 'POST /api/hint') return send(res, 200, service.revealHint(ref.templateId, ref.seed, ref.mode, progress));
  if (route === 'POST /api/solution') return send(res, 200, service.revealSolution(ref.templateId, ref.seed, ref.mode, progress));
  if (route === 'POST /api/run') {
    if (typeof body.code !== 'string' || body.code.length > 100000) return send(res, 400, { ok: false, phase: 'setup', error: 'Missing code.' });
    const files = service.runFiles(ref.templateId, ref.seed, body.code);
    const result = await serialized(() => compileAndRun(files));
    if (result.phase === 'compile' || result.phase === 'run') progress.addRun(key);
    const allPassed = result.phase === 'run' && result.tests.length > 0 && result.tests.every((t) => t.status === 'PASS') && !!result.summary && !result.aborted;
    if (allPassed) progress.markSolved(key);
    const status = service.publicProblem(ref.templateId, ref.seed, ref.mode, progress);
    return send(res, 200, { ...result, allPassed, runs: status.runs, solutionAvailable: status.solutionAvailable, solutionRule: status.solutionRule });
  }
  return send(res, 404, { ok: false, error: 'Unknown endpoint' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (!trusted(req)) return send(res, 403, 'Forbidden', 'text/plain');
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method === 'GET') return serveStatic(url.pathname, res);
    send(res, 405, 'Method not allowed', 'text/plain');
  } catch (err) {
    send(res, 500, { ok: false, phase: 'setup', error: String(err.message || err) });
  }
});

const URL_ = `http://localhost:${PORT}`;

function openBrowser() {
  if (process.argv.includes('--no-open')) return;
  const cmd = process.platform === 'win32' ? `start "" "${URL_}"` : process.platform === 'darwin' ? `open "${URL_}"` : `xdg-open "${URL_}"`;
  exec(cmd, () => {});
}

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  // Something already owns the port. If it is this site, just open it instead of failing.
  http
    .get({ host: HOST, port: PORT, path: '/api/health', headers: { host: `localhost:${PORT}` } }, (res) => {
      res.resume();
      if (res.statusCode === 200) {
        console.log(`\n  Data Structures Guide is already running at ${URL_}. Opening it in your browser.\n`);
        openBrowser();
        setTimeout(() => process.exit(0), 500);
      } else {
        console.error(`\n  Port ${PORT} is used by another program. Close it, or start with: set PORT=4318 && node server\\server.js\n`);
        process.exit(1);
      }
    })
    .on('error', () => {
      console.error(`\n  Port ${PORT} is used by another program. Close it, or start with: set PORT=4318 && node server\\server.js\n`);
      process.exit(1);
    });
});

import(pathToFileURL(path.join(__dirname, 'problems', 'service.js')).href).then((mod) => {
  service = mod;
  server.listen(PORT, HOST, () => {
    const jdk = findJava();
    console.log(`\n  Data Structures Guide is running at ${URL_}\n`);
    console.log(jdk ? `  Java: ${jdk.version}  (${jdk.dir})` : '  Java: NOT FOUND. Install a JDK or set JAVA_HOME so code can be checked.');
    console.log('  Keep this window open while you study. Press Ctrl+C to stop.\n');
    openBrowser();
  });
});
