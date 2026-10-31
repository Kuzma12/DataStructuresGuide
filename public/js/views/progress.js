import { TOPICS, topicMastery } from '../curriculum.js';
import { templatesFor } from '../problems/index.js';
import { store, masteryLabel } from '../store.js';
import { esc, ring, levelDots, toast } from '../ui.js';
import { health } from '../api.js';

export default {
  async render(el) {
    const h = await health();
    const rows = TOPICS.map((t) => {
      const m = topicMastery(t);
      const parts = m.parts.map((p) => `<span>${p.key} ${Math.round(p.value * 100)}%</span>`).join('');
      const types = templatesFor(t.id)
        .map((tp) => {
          const p = store.problem(tp.id);
          return `<tr><td>${levelDots(tp.level)}</td><td>${esc(tp.title)}</td><td>${p.attempts}</td><td>${p.solved}</td><td>${p.clean}</td></tr>`;
        })
        .join('');
      return `
        <details class="prog-topic">
          <summary>${ring(m.score, 32)}<b>${esc(t.title)}</b><span class="muted">${masteryLabel(m.score)} · ${Math.round(m.score)}%</span><span class="parts">${parts}</span></summary>
          ${types ? `<table class="mini"><tr><th></th><th>Problem type</th><th>Tried</th><th>Solved</th><th>Clean</th></tr>${types}</table>` : '<p class="muted">No coding problems in this topic.</p>'}
        </details>`;
    }).join('');

    el.innerHTML = `
      <header class="page-head">
        <p class="eyebrow">Progress</p>
        <h1>Your mastery</h1>
        <p class="lead">Mastery mixes reading (20%), drill accuracy over your last 10 drills (30%) and coding (50%). A problem type counts fully after 2 clean solves of different variants.</p>
      </header>
      <section class="prog">${rows}</section>

      <h2 class="section-title">System</h2>
      <p class="muted">Java compiler: ${h.offline ? 'server offline' : h.java?.found ? `${esc(h.java.version)} <span class="small">(${esc(h.java.dir)})</span>` : 'not found'}</p>

      <h2 class="section-title">Your data</h2>
      <p class="muted">Progress is saved in this browser only. Export it to move to another browser or as a backup.</p>
      <div class="row-actions">
        <button class="btn" data-a="export">Export progress</button>
        <label class="btn ghost">Import progress<input type="file" accept="application/json" hidden data-a="import"></label>
        <button class="btn ghost danger" data-a="reset">Reset everything</button>
      </div>`;

    el.querySelector('[data-a="export"]').addEventListener('click', () => {
      const blob = new Blob([store.export()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ds-guide-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    el.querySelector('[data-a="import"]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        store.import(await file.text());
        toast('Progress imported', 'good');
        document.dispatchEvent(new Event('progress-changed'));
        this.render(el);
      } catch {
        toast('That file is not a valid progress export', 'bad');
      }
    });
    el.querySelector('[data-a="reset"]').addEventListener('click', () => {
      if (!confirm('Erase all progress, drafts and stats in this browser? This cannot be undone.')) return;
      store.reset();
      document.dispatchEvent(new Event('progress-changed'));
      this.render(el);
    });
  },
};
