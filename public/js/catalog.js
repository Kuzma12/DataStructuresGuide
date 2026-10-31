// Problem catalog and difficulty modes, fetched once from the server.
// Only public metadata lives in the browser; problem harnesses and solutions stay server-side.

let data = { templates: [], modes: [] };

export async function loadCatalog() {
  try {
    const res = await fetch('/api/catalog', { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch {
    /* offline: lessons, labs and drills still work */
  }
  return data;
}

/** Used by tests that run outside the browser. */
export function setCatalog(next) {
  data = next;
}

export const templates = () => data.templates;
export const templateById = (id) => data.templates.find((t) => t.id === id);
export const templatesFor = (topic) => data.templates.filter((t) => t.topic === topic);
export const modes = () => data.modes;
export const modeById = (id) => data.modes.find((m) => m.id === id) || data.modes[1] || null;

export const LEVEL_NAMES = ['', 'Easy', 'Medium', 'Hard', 'Very hard', 'Extreme'];
