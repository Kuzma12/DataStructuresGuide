// Animated walkthroughs: each one runs a real algorithm step by step and records frames
// ({line, say, scene, vars}). Narration is written in plain, short sentences on purpose.
import { scene, tree, row, stack, graph, chains, caption, snap, circleLayout } from './scenes.js';
import { BST, tokenize, parseExpr, postorder as postorderKeys, applyOp, fmtNum, buildGraph, parseEdges, javaHashCode, hashIndex } from '../ds.js';
import { Rng, newSeed } from '../rng.js';

const keysOf = (s) =>
  String(s)
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((k) => (/^-?\d+$/.test(k) ? Number(k) : k));

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const rngKeys = (n, hi = 90) => new Rng(newSeed()).distinct(n, 1, hi).join(' ');

function recorder() {
  const frames = [];
  return {
    frames,
    add(line, say, sc, vars) {
      frames.push({ line, say, scene: sc, vars });
    },
  };
}

/* ================================================================== recursion */

const recursionSum = {
  id: 'recursion',
  topic: 'java',
  title: 'Recursion and the call stack',
  intro: 'A method that calls itself. Watch each call wait in a box on the call stack until the smaller call gives it an answer.',
  code: `static int sumDigits(int n) {
    if (n < 10) {
        return n;
    }
    int rest = sumDigits(n / 10);
    return n % 10 + rest;
}`,
  inputs: [{ id: 'n', label: 'n =', value: '4721' }],
  random: () => ({ n: String(new Rng(newSeed()).int(100, 99999)) }),
  build({ n }) {
    const start = Number(n);
    if (!Number.isInteger(start) || start < 0 || start > 999999999) throw new Error('Pick a whole number from 0 to 999,999,999.');
    const r = recorder();
    const calls = [];
    const pic = () =>
      scene([stack('calls', calls.map((c, d) => ({ id: d, text: c.text, cls: c.cls })), 20, 10, { width: 210, slots: Math.max(4, String(start).length), title: 'call stack' })]);
    const go = (v, depth) => {
      calls.push({ text: `sumDigits(${v})`, cls: 'cur' });
      r.add(1, `We call <b>sumDigits(${v})</b>. Java gives every call its own box on the <b>call stack</b>.`, pic(), { n: v });
      if (v < 10) {
        r.add(2, `Is ${v} smaller than 10? <b>Yes.</b> It is just one digit.`, pic(), { n: v });
        calls[depth] = { text: `sumDigits(${v}) = ${v}`, cls: 'done' };
        r.add(3, `This is the <b>base case</b>: the answer is simply ${v}. No more calls needed.`, pic(), { n: v });
        return v;
      }
      r.add(2, `Is ${v} smaller than 10? <b>No</b>, it has more than one digit.`, pic(), { n: v });
      calls[depth].cls = 'wait';
      r.add(5, `First we need the sum of the digits of <b>${Math.floor(v / 10)}</b> (that is ${v} without its last digit). This box has to <b>wait</b>.`, pic(), { n: v });
      const rest = go(Math.floor(v / 10), depth + 1);
      calls.pop();
      calls[depth].cls = 'cur';
      r.add(5, `The box on top finished and disappeared. It handed back <b>${rest}</b>, so rest = ${rest}.`, pic(), { n: v, rest });
      const ans = (v % 10) + rest;
      calls[depth] = { text: `sumDigits(${v}) = ${ans}`, cls: 'done' };
      r.add(6, `Now this call can finish: last digit <b>${v % 10}</b> + rest <b>${rest}</b> = <b>${ans}</b>.`, pic(), { n: v, rest, answer: ans });
      return ans;
    };
    const ans = go(start, 0);
    r.add(null, `All done: <b>sumDigits(${start}) = ${ans}</b>. 🎉 Notice how each box waited for the box on top of it. That is how every recursive method works.`, pic(), { answer: ans });
    return r.frames;
  },
};

/* ================================================================== postfix with a stack */

