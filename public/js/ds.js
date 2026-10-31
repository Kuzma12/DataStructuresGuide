// JavaScript versions of the course's data structures, with step logs for the labs and drills.

export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ------------------------------------------------------------------ BST */

const bstNode = (key) => ({ key, left: null, right: null, size: 1, red: false });
const size = (x) => (x ? x.size : 0);
const resize = (x) => {
  x.size = 1 + size(x.left) + size(x.right);
  return x;
};

export class BST {
  constructor(keys = []) {
    this.root = null;
    for (const k of keys) this.put(k);
  }

  size() {
    return size(this.root);
  }

  put(key, log = []) {
    const go = (x) => {
      if (!x) {
        log.push(`reached an empty link → create node <b>${key}</b>`);
        return bstNode(key);
      }
      const c = cmp(key, x.key);
      if (c < 0) {
        log.push(`${key} &lt; ${x.key} → go left`);
        x.left = go(x.left);
      } else if (c > 0) {
        log.push(`${key} &gt; ${x.key} → go right`);
        x.right = go(x.right);
      } else log.push(`${key} = ${x.key} → key exists, value replaced`);
      return resize(x);
    };
    this.root = go(this.root);
    return log;
  }

  contains(key) {
    let x = this.root;
    while (x) {
      const c = cmp(key, x.key);
      if (c === 0) return true;
      x = c < 0 ? x.left : x.right;
    }
    return false;
  }

  delete(key, log = []) {
    const min = (x) => (x.left ? min(x.left) : x);
    const deleteMin = (x) => {
      if (!x.left) return x.right;
      x.left = deleteMin(x.left);
      return resize(x);
    };
    const go = (x) => {
      if (!x) {
        log.push(`${key} is not in the tree, so nothing to delete`);
        return null;
      }
      const c = cmp(key, x.key);
      if (c < 0) {
        log.push(`${key} &lt; ${x.key} → go left`);
        x.left = go(x.left);
      } else if (c > 0) {
        log.push(`${key} &gt; ${x.key} → go right`);
        x.right = go(x.right);
      } else {
        if (!x.right) {
          log.push(`found ${key}: no right child → replace it with its left child`);
          return x.left;
        }
        if (!x.left) {
          log.push(`found ${key}: no left child → replace it with its right child`);
          return x.right;
        }
        const t = x;
        const s = min(t.right);
        log.push(`found ${key}: two children → successor is <b>${s.key}</b> (the min of the right subtree)`);
        log.push(`remove ${s.key} from the right subtree (deleteMin), then put it where ${key} was`);
        const right = deleteMin(t.right);
        x = s;
        x.right = right;
        x.left = t.left;
      }
      return resize(x);
    };
    this.root = go(this.root);
    return log;
  }

  min() {
    let x = this.root;
    if (!x) return null;
    while (x.left) x = x.left;
    return x.key;
  }

  max() {
    let x = this.root;
    if (!x) return null;
    while (x.right) x = x.right;
    return x.key;
  }

  floor(key) {
    let x = this.root;
    let best = null;
    while (x) {
      const c = cmp(key, x.key);
      if (c === 0) return x.key;
      if (c < 0) x = x.left;
      else {
        best = x.key;
        x = x.right;
      }
    }
    return best;
  }

  ceiling(key) {
    let x = this.root;
    let best = null;
    while (x) {
      const c = cmp(key, x.key);
      if (c === 0) return x.key;
      if (c > 0) x = x.right;
      else {
        best = x.key;
        x = x.left;
      }
    }
    return best;
  }

  rank(key) {
    let x = this.root;
    let r = 0;
    while (x) {
      const c = cmp(key, x.key);
      if (c < 0) x = x.left;
      else if (c > 0) {
        r += 1 + size(x.left);
        x = x.right;
      } else return r + size(x.left);
    }
    return r;
  }

  select(k) {
    let x = this.root;
    while (x) {
      const t = size(x.left);
      if (t > k) x = x.left;
      else if (t < k) {
        k -= t + 1;
        x = x.right;
      } else return x.key;
    }
    return null;
  }
}

/* ------------------------------------------------------------------ traversals (any {key,left,right} tree) */

export function preorder(x, out = []) {
  if (x) {
    out.push(x.key);
    preorder(x.left, out);
    preorder(x.right, out);
  }
  return out;
}

export function inorder(x, out = []) {
  if (x) {
    inorder(x.left, out);
    out.push(x.key);
    inorder(x.right, out);
  }
  return out;
}

