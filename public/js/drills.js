// Randomized tracing drills: predict what an algorithm does, then see a worked explanation.
import { BST, LLRB, preorder, inorder, postorder, levelorder, countRed, blackHeight, to23, levels23, applyOp, evalPostfix, fmtNum, infix, hashIndex, ChainTable, buildGraph, dfsTrace, bfsTrace, dfoTrace, hasDirectedCycle } from './ds.js';
import { treeSvg, tree23Svg, graphSvg, adjListHtml, chainsHtml } from './viz.js';

const list = (a) => a.join(' ');
const show = (a) => `<code>${a.join(', ')}</code>`;

function levelWithTree(keys) {
  const t = new BST(keys);
  return { t, level: levelorder(t.root) };
}

function randomExpr(rng, depth) {
  if (depth === 0 || (depth < 3 && rng.chance(0.3))) return { key: String(rng.int(1, 9)), left: null, right: null };
  const left = randomExpr(rng, depth - 1);
  const right = randomExpr(rng, depth - 1);
  let op = rng.pick(['+', '-', '*', '/']);
  if (op === '/' && evalTree(right) === 0) op = '+';
  return { key: op, left, right };
}

function evalTree(x) {
  if (!x.left) return Number(x.key);
  return applyOp(x.key, evalTree(x.left), evalTree(x.right));
}

function randomGraph(rng, directed, acyclic) {
  const V = rng.int(5, 7);
  const perm = rng.shuffle([...Array(V).keys()]);
  // A random spanning tree keeps every vertex reachable (so traces are never trivial),
  // then a few extra edges add cycles / cross edges. Edge order is shuffled because it
  // decides adjacency-list order, which is the whole point of these drills.
  const edges = [];
  for (let i = 1; i < V; i++) {
    const parent = perm[rng.int(0, i - 1)];
    edges.push(directed ? [parent, perm[i]] : rng.chance(0.5) ? [parent, perm[i]] : [perm[i], parent]);
  }
  const extra = rng.int(1, 3);
  for (let i = 0; i < extra; i++) {
    let a = rng.int(0, V - 1);
    let b = rng.int(0, V - 1);
    if (acyclic && perm.indexOf(a) > perm.indexOf(b)) [a, b] = [b, a];
    edges.push([a, b]);
  }
  if (directed && !acyclic) {
    const a = perm[rng.int(1, V - 1)];
    edges.push([a, perm[0]]);
  }
  const order = rng.shuffle(edges);
  const adj = buildGraph(V, order, directed);
  if (!directed) {
    // Make sure DFS/BFS from 0 actually explores: 0 must not be isolated.
    if (!adj[0].length) return randomGraph(rng, directed, acyclic);
  }
  return { V, adj };
}

