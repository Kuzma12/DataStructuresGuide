import { TOPICS, topicById } from '../curriculum.js';
import { TEMPLATES, templatesFor } from '../problems/index.js';
import { store } from '../store.js';
import { esc, levelDots } from '../ui.js';
import { newSeed, Rng } from '../rng.js';

const CODE_TOPICS = TOPICS.filter((t) => templatesFor(t.id).length);

/** Highest difficulty unlocked in a topic: solve something at level n to unlock n + 1. */
export function unlockedLevel(topicId) {
  let level = 1;
  for (const lv of [1, 2]) {
    if (templatesFor(topicId).some((t) => t.level === lv && store.problem(t.id).solved > 0)) level = lv + 1;
  }
  return level;
}

function templateScore(id) {
  const p = store.problem(id);
  return Math.min(1, (p.clean + 0.5 * (p.solved - p.clean)) / 2);
}

/**
 * Picks the next problem type. "auto" favours unmastered types at or below the unlocked level;
 * a number restricts to that difficulty.
 */
export function pickTemplate(topicIds, difficulty = 'auto', rng = new Rng(newSeed())) {
  let pool = TEMPLATES.filter((t) => topicIds.includes(t.topic));
  if (difficulty === 'auto') {
    const open = pool.filter((t) => t.level <= unlockedLevel(t.topic));
    if (open.length) pool = open;
  } else {
    const exact = pool.filter((t) => t.level === Number(difficulty));
    if (exact.length) pool = exact;
  }
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

export default {
  render(el, topicId) {
    const selected = new Set(topicId && topicById(topicId) ? [topicId] : CODE_TOPICS.map((t) => t.id));
    let difficulty = 'auto';

    const chips = () =>
      CODE_TOPICS.map((t) => `<button class="chip${selected.has(t.id) ? ' on' : ''}" data-topic="${t.id}">${esc(t.short)}</button>`).join('');

    const typeList = () =>
      CODE_TOPICS.filter((t) => selected.has(t.id))
        .map((t) => {
          const unlocked = unlockedLevel(t.id);
          const rows = templatesFor(t.id)
            .map((tp) => {
              const p = store.problem(tp.id);
              const score = templateScore(tp.id);
              const status = score >= 1 ? '<span class="status ok">mastered</span>' : p.solved ? `<span class="status mid">${p.solved} solved</span>` : p.attempts ? '<span class="status">in progress</span>' : '';
              const later = tp.level > unlocked ? '<span class="status later" title="Solve an easier problem in this topic first. You can still open it.">later</span>' : '';
              return `<a class="type-row" href="${problemHref(tp.id)}">${levelDots(tp.level)}<span class="type-name">${esc(tp.title)}<small>${esc(tp.skill)} · ${tp.variants || 1} variants</small></span>${later}${status}<span class="arrow">→</span></a>`;
            })
            .join('');
          return `<div class="type-group"><h3>${esc(t.title)} <span class="muted">${t.wa || ''}</span></h3>${rows}</div>`;
        })
        .join('');

    const recent = store.state.recent
      .map((r) => {
        const tp = TEMPLATES.find((t) => t.id === r.templateId);
        if (!tp) return '';
        const solved = store.isSolved(r.templateId, r.seed);
        return `<a class="recent-row" href="#/problem/${r.templateId}/${r.seed}"><span class="${solved ? 'dot ok' : 'dot'}"></span>${esc(r.title || tp.title)}</a>`;
      })
      .join('');

    const draw = () => {
      el.innerHTML = `
        <header class="page-head">
          <p class="eyebrow">Practice</p>
          <h1>Problem generator</h1>
          <p class="lead">Every click builds a new problem with fresh test data and its own test file. A problem type counts as mastered after you solve <b>two different variants</b> without opening the solution.</p>
        </header>

        <section class="generator">
          <div class="gen-row"><span class="gen-label">Topics</span><div class="chips">${chips()}</div></div>
          <div class="gen-row"><span class="gen-label">Difficulty</span>
            <div class="seg" data-diff>
              ${['auto', '1', '2', '3'].map((d) => `<button data-d="${d}" class="${d === difficulty ? 'on' : ''}">${d === 'auto' ? 'Adaptive' : levelDots(Number(d))}</button>`).join('')}
            </div>
          </div>
          <div class="gen-actions">
            <button class="btn primary lg" data-go>Generate a problem</button>
            <span class="muted">or</span>
            <label class="field">a set of <input class="input sm" type="number" min="2" max="20" value="5" data-n> problems</label>
            <button class="btn" data-set>Generate set</button>
          </div>
          ${store.state.set ? `<p class="set-note">Set in progress: problem ${store.state.set.index + 1} of ${store.state.set.items.length}. <a href="#/problem/${store.state.set.items[store.state.set.index].templateId}/${store.state.set.items[store.state.set.index].seed}">Continue →</a></p>` : ''}
        </section>

        <div class="practice-cols">
          <section><h2 class="section-title">Problem types</h2>${typeList() || '<p class="muted">Pick at least one topic.</p>'}</section>
          <aside>${recent ? `<h2 class="section-title">Recent</h2><div class="recent">${recent}</div>` : ''}</aside>
        </div>`;

      el.querySelectorAll('[data-topic]').forEach((b) =>
        b.addEventListener('click', () => {
          const id = b.dataset.topic;
          if (selected.has(id) && selected.size > 1) selected.delete(id);
          else selected.add(id);
          draw();
        }),
      );
      el.querySelectorAll('[data-d]').forEach((b) =>
        b.addEventListener('click', () => {
          difficulty = b.dataset.d;
          draw();
        }),
      );
      el.querySelector('[data-go]').addEventListener('click', () => {
        store.setQueue(null);
        const tp = pickTemplate([...selected], difficulty);
        location.hash = problemHref(tp.id);
      });
      el.querySelector('[data-set]').addEventListener('click', () => {
        const n = Math.max(2, Math.min(20, Number(el.querySelector('[data-n]').value) || 5));
        const rng = new Rng(newSeed());
        const items = [];
        for (let i = 0; i < n; i++) items.push({ templateId: pickTemplate([...selected], difficulty, rng).id, seed: newSeed() });
        store.setQueue(items);
        location.hash = `#/problem/${items[0].templateId}/${items[0].seed}`;
      });
    };
    draw();
  },
};