const postfix = {
  id: 'postfix',
  topic: 'java',
  title: 'Evaluating postfix with a stack',
  intro: 'Numbers go onto a stack. An operator takes the top two numbers off, does the math, and puts the answer back.',
  code: `Stack<Double> stack = new Stack<>();
for (String t : tokens) {
    if (isNumber(t)) {
        stack.push(Double.parseDouble(t));
    } else {
        double right = stack.pop();
        double left = stack.pop();
        stack.push(apply(t, left, right));
    }
}
return stack.pop();`,
  inputs: [{ id: 'expr', label: 'Expression', value: '((7-2)*(3+1))', wide: true }],
  random: () => ({ expr: ['((7-2)*(3+1))', '(9-(4/2))', '((1+2)*(8-(6/3)))', '(5*(4-(2+1)))', '((8/2)-(3*1))'][new Rng(newSeed()).int(0, 4)] }),
  build({ expr }) {
    const tokens = postorderKeys(parseExpr(tokenize(expr)));
    const r = recorder();
    const st = [];
    let nextId = 0;
    const pic = (at, note) =>
      scene([
        row('tok', tokens.map((t, k) => ({ id: k, text: t, cls: k === at ? 'cur' : k < at ? 'used' : '' })), 10, 10, { title: 'tokens', labelWidth: 60 }),
        stack('st', st, 90, 64, { width: 90, slots: 4, title: 'stack' }),
        note ? caption('note', 220, 140, note) : null,
      ]);
    r.add(1, `The postfix form of <b>${expr}</b> is <b>${tokens.join(' ')}</b>. We start with an empty stack.`, pic(-1));
    tokens.forEach((t, k) => {
      r.add(2, `Next token: <b>${t}</b>.`, pic(k), { t });
      if (!'+-*/'.includes(t)) {
        st.push({ id: nextId++, text: t, cls: 'new' });
        r.add([3, 4], `${t} is a number, so we <b>push</b> it on top of the stack.`, pic(k), { t });
        st[st.length - 1].cls = '';
      } else {
        const right = st.pop();
        r.add(6, `${t} is an operator. <b>Pop</b> the top number: ${right.text}. It is the <b>right</b> side.`, pic(k, `right = ${right.text}`), { t, right: right.text });
        const left = st.pop();
        r.add(7, `Pop again: ${left.text}. It is the <b>left</b> side. (The order matters for − and ÷!)`, pic(k, `left = ${left.text}, right = ${right.text}`), { t, left: left.text, right: right.text });
        const v = fmtNum(applyOp(t, Number(left.text), Number(right.text)));
        st.push({ id: nextId++, text: v, cls: 'new' });
        r.add(8, `Compute ${left.text} ${t} ${right.text} = <b>${v}</b> and push the answer.`, pic(k, `${left.text} ${t} ${right.text} = ${v}`), { t, left: left.text, right: right.text });
        st[st.length - 1].cls = '';
      }
    });
    r.add(11, `No tokens left. The one number on the stack, <b>${st[0].text}</b>, is the answer. 🎉`, pic(tokens.length), { answer: st[0].text });
    return r.frames;
  },
};

/* ================================================================== traversals */

const TRAVERSAL_CODE = {
  pre: `void preorder(Node x) {
    if (x == null) return;
    visit(x);
    preorder(x.left);
    preorder(x.right);
}`,
  in: `void inorder(Node x) {
    if (x == null) return;
    inorder(x.left);
    visit(x);
    inorder(x.right);
}`,
  post: `void postorder(Node x) {
    if (x == null) return;
    postorder(x.left);
    postorder(x.right);
    visit(x);
}`,
};

function traversalWalk(kind) {
  const lines = { pre: { visit: 3, left: 4, right: 5 }, in: { left: 3, visit: 4, right: 5 }, post: { left: 3, right: 4, visit: 5 } }[kind];
  const names = { pre: 'preorder', in: 'inorder', post: 'postorder' };
  return (keysText) => {
    const t = new BST(keysOf(keysText));
    if (!t.root) throw new Error('Type a few keys first.');
    const r = recorder();
    const out = [];
    const mark = {};
    const pic = (at) => {
      const tr = tree(snap(t.root), { mark: { ...mark, ...(at ? { [at]: `${mark[at] || ''} cur` } : {}) }, pointer: at ? { key: at } : null });
      return scene([tr, row('out', out.map((k) => ({ id: k, text: String(k), cls: 'done' })), 10, tr.h + 22, { title: 'visited' })]);
    };
    const go = (x) => {
      mark[x.key] = mark[x.key] || 'path';
      r.add(1, `We are at node <b>${x.key}</b>.`, pic(x.key), { x: x.key });
      const order = kind === 'pre' ? ['visit', 'left', 'right'] : kind === 'in' ? ['left', 'visit', 'right'] : ['left', 'right', 'visit'];
      for (const stepName of order) {
        if (stepName === 'visit') {
          out.push(x.key);
          mark[x.key] = 'done';
          r.add(lines.visit, `<b>Visit ${x.key}</b>: write it down.`, pic(x.key), { x: x.key });
        } else {
          const child = x[stepName];
          if (!child) r.add([lines[stepName], 2], `${x.key}'s ${stepName} side is empty (null), so that call stops right away.`, pic(x.key), { x: x.key });
          else {
            r.add(lines[stepName], `Go to the <b>${stepName}</b> subtree of ${x.key}.`, pic(x.key), { x: x.key });
            go(child);
            r.add(lines[stepName], `Back at <b>${x.key}</b>: its ${stepName} subtree is finished.`, pic(x.key), { x: x.key });
          }
        }
      }
    };
    r.add(1, `Let's do a <b>${names[kind]}</b> traversal. The rule: ${kind === 'pre' ? 'node first, then left, then right' : kind === 'in' ? 'left first, then the node, then right' : 'left, then right, and the node last'}.`, pic(null));
    go(t.root);
    r.add(null, `Finished! ${names[kind]} order: <b>${out.join(', ')}</b>.${kind === 'in' ? ' Notice that it is sorted. Inorder always is, in a BST.' : ''}`, pic(null));
    return r.frames;
  };
}

const traversal = {
  id: 'traversal',
  topic: 'trees',
  title: 'Tree traversals',
  intro: 'Visit every node exactly once. Pre-, in- and post-order only differ in WHEN we write the node down.',
  get code() {
    return TRAVERSAL_CODE[this._kind || 'in'];
  },
  inputs: [
    { id: 'keys', label: 'Keys', value: '50 30 70 20 40 60 80', wide: true },
    { id: 'kind', label: 'Order', value: 'in', options: [{ value: 'pre', label: 'Preorder' }, { value: 'in', label: 'Inorder' }, { value: 'post', label: 'Postorder' }] },
  ],
  random: () => ({ keys: rngKeys(7) }),
  build({ keys, kind }) {
    return traversalWalk(kind)(keys);
  },
};

