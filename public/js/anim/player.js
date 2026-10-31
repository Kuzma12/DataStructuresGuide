// The walkthrough player: code with the current line lit up, an animated picture, a plain-words
// narration of every step, live variables, and play / step / speed / read-aloud controls.
import { Stage } from './stage.js';
import { esc, highlightJava } from '../ui.js';

const SPEEDS = [
  { label: '0.5×', ms: 2600 },
  { label: '1×', ms: 1500 },
  { label: '2×', ms: 800 },
  { label: '4×', ms: 380 },
];

export function mountPlayer(host, wt, { compact = false, startAt = 0 } = {}) {
  let frames = [];
  let i = 0;
  let playing = false;
  let timer = null;
  let speed = 1;
  let voice = false;
  const inputs = Object.fromEntries((wt.inputs || []).map((f) => [f.id, f.value]));

  host.innerHTML = `
    <div class="player${compact ? ' compact' : ''}" tabindex="0">
      ${wt.inputs?.length ? `<div class="player-inputs">${wt.inputs
        .map((f) =>
          f.options
            ? `<label class="field">${esc(f.label)} <select class="input" data-in="${f.id}">${f.options.map((o) => `<option value="${esc(o.value)}"${o.value === f.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`
            : `<label class="field">${esc(f.label)} <input class="input ${f.wide ? 'grow' : 'sm2'}" data-in="${f.id}" value="${esc(f.value)}"></label>`,
        )
        .join('')}<button class="btn sm" data-p="build">Show me</button>${wt.random ? '<button class="btn ghost sm" data-p="random">Random</button>' : ''}</div>` : ''}
      <div class="player-main">
        <div class="player-code"><div class="code-title">Java</div><ol data-p="code"></ol></div>
        <div class="player-stage" data-p="stage"></div>
      </div>
      <div class="narration" aria-live="polite">
        <div class="step-badge" data-p="count"></div>
        <p data-p="say"></p>
      </div>
      <div class="player-vars" data-p="vars"></div>
      <div class="player-controls">
        <button class="btn icon" data-p="first" title="Back to the start" aria-label="Back to the start">⏮</button>
        <button class="btn icon" data-p="prev" title="Previous step (←)" aria-label="Previous step">◀</button>
        <button class="btn icon primary play" data-p="play" title="Play / pause (space)" aria-label="Play">▶</button>
        <button class="btn icon" data-p="next" title="Next step (→)" aria-label="Next step">▶▶</button>
        <button class="btn icon" data-p="last" title="Jump to the end" aria-label="Jump to the end">⏭</button>
        <input class="scrub" type="range" min="0" value="0" data-p="scrub" aria-label="Step">
        <div class="seg speed">${SPEEDS.map((s, k) => `<button data-speed="${k}" class="${k === speed ? 'on' : ''}">${s.label}</button>`).join('')}</div>
        <button class="btn sm ghost" data-p="voice" aria-pressed="false" title="Read each step out loud">🔈 Read aloud</button>
      </div>
    </div>`;

  const $ = (k) => host.querySelector(`[data-p="${k}"]`);
  const stage = new Stage($('stage'));
  let lis = [];
  const renderCode = () => {
    $('code').innerHTML = wt.code
      .split('\n')
      .map((l) => `<li><code>${highlightJava(l) || ' '}</code></li>`)
      .join('');
    lis = [...$('code').children];
  };

  const speak = (textHtml) => {
    if (!voice || !window.speechSynthesis) return null;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(textHtml.replace(/<[^>]+>/g, '').replace(/→/g, 'then'));
    u.rate = 0.98;
    speechSynthesis.speak(u);
    return u;
  };

  const show = (k, animate = true) => {
    i = Math.max(0, Math.min(frames.length - 1, k));
    const f = frames[i];
    if (!f) return;
    stage.render(f.scene, animate ? Math.min(520, SPEEDS[speed].ms * 0.45) : 0);
    const lit = new Set([].concat(f.line ?? []));
    lis.forEach((li, n) => li.classList.toggle('on', lit.has(n + 1)));
    const first = lis[[...lit][0] - 1];
    if (first) {
      const box = $('code');
      const top = first.offsetTop - box.clientHeight / 2;
      box.scrollTo({ top, behavior: animate ? 'smooth' : 'auto' });
    }
    $('say').innerHTML = f.say;
    $('count').textContent = `Step ${i + 1} of ${frames.length}`;
    $('vars').innerHTML = f.vars ? Object.entries(f.vars).map(([k2, v]) => `<span class="var"><b>${esc(k2)}</b>${esc(v)}</span>`).join('') : '';
    $('scrub').max = frames.length - 1;
    $('scrub').value = i;
    if (playing) schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    if (!playing) return;
    if (i >= frames.length - 1) return pause();
    const u = speak(frames[i].say);
    if (u) {
      u.onend = () => {
        if (playing) timer = setTimeout(() => show(i + 1), 350);
      };
    } else timer = setTimeout(() => show(i + 1), SPEEDS[speed].ms);
  };

  const play = () => {
    if (i >= frames.length - 1) show(0, false);
    playing = true;
    $('play').textContent = '❚❚';
    $('play').setAttribute('aria-label', 'Pause');
    schedule();
  };

  const pause = () => {
    playing = false;
    clearTimeout(timer);
    if (window.speechSynthesis) speechSynthesis.cancel();
    $('play').textContent = '▶';
    $('play').setAttribute('aria-label', 'Play');
  };

  const build = () => {
    pause();
    if (!lis.length) renderCode();
    try {
      frames = wt.build(inputs);
      renderCode();
    } catch (err) {
      frames = [];
      $('say').innerHTML = `<span class="error">${esc(err.message)}</span>`;
      return;
    }
    show(0, false);
  };

  const step = (d) => {
    pause();
    show(i + d);
    speak(frames[i].say);
  };

  $('first').addEventListener('click', () => (pause(), show(0)));
  $('prev').addEventListener('click', () => step(-1));
  $('next').addEventListener('click', () => step(1));
  $('last').addEventListener('click', () => (pause(), show(frames.length - 1)));
  $('play').addEventListener('click', () => (playing ? pause() : play()));
  $('scrub').addEventListener('input', (e) => (pause(), show(Number(e.target.value), false)));
  host.querySelectorAll('[data-speed]').forEach((b) =>
    b.addEventListener('click', () => {
      speed = Number(b.dataset.speed);
      host.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  $('voice').addEventListener('click', () => {
    voice = !voice;
    if (!window.speechSynthesis) voice = false;
    $('voice').setAttribute('aria-pressed', String(voice));
    $('voice').classList.toggle('on', voice);
    $('voice').textContent = voice ? '🔊 Reading aloud' : '🔈 Read aloud';
    if (!voice && window.speechSynthesis) speechSynthesis.cancel();
    else speak(frames[i]?.say || '');
  });
  host.querySelectorAll('[data-in]').forEach((input) => {
    input.addEventListener('change', () => (inputs[input.dataset.in] = input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        inputs[input.dataset.in] = input.value;
        build();
      }
    });
  });
  host.querySelector('[data-p="build"]')?.addEventListener('click', () => {
    host.querySelectorAll('[data-in]').forEach((input) => (inputs[input.dataset.in] = input.value));
    build();
  });
  host.querySelector('[data-p="random"]')?.addEventListener('click', () => {
    const next = wt.random();
    for (const [k, v] of Object.entries(next)) {
      inputs[k] = v;
      const el = host.querySelector(`[data-in="${k}"]`);
      if (el) el.value = v;
    }
    build();
  });
  host.querySelector('.player').addEventListener('keydown', (e) => {
    if (e.target.matches('input, select')) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ') {
      e.preventDefault();
      playing ? pause() : play();
    }
  });

  build();
  if (startAt) show(startAt, false);
  return { destroy: pause };
}
