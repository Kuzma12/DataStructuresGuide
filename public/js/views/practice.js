import { TOPICS, topicById } from '../curriculum.js';
import { templates, templatesFor, modes, modeById } from '../catalog.js';
import { store } from '../store.js';
import { esc, levelDots } from '../ui.js';
import { newSeed, Rng } from '../rng.js';

const codeTopics = () => TOPICS.filter((t) => templatesFor(t.id).length);

function templateScore(id) {
  const p = store.problem(id);
  return Math.min(1, (p.clean + 0.5 * (p.solved - p.clean)) / 2);
}

/**
 * Picks the next problem type for the current mode. Each mode covers a band of levels; if a topic
 * has nothing in that band, its closest level is used so every topic can always be practiced.
 * Unmastered types are favoured.
 */
export function pickTemplate(topicIds, modeId = store.state.mode, rng = new Rng(newSeed())) {
  const mode = modeById(modeId);
  const levels = mode ? mode.levels : [1, 2];
  let pool = [];
  for (const topic of topicIds) {
    const all = templatesFor(topic);
    const inBand = all.filter((t) => levels.includes(t.level));
    if (inBand.length) pool.push(...inBand);
    else if (all.length) {
      const target = levels[levels.length - 1];
      const best = Math.min(...all.map((t) => Math.abs(t.level - target)));
      pool.push(...all.filter((t) => Math.abs(t.level - target) === best));
    }
  }
  if (!pool.length) pool = templates();
  const weights = pool.map((t) => 1.15 - templateScore(t.id));
  let r = rng.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function problemHref(templateId, seed = newSeed()) {
  return `#/problem/${templateId}/${seed}`;
}

export function modePicker(current, onPick) {
  const html = `<div class="mode-picker" role="radiogroup" aria-label="Difficulty mode">${modes()
    .map(
      (m, i) => `<button class="mode-card m-${m.id}${m.id === current ? ' on' : ''}" data-mode="${m.id}" role="radio" aria-checked="${m.id === current}">
        <span class="mode-top">${levelDots(i + 1)}<b>${esc(m.label)}</b></span>
        <span class="mode-blurb">${esc(m.blurb)}</span></button>`,
    )
    .join('')}</div>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => onPick(b.dataset.mode)));
    },
  };
}

export default {
  render(el, topicId) {
    const topics = codeTopics();
    const selected = new Set(topicId && topicById(topicId) ? [topicId] : topics.map((t) => t.id));

    const typeList = () => {
      const mode = modeById(store.state.mode);
      return topics
        .filter((t) => selected.has(t.id))
        .map((t) => {
          const rows = templatesFor(t.id)
            .slice()
            .sort((a, b) => a.level - b.level)
            .map((tp) => {
              const p = store.problem(tp.id);
              const score = templateScore(tp.id);
              const status = score >= 1 ? '<span class="status ok">mastered</span>' : p.solved ? `<span class="status mid">${p.solved} solved</span>` : p.attempts ? '<span class="status">in progress</span>' : '';
              const band = mode && mode.levels.includes(tp.level) ? ' in-band' : '';
              return `<a class="type-row${band}" href="${problemHref(tp.id)}">${levelDots(tp.level)}<span class="type-name">${esc(tp.title)}<small>${esc(tp.skill)} · ${tp.variants} variant${tp.variants === 1 ? '' : 's'}</small></span>${status}<span class="arrow">→</span></a>`;
            })
            .join('');
          return `<div class="type-group"><h3>${esc(t.title)} <span class="muted">${t.wa || ''}</span></h3>${rows}</div>`;
        })
        .join('');
    };

    const recent = () =>
      store.state.recent
        .map((r) => {
          const tp = templates().find((t) => t.id === r.templateId);
          if (!tp) return '';
          const solved = store.isSolved(r.templateId, r.seed);
          return `<a class="recent-row" href="#/problem/${r.templateId}/${r.seed}"><span class="${solved ? 'dot ok' : 'dot'}"></span>${esc(r.title || tp.title)}</a>`;
        })
        .join('');

    const draw = () => {
      if (!templates().length) {
        el.innerHTML = `<header class="page-head"><p class="eyebrow">Practice</p><h1>Problem generator</h1></header><div class="callout warn">The problem catalog comes from the local server, which is not reachable. Start it with <code>start.bat</code> and reload.</div>`;
        return;
      }
      const picker = modePicker(store.state.mode, (m) => {
        store.setMode(m);
        document.dispatchEvent(new Event('progress-changed'));
        draw();
      });
      const set = store.state.set;
      el.innerHTML = `
        <header class="page-head">
          <p class="eyebrow">Practice</p>
          <h1>Problem generator</h1>
          <p class="lead">Every click builds a new problem with fresh test data. Pick a mode: it decides which problem types you get, how much help the starter code gives, and how many hints you can open.</p>
        </header>

        <section class="generator">
          <div class="gen-row col"><span class="gen-label">Mode</span>${picker.html}</div>
          <div class="gen-row"><span class="gen-label">Topics</span><div class="chips">${topics.map((t) => `<button class="chip${selected.has(t.id) ? ' on' : ''}" data-topic="${t.id}">${esc(t.short)}</button>`).join('')}</div></div>
          <div class="gen-actions">
            <button class="btn primary lg" data-go>Generate a problem</button>
            <span class="muted">or</span>
            <label class="field">a set of <input class="input sm" type="number" min="2" max="20" value="5" data-n> problems</label>
            <button class="btn" data-set>Generate set</button>
          </div>
          ${set ? `<p class="set-note">Set in progress: problem ${set.index + 1} of ${set.items.length}. <a href="#/problem/${set.items[set.index].templateId}/${set.items[set.index].seed}">Continue →</a></p>` : ''}
        </section>

        <div class="practice-cols">
          <section><h2 class="section-title">Problem types</h2><p class="muted small">Highlighted rows are in your current mode’s range. You can open any of them.</p>${typeList() || '<p class="muted">Pick at least one topic.</p>'}</section>
          <aside>${recent() ? `<h2 class="section-title">Recent</h2><div class="recent">${recent()}</div>` : ''}</aside>
        </div>`;

      picker.bind(el);
      el.querySelectorAll('[data-topic]').forEach((b) =>
        b.addEventListener('click', () => {
          const id = b.dataset.topic;
          if (selected.has(id) && selected.size > 1) selected.delete(id);
          else selected.add(id);
          draw();
        }),
      );
      el.querySelector('[data-go]').addEventListener('click', () => {
        store.setQueue(null);
        location.hash = problemHref(pickTemplate([...selected]).id);
      });
      el.querySelector('[data-set]').addEventListener('click', () => {
        const n = Math.max(2, Math.min(20, Number(el.querySelector('[data-n]').value) || 5));
        const rng = new Rng(newSeed());
        const items = [];
        for (let i = 0; i < n; i++) items.push({ templateId: pickTemplate([...selected], store.state.mode, rng).id, seed: newSeed() });
        store.setQueue(items);
        location.hash = `#/problem/${items[0].templateId}/${items[0].seed}`;
      });
    };
    draw();
  },
};