const levelOrder = {
  id: 'level-order',
  topic: 'trees',
  title: 'Level order with a queue',
  intro: 'Visit the tree row by row. A queue works like a line at a store: first in, first out.',
  code: `Queue<Node> q = new LinkedList<>();
q.add(root);
while (!q.isEmpty()) {
    Node x = q.remove();
    visit(x);
    if (x.left != null) q.add(x.left);
    if (x.right != null) q.add(x.right);
}`,
  inputs: [{ id: 'keys', label: 'Keys', value: '50 30 70 20 40 60 80', wide: true }],
  random: () => ({ keys: rngKeys(8) }),
  build({ keys }) {
    const t = new BST(keysOf(keys));
    if (!t.root) throw new Error('Type a few keys first.');
    const r = recorder();
    const q = [];
    const out = [];
    const mark = {};
    const pic = (at) => {
      const tr = tree(snap(t.root), { mark: { ...mark, ...(at !== undefined ? { [at]: 'cur' } : {}) } });
      return scene([tr, row('q', q.map((n) => ({ id: n.key, text: String(n.key), cls: 'queued' })), 10, tr.h + 18, { title: 'queue' }), row('out', out.map((k) => ({ id: k, text: String(k), cls: 'done' })), 10, tr.h + 60, { title: 'visited' })]);
    };
    r.add(1, 'Start with an empty queue.', pic());
    q.push(t.root);
    mark[t.root.key] = 'queued';
    r.add(2, `Put the root, <b>${t.root.key}</b>, in the queue.`, pic());
    while (q.length) {
      r.add(3, `Is the queue empty? No, it holds ${q.length} node${q.length > 1 ? 's' : ''}.`, pic());
      const x = q.shift();
      r.add(4, `Take the node at the <b>front</b>: ${x.key}.`, pic(x.key), { x: x.key });
      out.push(x.key);
      mark[x.key] = 'done';
      r.add(5, `Visit <b>${x.key}</b>.`, pic(x.key), { x: x.key });
      for (const side of ['left', 'right']) {
        const c = x[side];
        if (c) {
          q.push(c);
          mark[c.key] = 'queued';
          r.add(side === 'left' ? 6 : 7, `${x.key} has a ${side} child, <b>${c.key}</b>. Add it to the <b>back</b> of the line.`, pic(x.key), { x: x.key });
        } else r.add(side === 'left' ? 6 : 7, `${x.key} has no ${side} child.`, pic(x.key), { x: x.key });
      }
    }
    r.add(3, `The queue is empty, so we are done. Level order: <b>${out.join(', ')}</b>. 🎉`, pic());
    return r.frames;
  },
};

/* ================================================================== BST search / insert / delete */

const bstLabel = (n) => `size ${n.size}`;

const bstSearch = {
  id: 'bst-search',
  topic: 'bst',
  title: 'Searching a BST',
  intro: 'Like a guessing game: smaller → go left, bigger → go right. Each step throws away half the tree.',
  code: `Value get(Node x, Key key) {
    if (x == null) return null;
    int cmp = key.compareTo(x.key);
    if (cmp < 0) return get(x.left, key);
    if (cmp > 0) return get(x.right, key);
    return x.val;
}`,
  inputs: [
    { id: 'keys', label: 'Keys', value: '50 30 70 20 40 60 80 35', wide: true },
    { id: 'find', label: 'Find', value: '35' },
  ],
  random: () => {
    const ks = keysOf(rngKeys(8));
    return { keys: ks.join(' '), find: String(new Rng(newSeed()).chance(0.7) ? ks[new Rng(newSeed()).int(0, 7)] : 99) };
  },
  build({ keys, find }) {
    const t = new BST(keysOf(keys));
    const target = keysOf(find)[0];
    if (target === undefined) throw new Error('Type a key to find.');
    const r = recorder();
    const mark = {};
    const pic = (at) => scene([tree(snap(t.root), { mark, pointer: at !== undefined ? { key: at } : null })]);
    r.add(1, `We want to find <b>${target}</b>. Start at the root.`, pic(t.root?.key), { key: target });
    let x = t.root;
    while (x) {
      mark[x.key] = 'path';
      const c = cmp(target, x.key);
      r.add(3, `Compare ${target} with <b>${x.key}</b>.`, pic(x.key), { key: target, 'x.key': x.key });
      if (c === 0) {
        mark[x.key] = 'found';
        r.add(6, `They are equal. <b>Found it!</b> 🎉 It took ${Object.keys(mark).length} comparison${Object.keys(mark).length > 1 ? 's' : ''}.`, pic(x.key), { key: target, 'x.key': x.key });
        return r.frames;
      }
      const side = c < 0 ? 'left' : 'right';
      r.add(c < 0 ? 4 : 5, `${target} is ${c < 0 ? 'smaller' : 'bigger'} than ${x.key}, so it can only be on the <b>${side}</b>.`, pic(x.key), { key: target, 'x.key': x.key });
      x = x[side];
    }
    r.add(2, `We fell off the tree (x is null). <b>${target} is not in the tree</b>, so get returns null.`, pic(), { key: target });
    return r.frames;
  },
};

