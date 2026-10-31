// Talks to the local server (server/server.js).

let healthCache;

async function call(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch {
    return { ok: false, phase: 'setup', error: 'OFFLINE' };
  }
}

export async function health(force = false) {
  if (healthCache && !force) return healthCache;
  const h = await call('GET', '/api/health');
  healthCache = h.error === 'OFFLINE' ? { ok: false, offline: true } : h;
  return healthCache;
}

export const getProblem = (templateId, seed, mode) =>
  call('GET', `/api/problem?t=${encodeURIComponent(templateId)}&s=${seed}&m=${encodeURIComponent(mode)}`);

export const requestHint = (templateId, seed, mode) => call('POST', '/api/hint', { templateId, seed, mode });

export const requestSolution = (templateId, seed, mode) => call('POST', '/api/solution', { templateId, seed, mode });

export const runCode = (templateId, seed, mode, code) => call('POST', '/api/run', { templateId, seed, mode, code });

export const resetServerProgress = () => call('POST', '/api/progress/reset', {});
