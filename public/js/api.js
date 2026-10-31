// Talks to the local server (server/server.js).

let healthCache;

export async function health(force = false) {
  if (healthCache && !force) return healthCache;
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    healthCache = await res.json();
  } catch {
    healthCache = { ok: false, offline: true };
  }
  return healthCache;
}

export async function runJava(files) {
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    });
    return await res.json();
  } catch {
    return { ok: false, phase: 'setup', error: 'OFFLINE' };
  }
}