const bstInsert = {
  id: 'bst-insert',
  topic: 'bst',
  title: 'Inserting into a BST',
  intro: 'Walk down like a search. Where you fall off the tree, the new node goes. On the way back up, every node fixes its size.',
  code: `Node put(Node x, Key key) {
    if (x == null) return new Node(key, 1);
    int cmp = key.compareTo(x.key);
    if (cmp < 0)      x.left  = put(x.left, key);
    else if (cmp > 0) x.right = put(x.right, key);
    x.size = 1 + size(x.left) + size(x.right);
    return x;
}`,
  inputs: [
    { id: 'keys', label: 'Start with', value: '50 30 70 20 60', wide: true },
    { id: 'add', label: 'Insert', value: '40 65', wide: true },
  ],
  random: () => ({ keys: rngKeys(5), add: rngKeys(2) }),
  build({ keys, add }) {
    const t = new BST(keysOf(keys));
    const r = recorder();
    const toAdd = keysOf(add);
    if (!toAdd.length) throw new Error('Type at least one key to insert.');
    for (const key of toAdd) {
      const mark = {};
      const pic = (at) => scene([tree(snap(t.root), { mark, pointer: at !== undefined ? { key: at } : null, label: bstLabel })]);
      r.add(1, `Let's insert <b>${key}</b>.`, pic(t.root?.key), { key });
      const path = [];
      let x = t.root;
      let parent = null;
      let side = null;
      let dup = false;
      while (x) {
        path.push(x);
        mark[x.key] = 'path';
        const c = cmp(key, x.key);
        r.add(3, `Compare ${key} with <b>${x.key}</b>.`, pic(x.key), { key, 'x.key': x.key });
        if (c === 0) {
          dup = true;
          r.add(5, `${key} is already here. A BST keeps each key once, so we just replace its value.`, pic(x.key), { key });
          break;
        }
        side = c < 0 ? 'left' : 'right';
        r.add(c < 0 ? 4 : 5, `${key} is ${c < 0 ? 'smaller' : 'bigger'}, so go <b>${side}</b>.`, pic(x.key), { key });
        parent = x;
        x = x[side];
      }
      if (!dup) {
        const node = { key, left: null, right: null, size: 1, red: false };
        if (parent) parent[side] = node;
        else t.root = node;
        mark[key] = 'new';
        r.add(2, `We reached an empty spot (null). Create the new node <b>${key}</b> right here.`, pic(key), { key });
        for (let k = path.length - 1; k >= 0; k--) {
          const p = path[k];
          p.size += 1;
          mark[p.key] = 'fixed';
          r.add([6, 7], `Back up at <b>${p.key}</b>: its subtree got one more node, so size becomes <b>${p.size}</b>.`, pic(p.key), { key, [`${p.key}.size`]: p.size });
        }
      }
      r.add(null, `${key} is in the tree, and every size is correct. Keys in order: ${t.size()} total.`, scene([tree(snap(t.root), { label: bstLabel, mark: { [key]: 'new' } })]), { key });
    }
    return r.frames;
  },
};

const bstDelete = {
  id: 'bst-delete',
  topic: 'bst',
  title: 'Hibbard deletion',
  intro: 'Removing a node with two children is tricky. Hibbard\'s idea: replace it with the next bigger key (its successor).',
  code: `Node delete(Node x, Key key) {
    if (x == null) return null;
    int cmp = key.compareTo(x.key);
    if      (cmp < 0) x.left  = delete(x.left,  key);
    else if (cmp > 0) x.right = delete(x.right, key);
    else {
        if (x.right == null) return x.left;
        if (x.left  == null) return x.right;
        Node t = x;
        x = min(t.right);
        x.right = deleteMin(t.right);
        x.left = t.left;
    }
    x.size = 1 + size(x.left) + size(x.right);
    return x;
}`,
  inputs: [
    { id: 'keys', label: 'Keys', value: '50 30 70 20 40 60 80 65', wide: true },
    { id: 'del', label: 'Delete', value: '50' },
  ],
  random: () => {
    const ks = keysOf(rngKeys(9));
    return { keys: ks.join(' '), del: String(ks[0]) };
  },
  build({ keys, del }) {
    const t = new BST(keysOf(keys));
    const key = keysOf(del)[0];
    const r = recorder();
    const mark = {};
    const pic = (at, extra = {}) => scene([tree(snap(t.root), { mark: { ...mark, ...extra }, pointer: at !== undefined ? { key: at } : null, label: bstLabel })]);
    r.add(1, `Let's delete <b>${key}</b>. First, find it.`, pic(t.root?.key), { key });
    const path = [];
    let x = t.root;
    let parent = null;
    let side = null;
    while (x && x.key !== key) {
      mark[x.key] = 'path';
      path.push(x);
      const c = cmp(key, x.key);
      side = c < 0 ? 'left' : 'right';
      r.add(c < 0 ? 4 : 5, `${key} is ${c < 0 ? 'smaller' : 'bigger'} than ${x.key}, go <b>${side}</b>.`, pic(x.key), { key });
      parent = x;
      x = x[side];
    }
    const attach = (node) => {
      if (parent) parent[side] = node;
      else t.root = node;
    };
    if (!x) {
      r.add(2, `${key} is not in the tree, so there is nothing to delete.`, pic(), { key });
      return r.frames;
    }
    mark[x.key] = 'found';
    r.add(6, `Found <b>${key}</b>.`, pic(x.key), { key });
    if (!x.right || !x.left) {
      const child = x.right ? x.right : x.left;
      r.add(x.right ? 8 : 7, child ? `${key} has only one child (${child.key}). That child simply takes its place.` : `${key} is a leaf (no children). We just remove it.`, pic(x.key), { key });
      delete mark[x.key];
      attach(child);
    } else {
      r.add([9, 10], `${key} has <b>two</b> children. We need a replacement that keeps the BST rule: the <b>smallest key on its right side</b>.`, pic(x.key), { key });
      let s = x.right;
      const sPath = [];
      mark[s.key] = 'look';
      r.add(10, `Step into the right subtree: <b>${s.key}</b>.`, pic(s.key), { key });
      while (s.left) {
        sPath.push(s);
        s = s.left;
        mark[s.key] = 'look';
        r.add(10, `Keep going left to find the smallest: <b>${s.key}</b>.`, pic(s.key), { key });
      }
      mark[s.key] = 'succ';
      r.add(10, `<b>${s.key}</b> has no left child, so it is the smallest. It is the <b>successor</b>.`, pic(s.key), { key, successor: s.key });
      // Remove the successor from the right subtree (deleteMin), then move it into x's place.
      if (sPath.length) {
        sPath[sPath.length - 1].left = s.right;
        for (const p of sPath) p.size -= 1;
      }
      const newRight = sPath.length ? x.right : s.right;
      s.right = newRight;
      s.left = x.left;
      s.size = x.size - 1;
      delete mark[x.key];
      attach(s);
      mark[s.key] = 'new';
      r.add([11, 12], `Take ${s.key} out of the right side, and put it where <b>${key}</b> used to be. Watch it move!`, pic(s.key), { key, successor: s.key });
    }
    for (let k = path.length - 1; k >= 0; k--) {
      path[k].size -= 1;
      mark[path[k].key] = 'fixed';
    }
    r.add(14, `On the way back up, every node on the path loses one from its size.`, pic(), { key });
    r.add(null, `${key} is gone and the tree is still a valid BST. 🎉`, scene([tree(snap(t.root), { label: bstLabel })]));
    return r.frames;
  },
};

