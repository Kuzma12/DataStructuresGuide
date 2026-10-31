// Interactive labs embedded in lessons and on the Labs page.
import { BST, LLRB, preorder, inorder, postorder, levelorder, height, countRed, blackHeight, to23, tokenize, parseExpr, evalPostfix, fmtNum, ChainTable, fmtKey, buildGraph, dfsTrace, bfsTrace, dfoTrace, parseEdges } from './ds.js';
import { treeSvg, tree23Svg, graphSvg, chainsHtml, adjListHtml } from './viz.js';
import { esc } from './ui.js';
import { Rng, newSeed } from './rng.js';

export const LABS = {
  bst: { title: 'BST lab', blurb: 'Insert and delete keys and watch every comparison.', mount: (el) => treeLab(el, 'bst') },
  llrb: { title: 'Red-black lab', blurb: 'Insert keys and see each rotation and color flip, next to the equivalent 2-3 tree.', mount: (el) => treeLab(el, 'llrb') },
  hash: { title: 'Hash table lab', blurb: 'Separate chaining with a configurable load limit and resizing.', mount: hashLab },
  graph: { title: 'Graph search lab', blurb: 'Step through DFS and BFS one action at a time.', mount: (el) => graphLab(el, false) },
  digraph: { title: 'Digraph order lab', blurb: 'Step through DFS orders and see pre, post and reverse postorder.', mount: (el) => graphLab(el, true) },
  expr: { title: 'Expression lab', blurb: 'Tokens → tree → postfix → stack evaluation.', mount: exprLab },
};

const parseKeys = (text) =>
  text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((s) => (/^-?\d+$/.test(s) ? Number(s) : s));

/* ------------------------------------------------------------------ tree lab */

function treeLab(el, kind) {
  const isBst = kind === 'bst';
  let tree = isBst ? new BST() : new LLRB();
  let log = [];
  let last = new Set();
  let view = 'both';
  el.innerHTML = `
    <div class="lab">
      <div class="lab-bar">
        <input class="input" data-k="keys" placeholder="${isBst ? 'e.g. 50 30 70 20 40' : 'e.g. S E A R C H'}" aria-label="keys">
        <button class="btn primary" data-a="insert">Insert</button>
        ${isBst ? '<button class="btn" data-a="delete">Delete</button>' : ''}
        <button class="btn ghost" data-a="random">Random</button>
        <button class="btn ghost" data-a="clear">Clear</button>
        ${isBst ? '' : `<div class="seg" role="tablist"><button data-v="rb">Red-black</button><button data-v="both" class="on">Both</button><button data-v="23">2-3</button></div>`}
      </div>
      <div class="lab-stage" data-k="stage"></div>
      <div class="lab-info" data-k="info"></div>
      <div class="lab-log" data-k="log"></div>
    </div>`;
  const $ = (k) => el.querySelector(`[data-k="${k}"]`);
  const input = $('keys');

  const render = () => {
    const rb = treeSvg(tree.root, { highlight: last });
    if (isBst) $('stage').innerHTML = rb;
    else {
      const two = tree23Svg(to23(tree.root));
      $('stage').innerHTML = view === 'rb' ? rb : view === '23' ? two : `<div class="figure two">${rb}${two}</div>`;
    }
    const r = tree.root;
    $('info').innerHTML = isBst
      ? `<span><b>size</b> ${tree.size()}</span><span><b>height</b> ${height(r)}</span><span><b>pre</b> ${preorder(r).join(' ') || '–'}</span><span><b>in</b> ${inorder(r).join(' ') || '–'}</span><span><b>post</b> ${postorder(r).join(' ') || '–'}</span><span><b>level</b> ${levelorder(r).join(' ') || '–'}</span>`
      : `<span><b>size</b> ${tree.size()}</span><span><b>height</b> ${height(r)}</span><span><b>red links</b> ${countRed(r)}</span><span><b>black height</b> ${blackHeight(r)}</span>`;
    $('log').innerHTML = log.length ? `<ol>${log.map((l) => `<li>${l}</li>`).join('')}</ol>` : '<p class="muted">Each operation’s steps will appear here.</p>';
  };

  const run = (action) => {
    const keys = parseKeys(input.value);
    if (action === 'clear') {
      tree = isBst ? new BST() : new LLRB();
      log = [];
      last = new Set();
    } else if (action === 'random') {
      const rng = new Rng(newSeed());
      tree = isBst ? new BST() : new LLRB();
      log = [];
      const ks = rng.distinct(10, 1, 99);
      for (const k of ks) tree.put(k);
      log.push(`inserted ${ks.join(', ')}`);
      last = new Set();
    } else if (keys.length) {
      log = [];
      for (const k of keys) {
        log.push(`<b>${action} ${esc(k)}</b>`);
        const steps = action === 'insert' ? tree.put(k) : tree.delete(k);
        log.push(...steps.map((s) => `<span class="indent">${s}</span>`));
      }
      last = new Set(keys);
      input.value = '';
    }
    render();
  };

  el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => run(b.dataset.a)));
  input.addEventListener('keydown', (e) => e.key === 'Enter' && run('insert'));
  el.querySelectorAll('[data-v]').forEach((b) =>
    b.addEventListener('click', () => {
      view = b.dataset.v;
      el.querySelectorAll('[data-v]').forEach((x) => x.classList.toggle('on', x === b));
      render();
    }),
  );
  render();
}