export function postorder(x, out = []) {
  if (x) {
    postorder(x.left, out);
    postorder(x.right, out);
    out.push(x.key);
  }
  return out;
}

export function levelorder(root) {
  const out = [];
  const q = root ? [root] : [];
  while (q.length) {
    const x = q.shift();
    out.push(x.key);
    if (x.left) q.push(x.left);
    if (x.right) q.push(x.right);
  }
  return out;
}

export function height(x) {
  return x ? 1 + Math.max(height(x.left), height(x.right)) : -1;
}

export function countNodes(x) {
  return x ? 1 + countNodes(x.left) + countNodes(x.right) : 0;
}

/* ------------------------------------------------------------------ LLRB */

const isRed = (x) => !!x && x.red;

export class LLRB {
  constructor(keys = []) {
    this.root = null;
    for (const k of keys) this.put(k);
  }

  size() {
    return size(this.root);
  }

  put(key, log = []) {
    const rotateLeft = (h) => {
      const x = h.right;
      h.right = x.left;
      x.left = h;
      x.red = h.red;
      h.red = true;
      x.size = h.size;
      resize(h);
      log.push(`<span class="tag rot">rotateLeft(${h.key})</span> right-leaning red link → ${x.key} moves up`);
      return x;
    };
    const rotateRight = (h) => {
      const x = h.left;
      h.left = x.right;
      x.right = h;
      x.red = h.red;
      h.red = true;
      x.size = h.size;
      resize(h);
      log.push(`<span class="tag rot">rotateRight(${h.key})</span> two reds in a row on the left → ${x.key} moves up`);
      return x;
    };
    const flip = (h) => {
      h.red = true;
      h.left.red = false;
      h.right.red = false;
      log.push(`<span class="tag flip">flipColors(${h.key})</span> both children red → split the temporary 4-node, ${h.key} goes up`);
    };
    const go = (h) => {
      if (!h) {
        log.push(`insert <b>${key}</b> as a new RED node`);
        const n = bstNode(key);
        n.red = true;
        return n;
      }
      const c = cmp(key, h.key);
      if (c < 0) h.left = go(h.left);
      else if (c > 0) h.right = go(h.right);
      else log.push(`${key} already present, value replaced`);
      if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
      if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
      if (isRed(h.left) && isRed(h.right)) flip(h);
      return resize(h);
    };
    this.root = go(this.root);
    if (this.root.red) log.push('color the root BLACK');
    this.root.red = false;
    return log;
  }
}

export function countRed(x) {
  return x ? (x.red ? 1 : 0) + countRed(x.left) + countRed(x.right) : 0;
}

export function blackHeight(x) {
  let c = 0;
  for (; x; x = x.left) if (!x.red) c++;
  return c;
}

/** Converts an LLRB into its logical 2-3 tree: nodes are {keys: [...], children: [...]}. */
export function to23(h) {
  if (!h) return null;
  if (isRed(h.left)) {
    const a = h.left;
    return { keys: [a.key, h.key], children: [to23(a.left), to23(a.right), to23(h.right)].filter(Boolean) };
  }
  return { keys: [h.key], children: [to23(h.left), to23(h.right)].filter(Boolean) };
}

export function levels23(root) {
  const out = [];
  let level = root ? [root] : [];
  while (level.length) {
    out.push(level.map((n) => n.keys));
    level = level.flatMap((n) => n.children);
  }
  return out;
}

/* ------------------------------------------------------------------ expressions */

export function tokenize(expr) {
  const tokens = [];
  for (const c of expr) {
    if (c === ' ' || c === '\t') continue;
    if ('0123456789'.includes(c)) tokens.push({ type: 'operand', text: c });
    else if ('+-*/'.includes(c)) tokens.push({ type: 'operator', text: c });
    else if (c === '(') tokens.push({ type: 'lparen', text: c });
    else if (c === ')') tokens.push({ type: 'rparen', text: c });
    else throw new Error(`Unexpected character "${c}"`);
  }
  return tokens;
}

/** Parses a FULLY parenthesized expression of single digits, like (2+(4*5)), into a tree. */
export function parseExpr(tokens) {
  let i = 0;
  const parse = () => {
    const t = tokens[i++];
    if (!t) throw new Error('Expression ended too early');
    if (t.type === 'operand') return { key: t.text, left: null, right: null };
    if (t.type !== 'lparen') throw new Error(`Expected a digit or "(" but found "${t.text}"`);
    const left = parse();
    const op = tokens[i++];
    if (!op || op.type !== 'operator') throw new Error('Expected an operator');
    const right = parse();
    const close = tokens[i++];
    if (!close || close.type !== 'rparen') throw new Error('Expected ")"');
    return { key: op.text, left, right };
  };
  const tree = parse();
  if (i !== tokens.length) throw new Error('Extra tokens after the expression');
  return tree;
}