/* ================================================================== LLRB insertion */

const llrbInsert = {
  id: 'llrb-insert',
  topic: 'llrb',
  title: 'Red-black insertion',
  intro: 'New nodes are red. Then three small fixes, done on the way back up, keep the tree perfectly balanced.',
  code: `Node put(Node h, Key key) {
    if (h == null) return new Node(key, RED);
    int cmp = key.compareTo(h.key);
    if (cmp < 0)      h.left  = put(h.left,  key);
    else if (cmp > 0) h.right = put(h.right, key);

    if (isRed(h.right) && !isRed(h.left))    h = rotateLeft(h);
    if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
    if (isRed(h.left) && isRed(h.right))     flipColors(h);
    return h;
}
// after the call:  root.color = BLACK;`,
  inputs: [{ id: 'keys', label: 'Insert', value: '1 2 3 4 5 6 7', wide: true }],
  random: () => ({ keys: rngKeys(7, 60) }),
  build({ keys }) {
    const list = keysOf(keys);
    if (!list.length) throw new Error('Type keys to insert.');
    const r = recorder();
    const T = { root: null };
    const red = (x) => !!x && x.red;
    const pic = (mark = {}, at) => scene([tree(snap(T.root), { mark, pointer: at !== undefined ? { key: at, name: 'h' } : null })]);
    for (const key of list) {
      r.add(1, `Insert <b>${key}</b>.`, pic({}, T.root?.key), { key });
      const put = (h, attach) => {
        if (!h) {
          const n = { key, red: true, left: null, right: null, size: 1 };
          attach(n);
          r.add(2, `Empty spot found. <b>${key}</b> goes here as a new <b style="color:var(--red-link)">red</b> node. Red means "glued to its parent".`, pic({ [key]: 'new' }, key), { key });
          return n;
        }
        const c = cmp(key, h.key);
        r.add(3, `Compare ${key} with <b>${h.key}</b>: go ${c < 0 ? 'left' : c > 0 ? 'right' : 'nowhere (same key)'}.`, pic({ [h.key]: 'path' }, h.key), { key, h: h.key });
        if (c < 0) put(h.left, (n) => (h.left = n));
        else if (c > 0) put(h.right, (n) => (h.right = n));
        if (red(h.right) && !red(h.left)) {
          r.add(7, `At <b>${h.key}</b>: a red link leans <b>right</b>. Not allowed! Rotate left.`, pic({ [h.key]: 'cur', [h.right.key]: 'warn' }, h.key), { h: h.key });
          const x = h.right;
          h.right = x.left;
          x.left = h;
          x.red = h.red;
          h.red = true;
          h = x;
          attach(h);
          r.add(7, `Rotated: <b>${h.key}</b> moved up and ${h.left.key} moved down to its left. Same keys, same order.`, pic({ [h.key]: 'fixed' }, h.key), { h: h.key });
        }
        if (red(h.left) && red(h.left.left)) {
          r.add(8, `At <b>${h.key}</b>: two red links in a row on the left. Rotate right.`, pic({ [h.key]: 'cur', [h.left.key]: 'warn', [h.left.left.key]: 'warn' }, h.key), { h: h.key });
          const x = h.left;
          h.left = x.right;
          x.right = h;
          x.red = h.red;
          h.red = true;
          h = x;
          attach(h);
          r.add(8, `Rotated: <b>${h.key}</b> is now in the middle with a red child on each side.`, pic({ [h.key]: 'fixed' }, h.key), { h: h.key });
        }
        if (red(h.left) && red(h.right)) {
          r.add(9, `At <b>${h.key}</b>: both children are red. That is too many keys glued together. Flip the colors!`, pic({ [h.key]: 'cur', [h.left.key]: 'warn', [h.right.key]: 'warn' }, h.key), { h: h.key });
          h.red = true;
          h.left.red = false;
          h.right.red = false;
          r.add(9, `Children turn black, <b>${h.key}</b> turns red: it gets passed up to join its parent.`, pic({ [h.key]: 'fixed' }, h.key), { h: h.key });
        }
        h.size = 1 + (h.left ? h.left.size : 0) + (h.right ? h.right.size : 0);
        return h;
      };
      put(T.root, (n) => (T.root = n));
      if (T.root.red) {
        T.root.red = false;
        r.add(12, 'The root must always be black, so we color it black.', pic({ [T.root.key]: 'fixed' }), { key });
      }
      r.add(null, `<b>${key}</b> is in. Every path from the top to the bottom has the same number of black links, so the tree is balanced.`, pic({ [key]: 'new' }), { key });
    }
    return r.frames;
  },
};