export const DRILLS = [
  {
    id: 'recursion-trace',
    topic: 'java',
    title: 'Trace a recursive method',
    generate(rng) {
      const kind = rng.int(0, 2);
      let src;
      let f;
      let n;
      if (kind === 0) {
        const a = rng.int(1, 3);
        const b = rng.int(0, 2);
        const c = rng.int(0, 5);
        const d = rng.int(1, 6);
        src = `int f(int n) {\n    if (n <= ${b}) return ${c};\n    return f(n - ${a}) + ${d};\n}`;
        f = (x) => (x <= b ? c : f(x - a) + d);
        n = rng.int(5, 12);
      } else if (kind === 1) {
        src = `int f(int n) {\n    if (n == 0) return 0;\n    return (n % 2) + f(n / 2);\n}`;
        f = (x) => (x === 0 ? 0 : (x % 2) + f(Math.floor(x / 2)));
        n = rng.int(5, 60);
      } else {
        const k = rng.int(2, 3);
        src = `int f(int n) {\n    if (n < ${k}) return 1;\n    return f(n - 1) + f(n - ${k});\n}`;
        f = (x) => (x < k ? 1 : f(x - 1) + f(x - k));
        n = rng.int(4, 8);
      }
      const trace = [];
      for (let i = 0; i <= n; i++) trace.push(`f(${i}) = ${f(i)}`);
      return {
        prompt: `What does <code>f(${n})</code> return?`,
        visual: `<pre class="code-inline">${src}</pre>`,
        answer: String(f(n)),
        placeholder: 'a number',
        explain: `<p>Work bottom-up from the base case. Each value only needs smaller ones:</p><p class="mono">${trace.join('<br>')}</p>`,
      };
    },
  },
  {
    id: 'postfix-eval',
    topic: 'java',
    title: 'Evaluate postfix with a stack',
    generate(rng) {
      const tree = randomExpr(rng, 3);
      const tokens = postorder(tree);
      const { value, steps } = evalPostfix(tokens);
      return {
        prompt: 'Evaluate this postfix expression with the stack algorithm. Use real division.',
        visual: `<div class="big-tokens">${tokens.map((t) => `<span>${t}</span>`).join('')}</div>`,
        answer: fmtNum(value),
        placeholder: 'value, e.g. 3.5',
        explain: `<table class="mini trace"><tr><th>token</th><th>action</th><th>stack</th></tr>${steps.map((s) => `<tr><td>${s.token}</td><td>${s.note}</td><td>${s.stack.map(fmtNum).join(' ')}</td></tr>`).join('')}</table>`,
      };
    },
  },
  {
    id: 'traversal',
    topic: 'trees',
    title: 'Traversal order',
    generate(rng) {
      const keys = rng.distinct(rng.int(6, 9), 1, 60);
      const t = new BST(keys);
      const kind = rng.pick(['preorder', 'inorder', 'postorder', 'level order']);
      const fn = { preorder, inorder, postorder, 'level order': levelorder }[kind];
      const ans = fn(t.root);
      const rule = {
        preorder: 'node, then left subtree, then right subtree',
        inorder: 'left subtree, node, right subtree (sorted for a BST)',
        postorder: 'left subtree, right subtree, then node',
        'level order': 'row by row, left to right (queue)',
      }[kind];
      return {
        prompt: `List the keys in <b>${kind}</b>.`,
        visual: treeSvg(t.root),
        answer: list(ans),
        placeholder: 'keys separated by spaces',
        explain: `<p>${kind}: ${rule}.</p><p>${show(ans)}</p>`,
      };
    },
  },
  {
    id: 'expr-notation',
    topic: 'trees',
    title: 'Expression tree notation',
    generate(rng) {
      const tree = randomExpr(rng, 3);
      const kind = rng.pick(['postfix', 'prefix']);
      const ans = kind === 'postfix' ? postorder(tree) : preorder(tree);
      return {
        prompt: `Write <code>${infix(tree)}</code> in <b>${kind}</b> notation.`,
        visual: treeSvg(tree),
        answer: list(ans),
        placeholder: 'tokens separated by spaces',
        explain: `<p>${kind === 'postfix' ? 'Postfix = postorder traversal (children first, operator last).' : 'Prefix = preorder traversal (operator first).'}</p><p>${show(ans)}</p>`,
      };
    },
  },
  {
    id: 'bst-insert',
    topic: 'bst',
    title: 'Build a BST',
    generate(rng) {
      const keys = rng.distinct(rng.int(6, 8), 1, 50);
      const { t, level } = levelWithTree(keys);
      return {
        prompt: `Insert <code>${keys.join(', ')}</code> (in that order) into an empty BST. Give its <b>level order</b>.`,
        visual: '<div class="viz-empty">draw it on paper first</div>',
        answer: list(level),
        placeholder: 'keys separated by spaces',
        explain: `<div class="figure">${treeSvg(t.root)}</div><p>Each key walks down from the root, going left if smaller and right if larger, until it reaches an empty link. Level order: ${show(level)}</p>`,
      };
    },
  },
  {
    id: 'bst-query',
    topic: 'bst',
    title: 'floor / ceiling / rank / select',
    generate(rng) {
      const keys = rng.distinct(rng.int(7, 10), 1, 60);
      const t = new BST(keys);
      const sorted = [...keys].sort((a, b) => a - b);
      const op = rng.pick(['floor', 'ceiling', 'rank', 'select']);
      let arg;
      let ans;
      let why;
      if (op === 'select') {
        arg = rng.int(0, keys.length - 1);
        ans = t.select(arg);
        why = `select(${arg}) is the key with exactly ${arg} smaller keys, i.e. index ${arg} in sorted order ${show(sorted)}.`;
      } else {
        do arg = rng.int(0, 62);
        while (keys.includes(arg) && rng.chance(0.7));
        ans = op === 'floor' ? t.floor(arg) : op === 'ceiling' ? t.ceiling(arg) : t.rank(arg);
        why = {
          floor: `floor(${arg}) = largest key ≤ ${arg}.`,
          ceiling: `ceiling(${arg}) = smallest key ≥ ${arg}.`,
          rank: `rank(${arg}) = number of keys strictly less than ${arg}.`,
        }[op] + ` Sorted keys: ${show(sorted)}.`;
      }
      return {
        prompt: `What is <code>${op}(${arg})</code>? (type <code>null</code> if there is none)`,
        visual: treeSvg(t.root),
        answer: ans === null ? 'null' : String(ans),
        accept: ans === null ? ['null', 'none'] : undefined,
        placeholder: 'a key, a number, or null',
        explain: `<p>${why}</p><p>Answer: <b>${ans === null ? 'null' : ans}</b></p>`,
      };
    },
  },
  {
    id: 'bst-delete',
    topic: 'bst',
    title: 'Hibbard deletion',
    generate(rng) {
      let keys;
      let t;
      let target;
      for (;;) {
        keys = rng.distinct(rng.int(7, 9), 1, 60);
        t = new BST(keys);
        const two = [];
        const walk = (x) => {
          if (!x) return;
          if (x.left && x.right) two.push(x.key);
          walk(x.left);
          walk(x.right);
        };
        walk(t.root);
        if (two.length) {
          target = rng.pick(two);
          break;
        }
      }
      const before = treeSvg(t.root, { highlight: new Set([target]) });
      const log = t.delete(target);
      const level = levelorder(t.root);
      return {
        prompt: `Delete <b>${target}</b> using Hibbard deletion. Give the <b>level order</b> afterwards.`,
        visual: before,
        answer: list(level),
        placeholder: 'keys separated by spaces',
        explain: `<ul class="log">${log.map((l) => `<li>${l}</li>`).join('')}</ul><div class="figure">${treeSvg(t.root)}</div><p>${show(level)}</p>`,
      };
    },
  },
  {
    id: 'llrb-insert',
    topic: 'llrb',
    title: 'LLRB insertion',
    generate(rng) {
      const keys = rng.distinct(rng.int(5, 8), 1, 40);
      const t = new LLRB();
      const logs = keys.map((k) => ({ k, log: t.put(k) }));
      const kind = rng.pick(['root', 'red', 'level', 'black']);
      const q = {
        root: ['What key is at the <b>root</b>?', String(t.root.key)],
        red: ['How many <b>red links</b> are there?', String(countRed(t.root))],
        level: ['Give the <b>level order</b> of the red-black BST.', list(levelorder(t.root))],
        black: ['How many <b>black nodes</b> are on the path from the root to the leftmost null link?', String(blackHeight(t.root))],
      }[kind];
      return {
        prompt: `Insert <code>${keys.join(', ')}</code> into an empty left-leaning red-black BST. ${q[0]}`,
        visual: '<div class="viz-empty">trace it on paper: insert red, then apply the three fixes on the way up</div>',
        answer: q[1],
        placeholder: kind === 'level' ? 'keys separated by spaces' : 'a key or a number',
        explain: `<ol class="log">${logs.map(({ k, log }) => `<li><b>put ${k}</b><ul>${log.map((l) => `<li>${l}</li>`).join('')}</ul></li>`).join('')}</ol><div class="figure two">${treeSvg(t.root)}${tree23Svg(to23(t.root))}</div><p>Answer: <b>${q[1]}</b></p>`,
      };
    },
  },
  {
    id: 'llrb-23',
    topic: 'llrb',
    title: 'See the 2-3 tree',
    generate(rng) {
      const keys = rng.distinct(rng.int(6, 10), 1, 50);
      const t = new LLRB(keys);
      const lv = levels23(to23(t.root));
      const kind = rng.pick(['root', 'threes']);
      const threes = lv.flat().filter((k) => k.length === 2).length;
      const q = kind === 'root'
        ? [`Which key(s) are in the <b>root node of the equivalent 2-3 tree</b>? (smaller first)`, list(lv[0][0])]
        : ['How many <b>3-nodes</b> does the equivalent 2-3 tree have?', String(threes)];
      return {
        prompt: q[0],
        visual: treeSvg(t.root),
        answer: q[1],
        placeholder: 'key(s) or a number',
        explain: `<p>Each red link glues a node to its parent into one 2-3 node.</p><div class="figure">${tree23Svg(to23(t.root))}</div><p>Answer: <b>${q[1]}</b></p>`,
      };
    },
  },
  {
    id: 'hash-index',
    topic: 'hash',
    title: 'Compute chain indices',
    generate(rng) {
      const m = rng.int(5, 13);
      const keys = Array.from({ length: 4 }, () => (rng.chance(0.35) ? -rng.int(1, 200) : rng.int(0, 300)));
      const idx = keys.map((k) => hashIndex(k, m));
      return {
        prompt: `Integer keys hash to their own value. With <code>m = ${m}</code>, give <code>(key.hashCode() &amp; 0x7fffffff) % m</code> for each key, in order.`,
        visual: `<div class="big-tokens">${keys.map((k) => `<span>${k}</span>`).join('')}</div>`,
        answer: list(idx),
        placeholder: 'indices separated by spaces',
        explain: `<table class="mini trace"><tr><th>key</th><th>&amp; 0x7fffffff</th><th>% ${m}</th></tr>${keys.map((k, i) => `<tr><td>${k}</td><td>${k & 0x7fffffff}</td><td><b>${idx[i]}</b></td></tr>`).join('')}</table><p>Negative ints become huge positive numbers after masking (the sign bit is cleared), not their absolute value.</p>`,
      };
    },
  },
  {
    id: 'hash-chain',
    topic: 'hash',
    title: 'Chains after insertion',
    generate(rng) {
      const m = rng.int(3, 5);
      const keys = rng.distinct(rng.int(6, 9), 0, 40);
      const table = new ChainTable(m, 99, false);
      for (const k of keys) table.put(k);
      const i = rng.pick(table.chains.map((c, j) => j).filter((j) => table.chains[j].length > 0));
      return {
        prompt: `Insert <code>${keys.join(', ')}</code> into a separate-chaining table with <code>m = ${m}</code> (hash = key % m; new keys go at the <b>front</b> of their chain). List chain <b>${i}</b> from front to back.`,
        visual: '<div class="viz-empty">compute key % m for each key</div>',
        answer: list(table.chains[i]),
        placeholder: 'keys separated by spaces',
        explain: `<div class="figure">${chainsHtml(table)}</div><p>Chain ${i}: ${show(table.chains[i])}. Inserting at the front means the most recent key comes first.</p>`,
      };
    },
  },
  {
    id: 'graph-dfs',
    topic: 'graphs',
    title: 'DFS order',
    generate(rng) {
      const { adj } = randomGraph(rng, false, false);
      const s = 0;
      const r = dfsTrace(adj, s);
      const kind = rng.pick(['order', 'edgeTo']);
      const ans = kind === 'order' ? list(r.order) : list(r.edgeTo);
      return {
        prompt: kind === 'order'
          ? `Run recursive DFS from <b>${s}</b>, visiting neighbours in the adjacency-list order shown. In what order are vertices <b>first visited</b>?`
          : `Run recursive DFS from <b>${s}</b>. Give <code>edgeTo[0..V-1]</code> (use -1 for the source and for unreached vertices).`,
        visual: `<div class="figure two">${graphSvg(adj, { size: 220 })}${adjListHtml(adj)}</div>`,
        answer: ans,
        placeholder: 'numbers separated by spaces',
        explain: `<ol class="log">${r.steps.map((st) => `<li>${st.note}</li>`).join('')}</ol><p>order: ${show(r.order)} · edgeTo: ${show(r.edgeTo)}</p>`,
      };
    },
  },
  {
    id: 'graph-bfs',
    topic: 'graphs',
    title: 'BFS order & distances',
    generate(rng) {
      const { adj } = randomGraph(rng, false, false);
      const s = 0;
      const r = bfsTrace(adj, s);
      const kind = rng.pick(['order', 'distTo']);
      const ans = kind === 'order' ? list(r.order) : list(r.distTo);
      return {
        prompt: kind === 'order'
          ? `Run BFS from <b>${s}</b> using the adjacency lists shown. In what order are vertices <b>dequeued</b>?`
          : `Run BFS from <b>${s}</b>. Give <code>distTo[0..V-1]</code> (use -1 for unreachable).`,
        visual: `<div class="figure two">${graphSvg(adj, { size: 220 })}${adjListHtml(adj)}</div>`,
        answer: ans,
        placeholder: 'numbers separated by spaces',
        explain: `<ol class="log">${r.steps.map((st) => `<li>${st.note} <span class="muted">queue: [${st.frontier.join(', ')}]</span></li>`).join('')}</ol><p>order: ${show(r.order)} · distTo: ${show(r.distTo)}</p>`,
      };
    },
  },
  {
    id: 'digraph-order',
    topic: 'digraphs',
    title: 'Postorder & reverse postorder',
    generate(rng) {
      const { adj } = randomGraph(rng, true, true);
      const r = dfoTrace(adj);
      const kind = rng.pick(['post', 'reversePost', 'pre']);
      const name = { pre: 'preorder', post: 'postorder', reversePost: 'reverse postorder' }[kind];
      return {
        prompt: `Run DFS over all vertices (start from 0, then the next unmarked vertex, and so on), following the adjacency lists in order. Give the <b>${name}</b>.`,
        visual: `<div class="figure two">${graphSvg(adj, { size: 220, directed: true })}${adjListHtml(adj, true)}</div>`,
        answer: list(r[kind]),
        placeholder: 'vertices separated by spaces',
        explain: `<ol class="log">${r.steps.map((st) => `<li>${st.note}</li>`).join('')}</ol><p>pre: ${show(r.pre)} · post: ${show(r.post)} · reverse post: ${show(r.reversePost)}</p>`,
      };
    },
  },
  {
    id: 'digraph-cycle',
    topic: 'digraphs',
    title: 'Cycle or topological order?',
    generate(rng) {
      const acyclic = rng.chance(0.5);
      const { adj } = randomGraph(rng, true, acyclic);
      const cyc = hasDirectedCycle(adj);
      const r = dfoTrace(adj);
      return {
        prompt: 'If this digraph has a directed cycle, type <code>cycle</code>. Otherwise give its topological order as the <b>reverse postorder</b> of DFS from 0, 1, 2, …',
        visual: `<div class="figure two">${graphSvg(adj, { size: 220, directed: true })}${adjListHtml(adj, true)}</div>`,
        answer: cyc ? 'cycle' : list(r.reversePost),
        placeholder: '"cycle" or vertices separated by spaces',
        explain: cyc
          ? '<p>There is a directed cycle: during DFS some edge points back to a vertex that is still on the current path (onStack), so no topological order exists.</p>'
          : `<p>No directed cycle. Postorder ${show(r.post)}, reversed: ${show(r.reversePost)}. Every edge points from earlier to later in that list.</p>`,
      };
    },
  },
];

export const drillById = (id) => DRILLS.find((d) => d.id === id);
