// Small DOM helpers, a Java syntax highlighter and shared UI bits.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const KEYWORDS = new Set(
  'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public return short static super switch synchronized this throw throws transient true false try var void volatile while'.split(
    ' ',
  ),
);

const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?[LlDdFf]?\b)|([A-Za-z_$][\w$]*)|(@\w+)/g;

export function highlightJava(src) {
  let out = '';
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += esc(src.slice(last, m.index));
    const [text, comment, str, num, ident, ann] = m;
    if (comment) out += `<span class="tk-c">${esc(text)}</span>`;
    else if (str) out += `<span class="tk-s">${esc(text)}</span>`;
    else if (num) out += `<span class="tk-n">${esc(text)}</span>`;
    else if (ann) out += `<span class="tk-a">${esc(text)}</span>`;
    else if (ident && KEYWORDS.has(text)) out += `<span class="tk-k">${text}</span>`;
    else if (ident && /^[A-Z]/.test(text)) out += `<span class="tk-t">${text}</span>`;
    else out += esc(text);
    last = m.index + text.length;
  }
  return out + esc(src.slice(last));
}

export function code(src, caption) {
  const body = src.replace(/^\n+|\s+$/g, '');
  return `<figure class="codeblock">${caption ? `<figcaption>${caption}</figcaption>` : ''}<pre><code>${highlightJava(body)}</code></pre></figure>`;
}

export function toast(message, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

export function ring(pct, size = 36) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct / 100)));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="${Math.round(pct)}% mastery"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>`;
}

export function levelDots(level) {
  return `<span class="dots" title="Difficulty ${level} of 3">${[1, 2, 3].map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span>`;
}

/** Normalizes a typed answer: "5, 3 1" -> "5 3 1". Keeps letters, digits, minus signs and dots. */
export function normalizeAnswer(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, ' ')
    .trim();
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