/* ================================================================== hashing */

const hashPut = {
  id: 'hash-put',
  topic: 'hash',
  title: 'Hash table with chaining',
  intro: 'A hash table turns each key into a bucket number, like sorting mail into numbered boxes. Too crowded? Double the boxes.',
  code: `void put(Key key, Value val) {
    int i = (key.hashCode() & 0x7fffffff) % m;
    for (Node x = st[i]; x != null; x = x.next)
        if (key.equals(x.key)) { x.val = val; return; }
    st[i] = new Node(key, val, st[i]);
    n++;
    if (n >= 2 * m) resize(2 * m);
}`,
  inputs: [{ id: 'keys', label: 'Keys', value: 'cat dog owl bee ant fox cat yak', wide: true }],
  random: () => {
    const pool = ['cat', 'dog', 'owl', 'bee', 'ant', 'fox', 'yak', 'elk', 'emu', 'pig', 'cow', 'hen', 'ram', 'bat'];
    return { keys: new Rng(newSeed()).shuffle(pool).slice(0, 8).join(' ') };
  },
  build({ keys }) {
    const list = keysOf(keys).map(String);
    if (!list.length) throw new Error('Type a few words.');
    const r = recorder();
    let m = 2;
    let table = [[], []];
    let n = 0;
    const pic = (mark = {}, bin, note) =>
      scene([caption('info', 10, 16, `m = ${m} buckets · n = ${n} keys · resize when n ≥ 2 × m = ${2 * m}`, 'cap'), chains(table, 10, 34, { mark, bin }), note ? caption('note', 10, 34 + table.length * 38 + 18, note, 'cap strong') : null]);
    r.add(1, 'We start with <b>2 buckets</b> (m = 2). Each bucket holds a little chain of keys.', pic());
    for (const key of list) {
      const h = javaHashCode(key);
      const i = hashIndex(h, m);
      r.add(2, `Put <b>"${key}"</b>. Its hash code is ${h}. We take the remainder after dividing by ${m}: bucket <b>${i}</b>.`, pic({}, i, `"${key}" → ${h} → bucket ${i}`), { key, i });
      if (table[i].includes(key)) {
        r.add([3, 4], `"${key}" is already in bucket ${i}. We only update its value. n stays ${n}.`, pic({ [key]: 'found' }, i), { key, i });
        continue;
      }
      r.add(3, `Look through bucket ${i}: ${table[i].length ? `${table[i].map((k) => `"${k}"`).join(', ')}. No match.` : 'it is empty.'}`, pic({}, i), { key, i });
      table[i].unshift(key);
      n++;
      r.add([5, 6], `Add "${key}" to the <b>front</b> of bucket ${i}. Now n = ${n}.`, pic({ [key]: 'new' }, i), { key, i, n });
      if (n >= 2 * m) {
        r.add(7, `n = ${n} is at least 2 × ${m}. The chains are getting long, so we <b>double</b> the table to ${2 * m} buckets.`, pic({}, undefined, 'Too crowded → resize!'), { n, m });
        m *= 2;
        const old = table.flat();
        table = Array.from({ length: m }, () => []);
        for (const k of old.reverse()) table[hashIndex(javaHashCode(k), m)].unshift(k);
        r.add(7, `Every key gets a <b>new bucket number</b>, because we now divide by ${m}. Watch them move!`, pic(), { n, m });
      }
    }
    r.add(null, `All keys stored. To find any key later, we compute its bucket and look in just that one short chain. Fast! 🎉`, pic());
    return r.frames;
  },
};

/* ================================================================== graphs */

const GRAPH_INPUTS = (edges, V = 7) => [
  { id: 'V', label: 'Vertices', value: String(V) },
  { id: 'edges', label: 'Edges', value: edges, wide: true },
];

function randomGraphInput(directed) {
  const rng = new Rng(newSeed());
  const V = rng.int(5, 7);
  const perm = rng.shuffle([...Array(V).keys()]);
  const edges = [];
  for (let i = 1; i < V; i++) edges.push(directed ? [perm[rng.int(0, i - 1)], perm[i]] : [perm[i], perm[rng.int(0, i - 1)]]);
  for (let k = 0; k < 2; k++) {
    let a = rng.int(0, V - 1);
    let b = rng.int(0, V - 1);
    if (a === b) continue;
    if (directed && perm.indexOf(a) > perm.indexOf(b)) [a, b] = [b, a];
    edges.push([a, b]);
  }
  return { V: String(V), edges: rng.shuffle(edges).map(([a, b]) => `${a}-${b}`).join(' ') };
}