/* ------------------------------------------------------------------ hash lab */

function hashLab(el) {
  let table = new ChainTable(4, 2, true);
  let log = [];
  let lastKey;
  el.innerHTML = `
    <div class="lab">
      <div class="lab-bar">
        <label class="field">m <input class="input sm" type="number" min="1" max="31" value="4" data-k="m"></label>
        <label class="field">max load <input class="input sm" type="number" min="1" max="10" value="2" data-k="load"></label>
        <label class="field check"><input type="checkbox" data-k="resizable" checked> resizable</label>
        <button class="btn ghost" data-a="reset">Apply / reset</button>
      </div>
      <div class="lab-bar">
        <input class="input" data-k="key" placeholder='keys: words or ints, e.g. tree heap 42' aria-label="key">
        <button class="btn primary" data-a="put">Put</button>
        <button class="btn ghost" data-a="random">Random words</button>
      </div>
      <div class="lab-info" data-k="info"></div>
      <div class="lab-stage" data-k="stage"></div>
      <div class="lab-log" data-k="log"></div>
    </div>`;
  const $ = (k) => el.querySelector(`[data-k="${k}"]`);
  const render = () => {
    $('info').innerHTML = `<span><b>n</b> ${table.n}</span><span><b>m</b> ${table.m}</span><span><b>load n/m</b> ${(table.n / table.m).toFixed(2)}</span><span><b>doubles when</b> n ≥ ${table.maxLoad} × m${table.resizable ? '' : ' (off)'}</span>`;
    $('stage').innerHTML = chainsHtml(table, lastKey);
    $('log').innerHTML = log.length ? `<ol>${log.map((l) => `<li>${l}</li>`).join('')}</ol>` : '<p class="muted">Put a key to see its hash computation.</p>';
  };
  const reset = () => {
    table = new ChainTable(Math.max(1, Number($('m').value) || 4), Math.max(1, Number($('load').value) || 2), $('resizable').checked);
    log = [];
    lastKey = undefined;
    render();
  };
  const put = (keys) => {
    log = [];
    for (const k of keys) {
      log.push(`<b>put ${esc(fmtKey(k))}</b>`);
      log.push(...table.put(k).map((s) => `<span class="indent">${s}</span>`));
      lastKey = k;
    }
    render();
  };
  el.querySelector('[data-a="reset"]').addEventListener('click', reset);
  el.querySelector('[data-a="put"]').addEventListener('click', () => {
    put(parseKeys($('key').value));
    $('key').value = '';
  });
  $('key').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      put(parseKeys($('key').value));
      $('key').value = '';
    }
  });
  el.querySelector('[data-a="random"]').addEventListener('click', () => {
    const rng = new Rng(newSeed());
    const pool = ['tree', 'heap', 'hash', 'node', 'edge', 'stack', 'queue', 'graph', 'trie', 'list', 'map', 'set', 'key', 'root', 'leaf', 'path'];
    put(rng.shuffle(pool).slice(0, 5));
  });
  render();
}

