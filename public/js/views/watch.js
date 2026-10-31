import { WALKTHROUGHS, walkthroughById } from '../anim/walkthroughs.js';
import { mountPlayer } from '../anim/player.js';
import { topicById } from '../curriculum.js';
import { esc } from '../ui.js';

export default {
  wide: true,
  render(el, id, step) {
    const wt = id && walkthroughById(id);
    if (wt) {
      const topic = topicById(wt.topic);
      const idx = WALKTHROUGHS.indexOf(wt);
      const prev = WALKTHROUGHS[idx - 1];
      const next = WALKTHROUGHS[idx + 1];
      el.innerHTML = `
        <div class="watch-page">
          <nav class="crumbs"><a href="#/watch">Watch</a><span>/</span><span>${esc(topic.short)}</span></nav>
          <h1>${esc(wt.title)}</h1>
          <p class="lead">${esc(wt.intro)}</p>
          <div data-player></div>
          <div class="watch-nav">
            ${prev ? `<a class="btn ghost" href="#/watch/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
            <a class="btn" href="#/learn/${topic.id}">Read the ${esc(topic.short)} lesson</a>
            ${next ? `<a class="btn ghost" href="#/watch/${next.id}">${esc(next.title)} →</a>` : '<span></span>'}
          </div>
          <p class="muted small center">Tip: click the player, then use <kbd>Space</kbd> to play or pause and <kbd>←</kbd> <kbd>→</kbd> to step. Change the input and press <b>Show me</b> to try your own data.</p>
        </div>`;
      const player = mountPlayer(el.querySelector('[data-player]'), wt, { startAt: step ? Number(step) - 1 : 0 });
      return () => player.destroy();
    }
    el.innerHTML = `
      <header class="page-head narrow">
        <p class="eyebrow">Watch</p>
        <h1>See the code run, one step at a time</h1>
        <p class="lead">Each animation runs real algorithm code. The line being run lights up, the picture moves, and a short sentence explains what just happened. Press play, or step through at your own speed.</p>
      </header>
      <div class="watch-grid">
        ${WALKTHROUGHS.map((w) => {
          const t = topicById(w.topic);
          return `<a class="watch-card" href="#/watch/${w.id}"><span class="pill">${esc(t.short)}</span><b>${esc(w.title)}</b><span class="muted">${esc(w.intro)}</span><span class="play-chip">▶ Watch</span></a>`;
        }).join('')}
      </div>`;
  },
};