function graphFrom({ V, edges }, directed) {
  const n = Math.max(1, Math.min(10, Number(V) || 1));
  return buildGraph(n, parseEdges(edges), directed);
}

const dfs = {
  id: 'dfs',
  topic: 'graphs',
  title: 'Depth-first search',
  intro: 'Explore a maze: always go deeper to a new place, and only back up when you are stuck.',
  code: `void dfs(Graph G, int v) {
    marked[v] = true;
    for (int w : G.adj(v)) {
        if (!marked[w]) {
            edgeTo[w] = v;
            dfs(G, w);
        }
    }
}`,
  inputs: GRAPH_INPUTS('0-1 0-2 1-3 2-3 3-4 4-5 5-6'),
  random: () => randomGraphInput(false),
  build(input) {
    const adj = graphFrom(input, false);
    const pos = circleLayout(adj.length, 140, 140, 110);
    const r = recorder();
    const marked = Array(adj.length).fill(false);
    const calls = [];
    const order = [];
    const tree = {};
    const pic = (cur, check) => {
      const mark = {};
      marked.forEach((m, v) => m && (mark[v] = 'done'));
      if (cur !== undefined) mark[cur] = 'cur';
      const edgeMark = { ...tree };
      if (check) edgeMark[`${check[0]}-${check[1]}`] = 'check';
      return scene([graph(adj, pos, { mark, edgeMark }), stack('calls', calls.map((v, d) => ({ id: d, text: `dfs(${v})`, cls: d === calls.length - 1 ? 'cur' : 'wait' })), 310, 10, { width: 90, slots: 6, title: 'call stack' }), row('order', order.map((v) => ({ id: v, text: String(v), cls: 'done' })), 10, 300, { title: 'visit order' })]);
    };
    const go = (v) => {
      calls.push(v);
      marked[v] = true;
      order.push(v);
      r.add([1, 2], `<b>dfs(${v})</b>: mark ${v} as visited (it turns blue).`, pic(v), { v });
      for (const w of adj[v]) {
        r.add(3, `Look at neighbor <b>${w}</b> of ${v}.`, pic(v, [v, w]), { v, w });
        if (!marked[w]) {
          tree[`${v}-${w}`] = 'tree';
          r.add([4, 5], `${w} is new! Remember we came from ${v} (edgeTo[${w}] = ${v}).`, pic(v, [v, w]), { v, w, [`edgeTo[${w}]`]: v });
          r.add(6, `Go deeper: call <b>dfs(${w})</b>. dfs(${v}) waits.`, pic(v, [v, w]), { v, w });
          go(w);
          r.add(6, `Back in <b>dfs(${v})</b>. Keep checking its other neighbors.`, pic(v), { v });
        } else r.add(4, `${w} is already visited. Skip it.`, pic(v, [v, w]), { v, w });
      }
      calls.pop();
      r.add(8, `All neighbors of ${v} are done. <b>dfs(${v}) is finished</b>, so we back up.`, pic(calls[calls.length - 1]), { v });
    };
    r.add(1, 'Start a depth-first search from vertex <b>0</b>.', pic());
    go(0);
    const missed = marked.map((m, v) => (m ? null : v)).filter((v) => v !== null);
    r.add(null, `Done! Visit order: <b>${order.join(', ')}</b>. The blue lines (edgeTo) form a tree of the paths we took.${missed.length ? ` Vertices ${missed.join(', ')} were never reached: they are not connected to 0.` : ''}`, pic());
    return r.frames;
  },
};

const bfs = {
  id: 'bfs',
  topic: 'graphs',
  title: 'Breadth-first search',
  intro: 'Spread out in rings, like ripples in a pond: first everything 1 step away, then 2 steps, and so on.',
  code: `Queue<Integer> q = new LinkedList<>();
marked[s] = true;  distTo[s] = 0;  q.add(s);
while (!q.isEmpty()) {
    int v = q.remove();
    for (int w : G.adj(v)) {
        if (!marked[w]) {
            marked[w] = true;
            edgeTo[w] = v;
            distTo[w] = distTo[v] + 1;
            q.add(w);
        }
    }
}`,
  inputs: GRAPH_INPUTS('0-1 0-2 1-3 2-3 3-4 4-5 5-6'),
  random: () => randomGraphInput(false),
  build(input) {
    const adj = graphFrom(input, false);
    const pos = circleLayout(adj.length, 140, 140, 110);
    const r = recorder();
    const marked = Array(adj.length).fill(false);
    const dist = Array(adj.length).fill(-1);
    const q = [];
    const order = [];
    const tree = {};
    const pic = (cur, check) => {
      const mark = {};
      marked.forEach((m, v) => m && (mark[v] = order.includes(v) ? 'done' : 'queued'));
      if (cur !== undefined) mark[cur] = 'cur';
      const edgeMark = { ...tree };
      if (check) edgeMark[`${check[0]}-${check[1]}`] = 'check';
      return scene([
        graph(adj, pos, { mark, edgeMark }),
        row('q', q.map((v) => ({ id: v, text: String(v), cls: 'queued' })), 10, 296, { title: 'queue' }),
        row('order', order.map((v) => ({ id: v, text: String(v), cls: 'done' })), 10, 336, { title: 'visited' }),
        row('dist', dist.map((d, v) => ({ id: v, text: d < 0 ? '–' : String(d), cls: d < 0 ? '' : 'done' })), 10, 376, { title: 'distTo' }),
      ]);
    };
    marked[0] = true;
    dist[0] = 0;
    q.push(0);
    r.add(2, 'Start at <b>0</b>: mark it, its distance is 0, and put it in the queue.', pic(), { s: 0 });
    while (q.length) {
      const v = q.shift();
      order.push(v);
      r.add([3, 4], `Take <b>${v}</b> from the front of the queue.`, pic(v), { v });
      for (const w of adj[v]) {
        r.add(5, `Check neighbor <b>${w}</b>.`, pic(v, [v, w]), { v, w });
        if (!marked[w]) {
          marked[w] = true;
          dist[w] = dist[v] + 1;
          tree[`${v}-${w}`] = 'tree';
          q.push(w);
          r.add([7, 8, 9, 10], `${w} is new: mark it, its distance is ${dist[v]} + 1 = <b>${dist[w]}</b>, and add it to the <b>back</b> of the queue.`, pic(v, [v, w]), { v, w, [`distTo[${w}]`]: dist[w] });
        } else r.add(6, `${w} was already found. Skip.`, pic(v, [v, w]), { v, w });
      }
    }
    r.add(3, `The queue is empty. Done! distTo shows the <b>fewest steps</b> from 0 to every vertex.`, pic());
    return r.frames;
  },
};

