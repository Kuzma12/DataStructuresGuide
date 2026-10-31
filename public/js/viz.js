// SVG renderers for binary trees, 2-3 trees, graphs and hash tables. All return HTML strings.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Binary tree: x = in-order position, y = depth. Red links (child.red) are drawn red and thick.
 * opts.highlight / opts.dim: Sets of keys. opts.label(node): optional small text under a node.
 */
export function treeSvg(root, opts = {}) {
  if (!root) return `<div class="viz-empty">empty tree</div>`;
  const R = 17;
  const DX = opts.dx || 44;
  const DY = opts.dy || 58;
  const nodes = [];
  let i = 0;
  let maxDepth = 0;
  const place = (x, d, parent) => {
    if (!x) return;
    place(x.left, d + 1, x);
    const n = { x: i++ * DX + DX / 2 + 8, y: d * DY + R + 10, node: x, parent };
    nodes.push(n);
    maxDepth = Math.max(maxDepth, d);
    place(x.right, d + 1, x);
  };
  place(root, 0, null);
  const pos = new Map(nodes.map((n) => [n.node, n]));
  const W = i * DX + 16;
  const H = maxDepth * DY + 2 * R + 20 + (opts.label ? 14 : 0);
  const hl = opts.highlight || new Set();
  const dim = opts.dim || new Set();
  let edges = '';
  let circles = '';
  for (const n of nodes) {
    if (n.parent) {
      const p = pos.get(n.parent);
      const red = n.node.red ? ' red' : '';
      edges += `<line class="edge${red}" x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}"/>`;
    }
  }
  for (const n of nodes) {
    const cls = ['node', hl.has(n.node.key) ? 'hl' : '', dim.has(n.node.key) ? 'dim' : '', n.node.red ? 'is-red' : ''].join(' ');
    const key = esc(n.node.key);
    const fs = key.length > 3 ? 10 : key.length > 2 ? 12 : 13;
    circles += `<g class="${cls}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text x="${n.x}" y="${n.y}" style="font-size:${fs}px">${key}</text>`;
    if (opts.label) circles += `<text class="sub" x="${n.x}" y="${n.y + R + 11}">${esc(opts.label(n.node))}</text>`;
    circles += '</g>';
  }
  return `<svg class="viz tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="binary tree">${edges}${circles}</svg>`;
}