/* ------------------------------------------------------------------ graph lab */

function graphLab(el, directed) {
  let V = 7;
  let edgesText = directed ? '0-1 0-2 1-3 2-3 3-4 5-4 6-5' : '0-1 0-2 1-3 2-3 3-4 4-5 5-6 1-4';
  let algo = directed ? 'dfo' : 'dfs';
  let source = 0;
  let adj;
  let trace;
  let step = 0;
  let timer = null;
  el.innerHTML = `
    <div class="lab">
      <div class="lab-bar">
        <label class="field">V <input class="input sm" type="number" min="1" max="12" value="${V}" data-k="V"></label>
        <input class="input grow" data-k="edges" value="${edgesText}" aria-label="edges" title="Edges like 0-1 1-2 (order matters: it is the adjacency-list order)">
        <button class="btn ghost" data-a="random">Random</button>
      </div>
      <div class="lab-bar">
        ${directed ? '<span class="pill">DepthFirstOrder over all vertices</span>' : `<div class="seg"><button data-algo="dfs" class="on">DFS</button><button data-algo="bfs">BFS</button></div>
        <label class="field">from <select class="input sm" data-k="source"></select></label>`}
        <div class="stepper">
          <button class="btn icon" data-s="first" title="Start" aria-label="Start">⏮</button>
          <button class="btn icon" data-s="prev" title="Previous step" aria-label="Previous">◀</button>
          <button class="btn icon primary" data-s="play" title="Play / pause" aria-label="Play">▶</button>
          <button class="btn icon" data-s="next" title="Next step" aria-label="Next">▶▶</button>
          <button class="btn icon" data-s="last" title="End" aria-label="End">⏭</button>
          <span class="muted" data-k="count"></span>
        </div>
      </div>
      <div class="graph-lab">
        <div data-k="stage" class="lab-stage"></div>
        <div class="graph-side">
          <div class="note" data-k="note"></div>
          <div data-k="arrays"></div>
          <div data-k="adj"></div>
        </div>
      </div>
    </div>`;
  const $ = (k) => el.querySelector(`[data-k="${k}"]`);

  const rebuild = () => {
    V = Math.max(1, Math.min(12, Number($('V').value) || 1));
    adj = buildGraph(V, parseEdges($('edges').value), directed);
    if (!directed) {
      source = Math.min(source, V - 1);
      $('source').innerHTML = Array.from({ length: V }, (_, v) => `<option ${v === source ? 'selected' : ''}>${v}</option>`).join('');
    }
    trace = directed ? dfoTrace(adj) : algo === 'dfs' ? dfsTrace(adj, source) : bfsTrace(adj, source);
    step = 0;
    render();
  };

  const row = (label, arr) => `<tr><th>${label}</th>${arr.map((x) => `<td>${x === true ? '✓' : x === false ? '' : x}</td>`).join('')}</tr>`;

  const render = () => {
    const s = trace.steps[step] || {};
    const labels = directed ? undefined : (s.distTo || []).map((d) => (d >= 0 ? `d=${d}` : ''));
    $('stage').innerHTML = graphSvg(adj, { directed, current: s.current, marked: s.marked, frontier: s.frontier, activeEdge: s.edge, treeEdges: directed ? undefined : s.edgeTo, labels, size: 300 });
    $('note').innerHTML = `<b>Step ${step + 1}</b> · ${s.note || ''}`;
    $('count').textContent = `${step + 1} / ${trace.steps.length}`;
    const header = `<tr><th></th>${adj.map((_, v) => `<th>${v}</th>`).join('')}</tr>`;
    let html = `<table class="mini arr">${header}${row('marked', s.marked || [])}`;
    if (s.edgeTo) html += row('edgeTo', s.edgeTo);
    if (s.distTo) html += row('distTo', s.distTo);
    html += '</table>';
    const frontierName = directed || algo === 'dfs' ? 'call stack' : 'queue';
    html += `<p><b>${frontierName}</b> [${(s.frontier || []).join(', ')}]</p>`;
    if (directed) html += `<p><b>pre</b> ${s.pre.join(' ') || '–'}<br><b>post</b> ${s.post.join(' ') || '–'}${step === trace.steps.length - 1 ? `<br><b>reverse post</b> ${trace.reversePost.join(' ')}` : ''}</p>`;
    else html += `<p><b>order</b> ${(s.order || []).join(' ') || '–'}</p>`;
    $('arrays').innerHTML = html;
    $('adj').innerHTML = adjListHtml(adj, directed);
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
    el.querySelector('[data-s="play"]').textContent = '▶';
  };

  el.querySelectorAll('[data-s]').forEach((b) =>
    b.addEventListener('click', () => {
      const a = b.dataset.s;
      if (a === 'play') {
        if (timer) return stop();
        b.textContent = '❚❚';
        timer = setInterval(() => {
          if (step >= trace.steps.length - 1) return stop();
          step++;
          render();
        }, 700);
        return;
      }
      stop();
      if (a === 'first') step = 0;
      if (a === 'prev') step = Math.max(0, step - 1);
      if (a === 'next') step = Math.min(trace.steps.length - 1, step + 1);
      if (a === 'last') step = trace.steps.length - 1;
      render();
    }),
  );
  el.querySelectorAll('[data-algo]').forEach((b) =>
    b.addEventListener('click', () => {
      algo = b.dataset.algo;
      el.querySelectorAll('[data-algo]').forEach((x) => x.classList.toggle('on', x === b));
      stop();
      rebuild();
    }),
  );
  $('source')?.addEventListener('change', (e) => {
    source = Number(e.target.value);
    stop();
    rebuild();
  });
  $('V').addEventListener('change', () => (stop(), rebuild()));
  $('edges').addEventListener('change', () => (stop(), rebuild()));
  el.querySelector('[data-a="random"]').addEventListener('click', () => {
    const rng = new Rng(newSeed());
    const n = rng.int(5, 8);
    const perm = rng.shuffle([...Array(n).keys()]);
    const edges = [];
    for (let i = 0; i < n + 2; i++) {
      let a = rng.int(0, n - 1);
      let b = rng.int(0, n - 1);
      if (a === b) continue;
      if (directed && perm.indexOf(a) > perm.indexOf(b)) [a, b] = [b, a];
      edges.push(`${a}-${b}`);
    }
    $('V').value = n;
    $('edges').value = edges.join(' ');
    edgesText = $('edges').value;
    stop();
    rebuild();
  });
  rebuild();
}