const topo = {
  id: 'topo',
  topic: 'digraphs',
  title: 'Topological sort',
  intro: 'Put tasks in an order where every arrow points forward. Trick: a task finishes in DFS only after everything it points to.',
  code: `void dfs(Digraph G, int v) {
    marked[v] = true;
    for (int w : G.adj(v))
        if (!marked[w]) dfs(G, w);
    postorder.add(v);      // v is finished
}
// run dfs from every unmarked vertex 0, 1, 2, ...
// topological order = postorder reversed`,
  inputs: GRAPH_INPUTS('0-1 0-2 1-3 2-3 3-4 5-4 6-5'),
  random: () => randomGraphInput(true),
  build(input) {
    const adj = graphFrom(input, true);
    const pos = circleLayout(adj.length, 140, 140, 110);
    const r = recorder();
    const marked = Array(adj.length).fill(false);
    const finished = new Set();
    const calls = [];
    const post = [];
    const pic = (cur, check, rev) => {
      const mark = {};
      marked.forEach((m, v) => m && (mark[v] = finished.has(v) ? 'done' : 'queued'));
      if (cur !== undefined) mark[cur] = 'cur';
      const edgeMark = check ? { [`${check[0]}-${check[1]}`]: 'check' } : {};
      return scene([
        graph(adj, pos, { mark, edgeMark, directed: true }),
        stack('calls', calls.map((v, d) => ({ id: d, text: `dfs(${v})`, cls: d === calls.length - 1 ? 'cur' : 'wait' })), 310, 10, { width: 90, slots: 6, title: 'call stack' }),
        row('post', post.map((v) => ({ id: v, text: String(v), cls: 'done' })), 10, 300, { title: 'postorder' }),
        rev ? row('topo', rev.map((v) => ({ id: `r${v}`, text: String(v), cls: 'found' })), 10, 340, { title: 'topo order' }) : null,
      ]);
    };
    const go = (v) => {
      calls.push(v);
      marked[v] = true;
      r.add([1, 2], `<b>dfs(${v})</b> starts. Mark ${v}.`, pic(v), { v });
      for (const w of adj[v]) {
        r.add(3, `Follow the arrow ${v} → <b>${w}</b>.`, pic(v, [v, w]), { v, w });
        if (!marked[w]) {
          r.add(4, `${w} is new. Go deeper.`, pic(v, [v, w]), { v, w });
          go(w);
        } else r.add(4, `${w} was already visited. Skip.`, pic(v, [v, w]), { v, w });
      }
      calls.pop();
      finished.add(v);
      post.push(v);
      r.add(5, `Everything ${v} points to is done, so <b>${v} is finished</b>. Add it to the postorder list.`, pic(calls[calls.length - 1]), { v });
    };
    for (let s = 0; s < adj.length; s++) {
      if (marked[s]) continue;
      r.add(7, `Vertex <b>${s}</b> is not visited yet. Start a DFS from it.`, pic(), { s });
      go(s);
    }
    const rev = post.slice().reverse();
    r.add(8, `Now <b>reverse</b> the postorder: ${rev.join(', ')}. In this order every arrow points forward, from left to right. 🎉`, pic(undefined, undefined, rev));
    return r.frames;
  },
};

export const WALKTHROUGHS = [recursionSum, postfix, traversal, levelOrder, bstSearch, bstInsert, bstDelete, llrbInsert, hashPut, dfs, bfs, topo];

// The traversal walkthrough shows the code for the chosen order.
const baseBuild = traversal.build;
traversal.build = function (inputs) {
  this._kind = inputs.kind;
  return baseBuild.call(this, inputs);
};

export const walkthroughById = (id) => WALKTHROUGHS.find((w) => w.id === id);

const BY_TOPIC = { java: 'recursion', trees: 'traversal', bst: 'bst-insert', llrb: 'llrb-insert', hash: 'hash-put', graphs: 'dfs', digraphs: 'topo' };
export const walkthroughFor = (topic) => walkthroughById(BY_TOPIC[topic]);