export function applyOp(op, a, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  return a / b;
}

/** Evaluates postfix tokens with a stack, recording every step. */
export function evalPostfix(tokens) {
  const stack = [];
  const steps = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      const right = stack.pop();
      const left = stack.pop();
      const value = applyOp(t, left, right);
      stack.push(value);
      steps.push({ token: t, note: `pop ${fmtNum(right)} (right), pop ${fmtNum(left)} (left), push ${fmtNum(left)} ${t} ${fmtNum(right)} = ${fmtNum(value)}`, stack: stack.slice() });
    } else {
      stack.push(Number(t));
      steps.push({ token: t, note: `push ${t}`, stack: stack.slice() });
    }
  }
  return { value: stack[0], steps };
}

export function fmtNum(x) {
  return Number.isInteger(x) ? String(x) : String(Math.round(x * 1000) / 1000);
}

export function infix(x) {
  if (!x) return '';
  if (!x.left) return x.key;
  return `(${infix(x.left)}${x.key}${infix(x.right)})`;
}

/* ------------------------------------------------------------------ hashing (matches Java exactly) */

export function javaHashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

export function keyHash(key) {
  return typeof key === 'number' ? key | 0 : javaHashCode(String(key));
}

export function hashIndex(h, m) {
  return (h & 0x7fffffff) % m;
}

/** Separate-chaining table that mirrors the Java problems: new keys go to the FRONT of a chain. */
export class ChainTable {
  constructor(m, maxLoad = 8, resizable = true) {
    this.m = m;
    this.n = 0;
    this.maxLoad = maxLoad;
    this.resizable = resizable;
    this.chains = Array.from({ length: m }, () => []);
  }

  put(key, log = []) {
    const h = keyHash(key);
    const i = hashIndex(h, this.m);
    log.push(`hashCode(${fmtKey(key)}) = ${h} → (${h} &amp; 0x7fffffff) % ${this.m} = <b>${i}</b>`);
    const chain = this.chains[i];
    if (chain.includes(key)) log.push(`${fmtKey(key)} is already in chain ${i}, so its value is replaced and n stays ${this.n}`);
    else {
      chain.unshift(key);
      this.n++;
      log.push(`added at the front of chain ${i}; n = ${this.n}`);
      if (this.resizable && this.n >= this.maxLoad * this.m) {
        log.push(`<span class="tag rot">resize</span> n = ${this.n} ≥ ${this.maxLoad} × ${this.m}, so the table doubles to m = ${this.m * 2} and every key is re-hashed`);
        this.resize(this.m * 2);
      }
    }
    return log;
  }

  resize(m) {
    const old = this.chains;
    this.m = m;
    this.n = 0;
    this.chains = Array.from({ length: m }, () => []);
    for (const chain of old) for (const k of chain) {
      const i = hashIndex(keyHash(k), m);
      this.chains[i].unshift(k);
      this.n++;
    }
  }
}

export const fmtKey = (k) => (typeof k === 'number' ? String(k) : `"${k}"`);

/* ------------------------------------------------------------------ graphs */

/** Adjacency lists in insertion order, ignoring self-loops and duplicates. */
export function buildGraph(V, edges, directed = false) {
  const adj = Array.from({ length: V }, () => []);
  for (const [v, w] of edges) {
    if (v === w || v < 0 || w < 0 || v >= V || w >= V || adj[v].includes(w)) continue;
    adj[v].push(w);
    if (!directed) adj[w].push(v);
  }
  return adj;
}

export function dfsTrace(adj, s) {
  const V = adj.length;
  const marked = Array(V).fill(false);
  const edgeTo = Array(V).fill(-1);
  const order = [];
  const steps = [];
  const stack = [];
  const visit = (v) => {
    marked[v] = true;
    order.push(v);
    stack.push(v);
    steps.push({ current: v, note: `dfs(${v}): mark ${v}`, marked: marked.slice(), edgeTo: edgeTo.slice(), order: order.slice(), frontier: stack.slice() });
    for (const w of adj[v]) {
      if (!marked[w]) {
        edgeTo[w] = v;
        steps.push({ current: v, edge: [v, w], note: `${w} is unmarked → edgeTo[${w}] = ${v}, recurse`, marked: marked.slice(), edgeTo: edgeTo.slice(), order: order.slice(), frontier: stack.slice() });
        visit(w);
      } else {
        steps.push({ current: v, edge: [v, w], skip: true, note: `${w} already marked → skip`, marked: marked.slice(), edgeTo: edgeTo.slice(), order: order.slice(), frontier: stack.slice() });
      }
    }
    stack.pop();
    steps.push({ current: stack[stack.length - 1] ?? null, note: `dfs(${v}) is done → return`, marked: marked.slice(), edgeTo: edgeTo.slice(), order: order.slice(), frontier: stack.slice() });
  };
  visit(s);
  return { order, edgeTo, marked, steps };
}