/** Logical 2-3 tree drawn with boxes. Input from ds.to23(). */
export function tree23Svg(root) {
  if (!root) return `<div class="viz-empty">empty tree</div>`;
  const KW = 34;
  const H = 26;
  const GAP = 14;
  const DY = 62;
  let cursor = 8;
  let maxDepth = 0;
  const boxes = [];
  const lay = (n, d) => {
    maxDepth = Math.max(maxDepth, d);
    const w = n.keys.length * KW;
    let x;
    if (!n.children.length) {
      x = cursor + w / 2;
      cursor += w + GAP;
    } else {
      const xs = n.children.map((c) => lay(c, d + 1));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    const box = { n, x, y: d * DY + 10, w };
    boxes.push(box);
    n._box = box;
    return x;
  };
  lay(root, 0);
  const W = Math.max(cursor, 60);
  const Ht = maxDepth * DY + H + 20;
  let lines = '';
  let shapes = '';
  for (const b of boxes) {
    b.n.children.forEach((c, idx) => {
      const k = b.n.children.length;
      const sx = b.x - b.w / 2 + (b.w * idx) / (k - 1 || 1);
      lines += `<line class="edge" x1="${k === 1 ? b.x : sx}" y1="${b.y + H}" x2="${c._box.x}" y2="${c._box.y}"/>`;
    });
    shapes += `<g class="box23"><rect x="${b.x - b.w / 2}" y="${b.y}" width="${b.w}" height="${H}" rx="6"/>`;
    b.n.keys.forEach((k, idx) => {
      const kx = b.x - b.w / 2 + KW * idx + KW / 2;
      shapes += `<text x="${kx}" y="${b.y + H / 2}">${esc(k)}</text>`;
      if (idx > 0) shapes += `<line class="divider" x1="${b.x - b.w / 2 + KW * idx}" y1="${b.y + 4}" x2="${b.x - b.w / 2 + KW * idx}" y2="${b.y + H - 4}"/>`;
    });
    shapes += '</g>';
  }
  for (const b of boxes) delete b.n._box;
  return `<svg class="viz tree23" viewBox="0 0 ${W} ${Ht}" width="${W}" height="${Ht}" role="img" aria-label="2-3 tree">${lines}${shapes}</svg>`;
}

/**
 * Graph on a circle. opts: directed, current (vertex), marked (bool[]), frontier (int[]),
 * activeEdge [v,w], treeEdges (edgeTo[]), labels (per-vertex small text).
 */
export function graphSvg(adj, opts = {}) {
  const V = adj.length;
  const size = opts.size || 300;
  const R = 16;
  const cx = size / 2;
  const cy = size / 2;
  const rad = V === 1 ? 0 : size / 2 - R - 14;
  const pos = Array.from({ length: V }, (_, v) => {
    const a = -Math.PI / 2 + (2 * Math.PI * v) / V;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });
  const tree = new Set();
  if (opts.treeEdges) opts.treeEdges.forEach((p, w) => p >= 0 && tree.add(`${p}-${w}`));
  const active = opts.activeEdge ? `${opts.activeEdge[0]}-${opts.activeEdge[1]}` : '';
  let lines = '';
  const drawn = new Set();
  for (let v = 0; v < V; v++) {
    for (const w of adj[v]) {
      const k = opts.directed ? `${v}-${w}` : v < w ? `${v}-${w}` : `${w}-${v}`;
      if (drawn.has(k)) continue;
      drawn.add(k);
      const isTree = tree.has(`${v}-${w}`) || (!opts.directed && tree.has(`${w}-${v}`));
      const isActive = active === `${v}-${w}` || (!opts.directed && active === `${w}-${v}`);
      let [x1, y1] = pos[v];
      let [x2, y2] = pos[w];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      x1 += (dx / len) * R;
      y1 += (dy / len) * R;
      x2 -= (dx / len) * (R + (opts.directed ? 4 : 0));
      y2 -= (dy / len) * (R + (opts.directed ? 4 : 0));
      const cls = ['edge', isTree ? 'tree' : '', isActive ? 'active' : ''].join(' ');
      lines += `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${opts.directed ? ' marker-end="url(#arrow)"' : ''}/>`;
    }
  }
  const frontier = new Set(opts.frontier || []);
  let circles = '';
  for (let v = 0; v < V; v++) {
    const [x, y] = pos[v];
    const cls = ['node', opts.marked?.[v] ? 'visited' : '', frontier.has(v) ? 'frontier' : '', opts.current === v ? 'hl' : ''].join(' ');
    circles += `<g class="${cls}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y}">${v}</text>`;
    if (opts.labels?.[v] !== undefined && opts.labels[v] !== '') circles += `<text class="sub" x="${x}" y="${y + R + 10}">${esc(opts.labels[v])}</text>`;
    circles += '</g>';
  }
  const defs = opts.directed
    ? '<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>'
    : '';
  return `<svg class="viz graph" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="graph">${defs}${lines}${circles}</svg>`;
}

/** Chains of a ChainTable as plain HTML rows. */
export function chainsHtml(table, highlightKey) {
  const rows = table.chains
    .map((chain, i) => {
      const cells = chain.map((k) => `<span class="chain-node${k === highlightKey ? ' hl' : ''}">${esc(typeof k === 'number' ? k : `"${k}"`)}</span>`).join('<span class="chain-arrow">→</span>');
      return `<div class="chain-row"><span class="chain-idx">${i}</span><span class="chain-cells">${cells || '<span class="chain-null">null</span>'}</span></div>`;
    })
    .join('');
  return `<div class="chains">${rows}</div>`;
}

/** Adjacency lists as a small HTML table (insertion order matters for DFS/BFS). */
export function adjListHtml(adj, directed) {
  return `<div class="adj">${adj.map((list, v) => `<div><b>${v}</b><span>${directed ? '→' : ':'}</span> ${list.length ? list.join(', ') : '<span class="muted">none</span>'}</div>`).join('')}</div>`;
}
