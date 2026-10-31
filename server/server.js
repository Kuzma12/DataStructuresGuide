'use strict';
// Zero-dependency local server: serves the study site and compiles/tests Java submissions.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { findJava, compileAndRun } = require('./java');

const PORT = Number(process.env.PORT) || 4317;
const HOST = '127.0.0.1';
const PUBLIC = path.join(__dirname, '..', 'public');
const MAX_BODY = 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// One compile at a time keeps the machine responsive and output deterministic.
let queue = Promise.resolve();
const serialized = (task) => (queue = queue.then(task, task));

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
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

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (file !== PUBLIC && !file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/health' && req.method === 'GET') {
      const jdk = findJava();
      return sendJson(res, 200, { ok: true, java: jdk ? { found: true, version: jdk.version, dir: jdk.dir } : { found: false } });
    }
    if (req.url === '/api/run' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req));
      const result = await serialized(() => compileAndRun(body.files || {}));
      return sendJson(res, 200, result);
    }
    if (req.method === 'GET') return serveStatic(req, res);
    res.writeHead(405);
    res.end();
  } catch (err) {
    sendJson(res, 500, { ok: false, phase: 'setup', error: String(err.message || err) });
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
    .get(`http://${HOST}:${PORT}/api/health`, (res) => {
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

server.listen(PORT, HOST, () => {
  const jdk = findJava();
  console.log(`\n  Data Structures Guide is running at ${URL_}\n`);
  console.log(jdk ? `  Java: ${jdk.version}  (${jdk.dir})` : '  Java: NOT FOUND. Install a JDK or set JAVA_HOME so code can be checked.');
  console.log('  Keep this window open while you study. Press Ctrl+C to stop.\n');
  openBrowser();
});
