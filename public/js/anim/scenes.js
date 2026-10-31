// Scene builders: turn data structure states into keyed SVG items for the Stage.
// Keys are stable (a node keeps its key while it moves), which is what makes motion possible.

export const R = 18;

export function scene(parts, label) {
  const items = [];
  let w = 0;
  let h = 0;
  for (const p of parts) {
    if (!p) continue;
    items.push(...p.items);
    w = Math.max(w, p.w);
    h = Math.max(h, p.h);
  }
  return { w: w + 10, h: h + 10, items, label };
}

const circle = (key, cx, cy, cls, r = R) => ({ key, tag: 'circle', a: { cx, cy, r }, cls });
const text = (key, x, y, t, cls = '') => ({ key, tag: 'text', a: { x, y }, cls, text: t });
const line = (key, x1, y1, x2, y2, cls = '') => ({ key, tag: 'line', a: { x1, y1, x2, y2 }, cls });
const rect = (key, x, y, width, height, cls = '', rx = 7) => ({ key, tag: 'rect', a: { x, y, width, height, rx }, cls });

/* ------------------------------------------------------------------ binary trees */

/** Snapshot of a {key,left,right,red,size} tree (so later mutations do not change old frames). */
export function snap(x) {
  return x ? { key: x.key, red: !!x.red, size: x.size, left: snap(x.left), right: snap(x.right) } : null;
}

/**
 * Tree layout: x by in-order position, y by depth.
 * opts.mark: {key: class}  opts.label(node) -> small text under a node  opts.pointer: {key, name}
 * opts.ox / opts.oy: offsets.  opts.ghost: {key, x, y} for a node that is not linked yet.
 */
export function tree(root, opts = {}) {
  const DX = opts.dx || 50;
  const DY = opts.dy || 64;
  const ox = opts.ox ?? 10;
  const oy = opts.oy ?? 34;
  const items = [];
  const pos = new Map();
  let i = 0;
  let depth = 0;
  const place = (x, d) => {
    if (!x) return;
    place(x.left, d + 1);
    pos.set(x.key, { x: ox + i++ * DX + DX / 2, y: oy + d * DY, node: x });
    depth = Math.max(depth, d);
    place(x.right, d + 1);
  };
  place(root, 0);
  const edges = [];
  const walk = (x) => {
    if (!x) return;
    for (const c of [x.left, x.right]) {
      if (!c) continue;
      const a = pos.get(x.key);
      const b = pos.get(c.key);
      edges.push(line(`e:${c.key}`, a.x, a.y, b.x, b.y, `edge${c.red ? ' red' : ''}${opts.mark?.[`edge:${c.key}`] ? ` ${opts.mark[`edge:${c.key}`]}` : ''}`));
    }
    walk(x.left);
    walk(x.right);
  };
  walk(root);
  items.push(...edges);
  for (const [key, p] of pos) {
    const m = opts.mark?.[key] || '';
    items.push(circle(`n:${key}`, p.x, p.y, `node ${p.node.red ? 'red ' : ''}${m}`));
    items.push(text(`t:${key}`, p.x, p.y, String(key), `ntext ${m}`));
    if (opts.label) items.push(text(`l:${key}`, p.x, p.y + R + 12, opts.label(p.node), 'nlabel'));
  }
  if (opts.ghost) {
    const g = opts.ghost;
    items.push(circle(`n:${g.key}`, g.x, g.y, 'node new'));
    items.push(text(`t:${g.key}`, g.x, g.y, String(g.key), 'ntext'));
  }
  if (opts.pointer && pos.has(opts.pointer.key)) {
    const p = pos.get(opts.pointer.key);
    items.push(text('ptr', p.x, p.y - R - 9, '▼', 'ptr'));
    items.push(text('ptr-t', p.x, p.y - R - 24, opts.pointer.name || 'x', 'ptr-text'));
  }
  if (!root && !opts.ghost) items.push(text('empty-tree', ox + 70, oy, 'empty tree', 'row-empty'));
  const w = Math.max(ox + i * DX + 10, opts.ghost ? opts.ghost.x + R + 10 : 0, root ? 0 : ox + 150);
  return { items, w, h: oy + depth * DY + R + (opts.label ? 24 : 10), pos };
}

/* ------------------------------------------------------------------ rows, stacks, queues */

/** A labeled row of boxes. Items: [{id, text, cls}] (ids keep boxes stable while sliding). */
export function row(name, list, x, y, opts = {}) {
  const W = opts.cell || 38;
  const items = [text(`${name}:label`, x, y + 15, opts.title || name, 'row-label start')];
  const startX = x + (opts.labelWidth ?? 70);
  if (!list.length) items.push(text(`${name}:empty`, startX, y + 15, opts.empty || '(empty)', 'row-empty start'));
  list.forEach((it, i) => {
    const bx = startX + i * (W + 6);
    items.push(rect(`${name}:${it.id}`, bx, y, W, 30, `cell ${it.cls || ''}`));
    items.push(text(`${name}:${it.id}:t`, bx + W / 2, y + 15, it.text, `celltext ${it.cls || ''}`));
  });
  return { items, w: startX + list.length * (W + 6) + 10, h: y + 34 };
}

