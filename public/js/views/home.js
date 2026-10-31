import { TOPICS, topicMastery } from '../curriculum.js';
import { store, masteryLabel } from '../store.js';
import { ring, esc } from '../ui.js';
import { templatesFor, modeById } from '../catalog.js';
import { DRILLS } from '../drills.js';

/** The single most useful next step: finish reading, then drill, then code, topic by topic. */
export function nextStep() {
  for (const t of TOPICS) {
    const m = topicMastery(t);
    if (m.score >= 90) continue;
    const unread = t.lesson.sections.find((s) => !store.sectionDone(t.id, s.id));
    if (unread) return { topic: t, label: `Continue “${t.title}”`, detail: unread.title, href: `#/learn/${t.id}/${unread.id}`, kind: 'Learn' };
    const d = store.state.drills[t.id];
    if (DRILLS.some((x) => x.topic === t.id) && (!d || d.attempts < 10)) return { topic: t, label: `Drill ${t.title}`, detail: 'Trace algorithms on random inputs', href: `#/drills/${t.id}`, kind: 'Drill' };
    if (templatesFor(t.id).length) return { topic: t, label: `Practice ${t.title}`, detail: 'Generate a coding problem', href: `#/practice/${t.id}`, kind: 'Code' };
  }
  return { topic: null, label: 'Keep practicing', detail: 'Generate problems from any topic', href: '#/practice', kind: 'Code' };
}

export default {
  render(el) {
    const next = nextStep();
    const totalSolved = Object.values(store.state.problems).reduce((a, p) => a + p.solved, 0);
    const totalDrills = Object.values(store.state.drills).reduce((a, d) => a + d.attempts, 0);
    const streak = store.streak();
    const mode = modeById(store.state.mode);
    const cards = TOPICS.map((t) => {
      const m = topicMastery(t);
      const bar = (key, label) => {
        const p = m.parts.find((x) => x.key === key);
        return p ? `<div class="bar" title="${label}: ${Math.round(p.value * 100)}%"><span style="width:${p.value * 100}%"></span><label>${label}</label></div>` : '';
      };
      const hasProblems = templatesFor(t.id).length > 0;
      const hasDrills = DRILLS.some((d) => d.topic === t.id);
      return `
        <article class="topic-card">
          <header>
            ${ring(m.score, 44)}
            <div><h3>${esc(t.title)}</h3><p class="muted">${t.wa ? `${t.wa} · ` : ''}${masteryLabel(m.score)}</p></div>
          </header>
          <div class="bars">${bar('reading', 'Read')}${bar('drills', 'Drills')}${bar('coding', 'Code')}</div>
          <footer>
            <a class="btn sm" href="#/learn/${t.id}">Learn</a>
            ${hasDrills ? `<a class="btn sm ghost" href="#/drills/${t.id}">Drill</a>` : ''}
            ${hasProblems ? `<a class="btn sm ghost" href="#/practice/${t.id}">Code</a>` : ''}
          </footer>
        </article>`;
    }).join('');

    el.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Data Structures II · Java</p>
        <h1>Learn it slowly. Practice it endlessly.</h1>
        <p class="lead">Lessons that start from the basics, labs that show what the code does, tracing drills, and an unlimited supply of auto-checked Java problems for the skills behind every weekly assignment.</p>
      </section>

      <div class="path-strip">
        <a href="#/watch"><span>1</span><b>Watch</b><small>See the code run as an animation</small></a>
        <a href="#/learn/method"><span>2</span><b>Learn</b><small>Short lessons in simple words</small></a>
        <a href="#/drills"><span>3</span><b>Trace</b><small>Predict what the algorithm does</small></a>
        <a href="#/practice"><span>4</span><b>Code</b><small>Real Java, checked by real tests</small></a>
      </div>

      <a class="next-card" href="${next.href}">
        <span class="pill">${next.kind}</span>
        <div><b>${esc(next.label)}</b><span class="muted">${esc(next.detail)}</span></div>
        <span class="arrow">→</span>
      </a>

      <div class="stats">
        <div><b class="mode-chip m-${mode ? mode.id : 'medium'}">${mode ? esc(mode.label) : 'Medium'}</b><span>difficulty mode · <a href="#/practice">change</a></span></div>
        <div><b>${streak}</b><span>day streak</span></div>
        <div><b>${totalSolved}</b><span>problems solved</span></div>
        <div><b>${totalDrills}</b><span>drills traced</span></div>
      </div>

      <h2 class="section-title">Curriculum</h2>
      <p class="muted section-sub">Go in order. Each topic builds on the one before it.</p>
      <div class="topic-grid">${cards}</div>`;
  },
};
