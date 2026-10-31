import { LABS } from '../labs.js';
import { esc } from '../ui.js';

export default {
  wide: true,
  render(el, id) {
    if (id && LABS[id]) {
      const lab = LABS[id];
      el.innerHTML = `
        <header class="page-head narrow">
          <nav class="crumbs"><a href="#/labs">Labs</a><span>/</span><span>${esc(lab.title)}</span></nav>
          <h1>${esc(lab.title)}</h1>
          <p class="lead">${esc(lab.blurb)}</p>
        </header>
        <div class="lab-full" data-lab></div>`;
      lab.mount(el.querySelector('[data-lab]'));
      return;
    }
    el.innerHTML = `
      <header class="page-head narrow">
        <p class="eyebrow">Labs</p>
        <h1>See the algorithms move</h1>
        <p class="lead">Small sandboxes for building intuition. Use them while reading a lesson, or whenever a test fails and you want to see what <em>should</em> have happened.</p>
      </header>
      <div class="lab-grid">
        ${Object.entries(LABS)
          .map(([key, lab]) => `<a class="lab-card" href="#/labs/${key}"><b>${esc(lab.title)}</b><span class="muted">${esc(lab.blurb)}</span><span class="arrow">→</span></a>`)
          .join('')}
      </div>`;
  },
};
