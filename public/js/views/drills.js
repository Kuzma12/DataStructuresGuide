import { TOPICS, topicById } from '../curriculum.js';
import { DRILLS } from '../drills.js';
import { store } from '../store.js';
import { esc, normalizeAnswer } from '../ui.js';
import { Rng, newSeed } from '../rng.js';

const DRILL_TOPICS = TOPICS.filter((t) => DRILLS.some((d) => d.topic === t.id));

function isCorrect(drill, typed) {
  const got = normalizeAnswer(typed);
  const accepted = (drill.accept || [drill.answer]).map(normalizeAnswer);
  if (accepted.includes(got)) return true;
  const a = Number(drill.answer);
  const b = Number(got);
  return got !== '' && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.01;
}

export default {
  render(el, topicId) {
    let filter = topicId && topicById(topicId) ? topicId : 'all';
    let current;
    let answered = false;

    const statsHtml = () =>
      DRILL_TOPICS.map((t) => {
        const d = store.state.drills[t.id];
        const acc = d && d.recent.length ? Math.round((100 * d.recent.reduce((a, b) => a + b, 0)) / d.recent.length) : null;
        return `<div class="drill-stat${filter === t.id ? ' on' : ''}"><span>${esc(t.short)}</span><b>${acc === null ? '–' : `${acc}%`}</b><small>${d ? d.attempts : 0} done</small></div>`;
      }).join('');

    const nextDrill = () => {
      const pool = DRILLS.filter((d) => filter === 'all' || d.topic === filter);
      const rng = new Rng(newSeed());
      const def = rng.pick(pool);
      current = { def, ...def.generate(rng) };
      answered = false;
      draw();
    };

    const draw = () => {
      const d = current;
      el.innerHTML = `
        <header class="page-head">
          <p class="eyebrow">Drills</p>
          <h1>Trace it before you code it</h1>
          <p class="lead">Predict what the algorithm does on a random input. Each answer comes with a step-by-step explanation. Ten in a row at high accuracy means you really understand the algorithm.</p>
        </header>
        <div class="chips" data-filters>
          <button class="chip${filter === 'all' ? ' on' : ''}" data-f="all">Mixed</button>
          ${DRILL_TOPICS.map((t) => `<button class="chip${filter === t.id ? ' on' : ''}" data-f="${t.id}">${esc(t.short)}</button>`).join('')}
        </div>
        <div class="drill-stats">${statsHtml()}</div>
        <article class="drill-card">
          <p class="eyebrow">${esc(topicById(d.def.topic).short)} · ${esc(d.def.title)}</p>
          <p class="drill-prompt">${d.prompt}</p>
          <div class="drill-visual">${d.visual}</div>
          <form class="drill-form" data-form>
            <input class="input grow mono" data-answer placeholder="${esc(d.placeholder || 'your answer')}" autocomplete="off" ${answered ? 'disabled' : ''}>
            ${answered ? '<button type="button" class="btn primary" data-next>Next drill →</button>' : '<button class="btn primary">Check</button><button type="button" class="btn ghost" data-skip>Show answer</button>'}
          </form>
          <div class="drill-feedback" data-feedback></div>
        </article>`;

      el.querySelectorAll('[data-f]').forEach((b) =>
        b.addEventListener('click', () => {
          filter = b.dataset.f;
          history.replaceState(null, '', filter === 'all' ? '#/drills' : `#/drills/${filter}`);
          nextDrill();
        }),
      );
      const input = el.querySelector('[data-answer]');
      const feedback = el.querySelector('[data-feedback]');
      const reveal = (ok, typed) => {
        answered = true;
        store.recordDrill(d.def.topic, ok);
        document.dispatchEvent(new Event('progress-changed'));
        const typedNote = typed !== undefined ? `<p class="muted small">You answered: <code>${esc(typed || '(empty)')}</code></p>` : '';
        draw();
        el.querySelector('[data-answer]').value = typed || '';
        el.querySelector('[data-feedback]').innerHTML = `<div class="verdict ${ok ? 'good' : 'bad'}"><b>${ok ? 'Correct' : 'Not quite'}</b> · answer: <code>${esc(d.answer)}</code></div>${typedNote}<div class="explain">${d.explain}</div>`;
        el.querySelector('[data-next]').focus();
      };
      el.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        if (answered) return;
        if (!input.value.trim()) {
          feedback.innerHTML = '<p class="muted">Type an answer first, or press “Show answer”.</p>';
          return;
        }
        reveal(isCorrect(d, input.value), input.value);
      });
      el.querySelector('[data-skip]')?.addEventListener('click', () => reveal(false));
      el.querySelector('[data-next]')?.addEventListener('click', nextDrill);
      if (!answered) input.focus();
    };

    nextDrill();
  },
};
