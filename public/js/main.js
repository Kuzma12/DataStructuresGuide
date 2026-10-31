// App shell and hash router.
import { TOPICS, topicMastery } from './curriculum.js';
import { store } from './store.js';
import { ring, esc } from './ui.js';
import { health } from './api.js';
import { loadCatalog, modeById } from './catalog.js';
import home from './views/home.js';
import learn from './views/learn.js';
import practice from './views/practice.js';
import problem from './views/problem.js';
import drills from './views/drills.js';
import labs from './views/labs.js';
import progress from './views/progress.js';
import watch from './views/watch.js';

const ROUTES = [
  [/^$/, home],
  [/^learn\/([\w-]+)(?:\/([\w-]+))?$/, learn],
  [/^practice(?:\/([\w-]+))?$/, practice],
  [/^problem\/([\w-]+)\/(\d+)$/, problem],
  [/^drills(?:\/([\w-]+))?$/, drills],
  [/^labs(?:\/([\w-]+))?$/, labs],
  [/^watch(?:\/([\w-]+))?(?:\/(\d+))?$/, watch],
  [/^progress$/, progress],
];

const main = document.getElementById('main');
let cleanup = null;

function applyTheme() {
  const t = store.state.theme;
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

export function renderNav() {
  const path = location.hash.replace(/^#\/?/, '');
  const topicLinks = TOPICS.map((t) => {
    const m = topicMastery(t);
    const active = path.startsWith(`learn/${t.id}`) ? ' active' : '';
    return `<a class="nav-topic${active}" href="#/learn/${t.id}">${ring(m.score, 22)}<span>${esc(t.short)}</span>${t.wa && t.wa.startsWith('WA') ? `<em>${t.wa}</em>` : ''}</a>`;
  }).join('');
  const mode = modeById(store.state.mode);
  const link = (href, label, match) => `<a class="nav-link${match ? ' active' : ''}" href="${href}">${label}</a>`;
  document.getElementById('nav').innerHTML = `
    ${link('#/', 'Home', path === '')}
    ${link('#/watch', 'Watch', path.startsWith('watch'))}
    ${link('#/practice', 'Practice', path.startsWith('practice') || path.startsWith('problem'))}
    ${link('#/drills', 'Drills', path.startsWith('drills'))}
    ${link('#/labs', 'Labs', path.startsWith('labs'))}
    ${link('#/progress', 'Progress', path === 'progress')}
    ${mode ? `<a class="nav-mode m-${mode.id}" href="#/practice" title="Difficulty mode: change it on the Practice page"><span>Mode</span><b>${esc(mode.label)}</b></a>` : ''}
    <div class="nav-label">Learn</div>
    ${topicLinks}`;
}

async function route() {
  const path = location.hash.replace(/^#\/?/, '');
  cleanup?.();
  cleanup = null;
  document.body.classList.remove('nav-open');
  for (const [re, view] of ROUTES) {
    const m = path.match(re);
    if (m) {
      main.innerHTML = '';
      main.className = view.wide ? 'main wide' : 'main';
      cleanup = (await view.render(main, ...m.slice(1))) || null;
      renderNav();
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
      return;
    }
  }
  location.hash = '#/';
}

async function checkServer() {
  const h = await health();
  const banner = document.getElementById('banner');
  if (h.offline) {
    banner.innerHTML = 'The local server is not running, so code cannot be checked. Start it with <code>start.bat</code> (or <code>npm start</code>), then open <a href="http://localhost:4317">localhost:4317</a>. Lessons, labs and drills still work.';
    banner.hidden = false;
  } else if (!h.java?.found) {
    banner.innerHTML = 'No Java compiler (JDK) was found, so code cannot be checked. Install a JDK or set <code>JAVA_HOME</code> (IntelliJ’s bundled JDK is detected automatically), then restart the server.';
    banner.hidden = false;
  }
}

document.getElementById('theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  store.setTheme(dark ? 'light' : 'dark');
  applyTheme();
});
document.getElementById('menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
document.addEventListener('progress-changed', renderNav);
window.addEventListener('hashchange', route);

applyTheme();
loadCatalog().then(() => {
  route();
  checkServer();
});