/* ------------------------------------------------------------------ expression lab */

function exprLab(el) {
  el.innerHTML = `
    <div class="lab">
      <div class="lab-bar">
        <input class="input grow mono" data-k="expr" value="(2+(4*5))" aria-label="fully parenthesized expression">
        <button class="btn primary" data-a="go">Parse</button>
      </div>
      <div data-k="out"></div>
    </div>`;
  const input = el.querySelector('[data-k="expr"]');
  const out = el.querySelector('[data-k="out"]');
  const go = () => {
    try {
      const tokens = tokenize(input.value);
      const tree = parseExpr(tokens);
      const post = postorder(tree);
      const { value, steps } = evalPostfix(post);
      out.innerHTML = `
        <h4>1 · Tokens</h4>
        <div class="tokens">${tokens.map((t) => `<span class="tok ${t.type}">${esc(t.text)}<small>${t.type}</small></span>`).join('')}</div>
        <h4>2 · Tree</h4>
        <div class="lab-stage">${treeSvg(tree)}</div>
        <h4>3 · Postfix (post-order)</h4>
        <div class="big-tokens">${post.map((t) => `<span>${t}</span>`).join('')}</div>
        <h4>4 · Stack evaluation</h4>
        <table class="mini trace"><tr><th>token</th><th>action</th><th>stack</th></tr>${steps.map((s) => `<tr><td>${s.token}</td><td>${s.note}</td><td>${s.stack.map(fmtNum).join(' ')}</td></tr>`).join('')}</table>
        <p><b>Result:</b> ${fmtNum(value)}</p>`;
    } catch (err) {
      out.innerHTML = `<p class="error">${esc(err.message)}. Use single digits, + - * /, and wrap <em>every</em> operator in parentheses, e.g. ((1+2)*(3-4)).</p>`;
    }
  };
  el.querySelector('[data-a="go"]').addEventListener('click', go);
  input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
  go();
}
