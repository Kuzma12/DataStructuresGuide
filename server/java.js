'use strict';
// Locates a JDK on this machine and compiles/runs submissions in a throwaway directory.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const isWin = process.platform === 'win32';
const exe = (name) => (isWin ? `${name}.exe` : name);

const FILE_NAME = /^[A-Z][A-Za-z0-9_]*\.java$/;
const MAX_OUTPUT = 64 * 1024;

function subdirs(base, toBin) {
  try {
    return fs
      .readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
      .reverse()
      .map((name) => toBin(path.join(base, name)));
  } catch {
    return [];
  }
}

function candidateBinDirs() {
  const dirs = [];
  if (process.env.JAVA_HOME) dirs.push(path.join(process.env.JAVA_HOME, 'bin'));
  for (const p of (process.env.PATH || '').split(path.delimiter)) if (p) dirs.push(p);

  const bin = (d) => path.join(d, 'bin');
  const home = os.homedir();
  if (isWin) {
    const pf = [process.env.ProgramFiles || 'C:\\Program Files', process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'];
    for (const root of pf) {
      dirs.push(...subdirs(path.join(root, 'Java'), bin));
      dirs.push(...subdirs(path.join(root, 'Eclipse Adoptium'), bin));
      dirs.push(...subdirs(path.join(root, 'Microsoft'), bin));
      dirs.push(...subdirs(path.join(root, 'Zulu'), bin));
      dirs.push(...subdirs(path.join(root, 'Amazon Corretto'), bin));
      dirs.push(...subdirs(path.join(root, 'JetBrains'), (d) => path.join(d, 'jbr', 'bin')));
    }
    if (process.env.LOCALAPPDATA) {
      dirs.push(...subdirs(path.join(process.env.LOCALAPPDATA, 'Programs'), (d) => path.join(d, 'jbr', 'bin')));
      dirs.push(...subdirs(path.join(process.env.LOCALAPPDATA, 'JetBrains', 'Toolbox', 'apps'), (d) => path.join(d, 'jbr', 'bin')));
    }
  } else {
    dirs.push(...subdirs('/usr/lib/jvm', bin));
    dirs.push(...subdirs('/Library/Java/JavaVirtualMachines', (d) => path.join(d, 'Contents', 'Home', 'bin')));
    dirs.push(...subdirs(path.join(home, 'Library', 'Java', 'JavaVirtualMachines'), (d) => path.join(d, 'Contents', 'Home', 'bin')));
    dirs.push(...subdirs('/Applications', (d) => path.join(d, 'Contents', 'jbr', 'Contents', 'Home', 'bin')));
    dirs.push(...subdirs('/opt', (d) => path.join(d, 'jbr', 'bin')));
  }
  dirs.push(...subdirs(path.join(home, '.jdks'), bin));
  return dirs;
}

let cached;

function findJava() {
  if (cached !== undefined) return cached;
  cached = null;
  for (const dir of candidateBinDirs()) {
    const javac = path.join(dir, exe('javac'));
    const java = path.join(dir, exe('java'));
    if (fs.existsSync(javac) && fs.existsSync(java)) {
      const probe = spawnSync(javac, ['-version'], { encoding: 'utf8' });
      if (probe.status !== 0) continue;
      const version = `${probe.stdout || ''}${probe.stderr || ''}`.trim();
      cached = { dir, javac, java, version };
      break;
    }
  }
  return cached;
}

function run(cmd, args, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const cap = (acc, chunk) => (acc.length < MAX_OUTPUT ? acc + chunk.toString('utf8') : acc);
    child.stdout.on('data', (c) => (stdout = cap(stdout, c)));
    child.stderr.on('data', (c) => (stderr = cap(stderr, c)));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr + String(err), timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

function parseCompilerOutput(text) {
  const errors = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(?:.*[\\/])?([A-Za-z0-9_]+\.java):(\d+): (error|warning): (.*)$/);
    if (m) {
      current = { file: m[1], line: Number(m[2]), kind: m[3], message: m[4], detail: [] };
      errors.push(current);
    } else if (current && line.trim() && !/^\d+ (errors?|warnings?)$/.test(line.trim())) {
      current.detail.push(line);
    }
  }
  return errors
    .filter((e) => e.kind === 'error')
    .map((e) => ({ file: e.file, line: e.line, message: e.message, detail: e.detail.join('\n') }));
}

function parseResults(text) {
  const tests = [];
  let summary = null;
  let aborted = false;
  const unescape = (s) => s.replace(/\\(n|t|\\)/g, (_, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : '\\'));
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const parts = line.split('\t');
    if (parts[0] === 'END') summary = { passed: Number(parts[1]), failed: Number(parts[2]) };
    else if (parts[0] === 'ABORT') aborted = true;
    else tests.push({ status: parts[0], name: unescape(parts[1] || ''), message: unescape(parts[2] || '') });
  }
  return { tests, summary, aborted };
}

async function compileAndRun(files) {
  const jdk = findJava();
  if (!jdk) return { ok: false, phase: 'setup', error: 'NO_JDK' };

  const names = Object.keys(files);
  if (!names.includes('Main.java')) return { ok: false, phase: 'setup', error: 'Missing test harness.' };
  for (const name of names) {
    if (!FILE_NAME.test(name)) return { ok: false, phase: 'setup', error: `Bad file name: ${name}` };
    if (typeof files[name] !== 'string') return { ok: false, phase: 'setup', error: `Bad file: ${name}` };
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'dsguide-'));
  const src = path.join(work, 'src');
  const out = path.join(work, 'out');
  fs.mkdirSync(src);
  fs.mkdirSync(out);
  const started = Date.now();
  try {
    for (const name of names) fs.writeFileSync(path.join(src, name), files[name], 'utf8');

    const compiled = await run(jdk.javac, ['-g', '-encoding', 'UTF-8', '-nowarn', '-Xlint:none', '-d', out, ...names], {
      cwd: src,
      timeoutMs: 45000,
    });
    if (compiled.code !== 0) {
      const raw = `${compiled.stdout}${compiled.stderr}`;
      return { ok: false, phase: 'compile', errors: parseCompilerOutput(raw), raw, ms: Date.now() - started };
    }

    const resultsFile = path.join(work, 'results.txt');
    const ran = await run(jdk.java, ['-Xss64m', '-Xmx512m', '-XX:+UseSerialGC', '-cp', out, 'Main', resultsFile], {
      cwd: work,
      timeoutMs: 30000,
    });
    const results = fs.existsSync(resultsFile) ? parseResults(fs.readFileSync(resultsFile, 'utf8')) : { tests: [], summary: null, aborted: false };
    return {
      ok: true,
      phase: 'run',
      ...results,
      stdout: ran.stdout,
      stderr: ran.stderr,
      timedOut: ran.timedOut,
      exitCode: ran.code,
      ms: Date.now() - started,
    };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

module.exports = { findJava, compileAndRun };