/** A vertical stack (bottom at y + height). Items: [{id, text, cls}]; the top is the last item. */
export function stack(name, list, x, y, opts = {}) {
  const W = opts.width || 96;
  const H = 30;
  const slots = Math.max(opts.slots || 5, list.length);
  const bottom = y + slots * (H + 5);
  const items = [
    text(`${name}:label`, x + W / 2, bottom + 20, opts.title || name, 'row-label'),
    line(`${name}:base`, x - 6, bottom + 4, x + W + 6, bottom + 4, 'base'),
  ];
  list.forEach((it, i) => {
    const by = bottom - (i + 1) * (H + 5) + 4;
    items.push(rect(`${name}:${it.id}`, x, by, W, H, `cell ${it.cls || ''}`));
    items.push(text(`${name}:${it.id}:t`, x + W / 2, by + H / 2, it.text, `celltext ${it.cls || ''}`));
  });
  if (list.length) {
    const ty = bottom - list.length * (H + 5) + 4 + H / 2;
    items.push(text(`${name}:top`, x + W + 14, ty, '← top', 'row-label start small'));
  }
  return { items, w: x + W + 60, h: bottom + 28 };
}

/* ------------------------------------------------------------------ graphs */

export function circleLayout(V, cx, cy, rad) {
  return Array.from({ length: V }, (_, v) => {
    const a = -Math.PI / 2 + (2 * Math.PI * v) / V;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  });
}

/** opts.mark: {v: class}, opts.edgeMark: {"v-w": class}, opts.directed */
export function graph(adj, pos, opts = {}) {
  const items = [];
  const drawn = new Set();
  for (let v = 0; v < adj.length; v++) {
    for (const w of adj[v]) {
      const id = opts.directed ? `${v}-${w}` : v < w ? `${v}-${w}` : `${w}-${v}`;
      if (drawn.has(id)) continue;
      drawn.add(id);
      const a = pos[v];
      const b = pos[w];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const pad = R + (opts.directed ? 4 : 0);
      const marks = [opts.edgeMark?.[id], opts.edgeMark?.[`${w}-${v}`], opts.edgeMark?.[`${v}-${w}`]].filter(Boolean);
      const cls = marks.includes('check') ? 'check' : marks[0] || '';
      items.push({
        key: `ge:${id}`,
        tag: 'line',
        a: { x1: a.x + (dx / len) * R, y1: a.y + (dy / len) * R, x2: b.x - (dx / len) * pad, y2: b.y - (dy / len) * pad, ...(opts.directed ? { 'marker-end': 'url(#st-arrow)' } : {}) },
        cls: `gedge ${cls}`,
      });
    }
  }
  pos.forEach((p, v) => {
    const m = opts.mark?.[v] || '';
    items.push(circle(`g:${v}`, p.x, p.y, `node ${m}`));
    items.push(text(`gt:${v}`, p.x, p.y, String(v), `ntext ${m}`));
  });
  const maxX = Math.max(...pos.map((p) => p.x)) + R + 10;
  const maxY = Math.max(...pos.map((p) => p.y)) + R + 10;
  return { items, w: maxX, h: maxY };
}

/* ------------------------------------------------------------------ hash table */

/** chains: array of key arrays (front first). opts.mark: {key: class}, opts.bin: highlighted index. */
export function chains(chainsArr, x, y, opts = {}) {
  const items = [];
  const H = 30;
  const BW = 34;
  const CW = 66;
  let w = 0;
  chainsArr.forEach((chain, i) => {
    const by = y + i * (H + 8);
    items.push(rect(`bin:${i}`, x, by, BW, H, `bin${opts.bin === i ? ' hot' : ''}`, 6));
    items.push(text(`bin:${i}:t`, x + BW / 2, by + H / 2, String(i), 'celltext'));
    chain.forEach((k, j) => {
      const cx = x + BW + 22 + j * (CW + 20);
      if (j === 0) items.push(line(`arr:${i}:0`, x + BW, by + H / 2, cx, by + H / 2, 'chain-link'));
      else items.push(line(`arr:${i}:${j}`, cx - 20, by + H / 2, cx, by + H / 2, 'chain-link'));
      const m = opts.mark?.[k] || '';
      items.push(rect(`ck:${k}`, cx, by, CW, H, `cell ${m}`));
      items.push(text(`ck:${k}:t`, cx + CW / 2, by + H / 2, String(k), `celltext ${m}`));
      w = Math.max(w, cx + CW + 10);
    });
  });
  return { items, w: Math.max(w, x + BW + 120), h: y + chainsArr.length * (H + 8) + 6 };
}

export function caption(key, x, y, t, cls = 'cap') {
  return { items: [text(key, x, y, t, `${cls} start`)], w: x + t.length * 7.5, h: y + 10 };
}