export function bfsTrace(adj, s) {
  const V = adj.length;
  const marked = Array(V).fill(false);
  const edgeTo = Array(V).fill(-1);
  const distTo = Array(V).fill(-1);
  const order = [];
  const steps = [];
  const queue = [s];
  marked[s] = true;
  distTo[s] = 0;
  steps.push({ current: null, note: `mark ${s}, distTo[${s}] = 0, enqueue ${s}`, marked: marked.slice(), edgeTo: edgeTo.slice(), distTo: distTo.slice(), order: [], frontier: queue.slice() });
  while (queue.length) {
    const v = queue.shift();
    order.push(v);
    steps.push({ current: v, note: `dequeue ${v}`, marked: marked.slice(), edgeTo: edgeTo.slice(), distTo: distTo.slice(), order: order.slice(), frontier: queue.slice() });
    for (const w of adj[v]) {
      if (!marked[w]) {
        marked[w] = true;
        edgeTo[w] = v;
        distTo[w] = distTo[v] + 1;
        queue.push(w);
        steps.push({ current: v, edge: [v, w], note: `${w} unmarked → mark, edgeTo[${w}] = ${v}, distTo[${w}] = ${distTo[w]}, enqueue`, marked: marked.slice(), edgeTo: edgeTo.slice(), distTo: distTo.slice(), order: order.slice(), frontier: queue.slice() });
      } else {
        steps.push({ current: v, edge: [v, w], skip: true, note: `${w} already marked → skip`, marked: marked.slice(), edgeTo: edgeTo.slice(), distTo: distTo.slice(), order: order.slice(), frontier: queue.slice() });
      }
    }
  }
  return { order, edgeTo, distTo, marked, steps };
}

/** Depth-first orders over ALL vertices (0..V-1), as DepthFirstOrder computes them. */
export function dfoTrace(adj) {
  const V = adj.length;
  const marked = Array(V).fill(false);
  const pre = [];
  const post = [];
  const steps = [];
  const stack = [];
  const snap = (extra) => ({ marked: marked.slice(), pre: pre.slice(), post: post.slice(), frontier: stack.slice(), order: pre.slice(), ...extra });
  const visit = (v) => {
    marked[v] = true;
    pre.push(v);
    stack.push(v);
    steps.push(snap({ current: v, note: `dfs(${v}) starts → pre gets ${v}` }));
    for (const w of adj[v]) {
      if (!marked[w]) {
        steps.push(snap({ current: v, edge: [v, w], note: `follow ${v}→${w}` }));
        visit(w);
      } else steps.push(snap({ current: v, edge: [v, w], skip: true, note: `${w} already marked → skip` }));
    }
    stack.pop();
    post.push(v);
    steps.push(snap({ current: stack[stack.length - 1] ?? null, note: `dfs(${v}) finishes → post gets ${v}` }));
  };
  for (let v = 0; v < V; v++) {
    if (!marked[v]) {
      steps.push(snap({ current: null, note: `vertex ${v} is unmarked → start a new DFS from it` }));
      visit(v);
    }
  }
  return { pre, post, reversePost: post.slice().reverse(), steps };
}

export function hasDirectedCycle(adj) {
  const state = Array(adj.length).fill(0);
  const go = (v) => {
    state[v] = 1;
    for (const w of adj[v]) {
      if (state[w] === 1) return true;
      if (state[w] === 0 && go(w)) return true;
    }
    state[v] = 2;
    return false;
  };
  for (let v = 0; v < adj.length; v++) if (state[v] === 0 && go(v)) return true;
  return false;
}

export function parseEdges(text) {
  const edges = [];
  for (const m of text.matchAll(/(\d+)\s*(?:-|->|,|\s)\s*(\d+)/g)) edges.push([Number(m[1]), Number(m[2])]);
  return edges;
}
