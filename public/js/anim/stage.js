// A tiny keyed SVG renderer with tweening. Each frame describes the whole picture as a list of
// items with stable keys; the stage moves, fades and recolors existing shapes instead of
// redrawing them, so nodes visibly slide during rotations, deletions and resizes.

const NS = 'http://www.w3.org/2000/svg';
const NUMERIC = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'rx']);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Stage {
  constructor(host) {
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', 'stage-svg');
    this.svg.setAttribute('role', 'img');
    this.defs = document.createElementNS(NS, 'defs');
    this.defs.innerHTML =
      '<marker id="st-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="st-arrowhead"/></marker>';
    this.svg.appendChild(this.defs);
    host.appendChild(this.svg);
    this.nodes = new Map();
    this.box = [0, 0, 300, 200];
    this.raf = 0;
  }

  /** Draws a scene: {w, h, items: [{key, tag, a: attrs, cls, text}]}; duration in ms. */
  render(scene, duration = 450) {
    cancelAnimationFrame(this.raf);
    const tweens = [];
    const seen = new Set();
    const instant = duration <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches;

    const target = [0, 0, Math.max(60, scene.w), Math.max(40, scene.h)];
    const fromBox = this.box.slice();
    this.svg.setAttribute('aria-label', scene.label || 'animation');

    for (const item of scene.items) {
      seen.add(item.key);
      let el = this.nodes.get(item.key);
      const fresh = !el || el.tagName !== item.tag;
      if (fresh) {
        if (el) el.remove();
        el = document.createElementNS(NS, item.tag);
        el.dataset.key = item.key;
        this.nodes.set(item.key, el);
        for (const [k, v] of Object.entries(item.a)) el.setAttribute(k, v);
        if (!instant) {
          el.style.opacity = '0';
          requestAnimationFrame(() => (el.style.opacity = ''));
        }
      } else {
        for (const [k, v] of Object.entries(item.a)) {
          const cur = el.getAttribute(k);
          if (NUMERIC.has(k) && cur !== null && !instant && Number(cur) !== Number(v)) tweens.push([el, k, Number(cur), Number(v)]);
          else el.setAttribute(k, v);
        }
      }
      el.removeAttribute('data-leaving');
      el.setAttribute('class', item.cls || '');
      if (item.text !== undefined && el.textContent !== String(item.text)) el.textContent = item.text;
      this.svg.appendChild(el); // keeps z-order equal to item order
    }

    for (const [key, el] of this.nodes) {
      if (seen.has(key)) continue;
      this.nodes.delete(key);
      if (instant) el.remove();
      else {
        el.setAttribute('data-leaving', '');
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 320);
      }
    }

    if (instant) {
      for (const [el, k, , to] of tweens) el.setAttribute(k, to);
      this.setBox(target);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);
      for (const [el, k, from, to] of tweens) el.setAttribute(k, from + (to - from) * e);
      this.setBox(fromBox.map((v, i) => v + (target[i] - v) * e));
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  setBox(box) {
    this.box = box;
    this.svg.setAttribute('viewBox', box.map((v) => Math.round(v * 10) / 10).join(' '));
    this.svg.style.aspectRatio = `${box[2]} / ${box[3]}`;
    this.svg.style.maxWidth = `${Math.round(box[2] * 1.45)}px`; // small scenes stay a friendly size
  }
}
