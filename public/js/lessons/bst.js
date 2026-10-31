import { code } from '../ui.js';
import { BST } from '../ds.js';
import { treeSvg } from '../viz.js';

const t = new BST([50, 30, 70, 20, 40, 60, 80, 35]);
const stick = new BST([1, 2, 3, 4, 5]);

export default {
  id: 'bst',
  intro: 'Ordered symbol tables: put, get, ordered queries, range searches and deletion. This is the topic of Weekly Assignment 2 (the mailroom index).',
  sections: [
    {
      id: 'invariant',
      title: 'The BST rule',
      body: `
<p>A binary search tree stores <strong>key–value pairs</strong>, keeping one rule at <em>every</em> node:</p>
<div class="callout">Every key in the left subtree is <b>smaller</b>, and every key in the right subtree is <b>larger</b>.</div>
<div class="figure">${treeSvg(t.root, { label: (n) => `size ${n.size}` })}</div>
<p>To find a key, start at the root and compare: go left if smaller, right if larger. Each comparison discards a whole subtree, so a search takes about <em>height</em> steps.</p>
<p>Each node also stores <code>size</code>, the number of nodes in its subtree (shown under each node). It costs one line to maintain and makes <code>rank</code>, <code>select</code> and <code>size()</code> fast.</p>`,
      quiz: { q: 'Searching for 35 in the tree above visits which nodes?', options: ['50, 30, 40, 35', '50, 30, 35', '50, 70, 60, 35'], answer: 0, why: '35 < 50 → left to 30; 35 > 30 → right to 40; 35 < 40 → left to 35. Found.' },
    },
    {
      id: 'get',
      title: 'get: search',
      body: `
${code(`
public Value get(Key key) {
    return get(root, key);
}

private Value get(Node x, Key key) {
    if (x == null) return null;              // fell off the tree: not present
    int cmp = key.compareTo(x.key);
    if (cmp < 0) return get(x.left, key);
    if (cmp > 0) return get(x.right, key);
    return x.val;                            // cmp == 0: found
}`, 'Recursive get')}
<p>Returning <code>null</code> for “not found” is the standard convention. Callers must check for it before using the value.</p>`,
    },
    {
      id: 'put',
      title: 'put: the “return the new subtree” pattern',
      body: `
<p>Insertion uses one of the most important patterns in the course. The recursive method <strong>returns the root of the subtree after the change</strong>, and the caller <strong>reassigns its link</strong> to whatever comes back:</p>
${code(`
public void put(Key key, Value val) {
    root = put(root, key, val);                   // root may change (empty tree!)
}

private Node put(Node x, Key key, Value val) {
    if (x == null) return new Node(key, val, 1);  // the new node hangs here
    int cmp = key.compareTo(x.key);
    if      (cmp < 0) x.left  = put(x.left,  key, val);
    else if (cmp > 0) x.right = put(x.right, key, val);
    else              x.val   = val;              // existing key: replace value
    x.size = 1 + size(x.left) + size(x.right);    // fix the count on the way up
    return x;
}`, 'Recursive put with size maintenance')}
<p>Why the reassignment? When the recursion reaches <code>null</code>, it creates a node and returns it, and the parent’s <code>x.left = ...</code> line is what actually links it in. Nodes that did not change just return themselves, so their links are reassigned to the same value, which is harmless.</p>
<p><b>Duplicates:</b> putting an existing key <em>replaces</em> its value. If your application must not lose the old value (like adding a package to an existing mailbox), the client code must <code>get</code> first. See the client section below.</p>`,
      lab: 'bst',
    },
    {
      id: 'shape',
      title: 'Why order of insertion matters',
      body: `
<p>The same keys inserted in a different order give a different tree. Inserting 1, 2, 3, 4, 5 in order builds a “stick”:</p>
<div class="figure">${treeSvg(stick.root, { dx: 34, dy: 40 })}</div>
<p>Now height = N − 1, and search is as slow as a linked list. Random insertion orders give height around 2 ln N on average, but the worst case is real. That is the motivation for red-black trees (next topic).</p>`,
    },
    {
      id: 'ordered',
      title: 'Ordered operations: min, max, floor, ceiling, rank, select',
      body: `
<ul class="defs">
  <li><b>min / max</b>: follow left (or right) links until you can’t.</li>
  <li><b>floor(k)</b>: the largest key ≤ k. If k &lt; x.key, the floor is definitely on the left. If k &gt; x.key, it <em>might</em> be on the right; if nothing smaller-or-equal exists there, x itself is the floor.</li>
  <li><b>ceiling(k)</b>: the mirror image of floor.</li>
  <li><b>rank(k)</b>: how many keys are &lt; k. Going right means everything on the left, plus x, is smaller: <code>1 + size(x.left) + rank(x.right, k)</code>.</li>
  <li><b>select(i)</b>: the key of rank i. Compare i with <code>size(x.left)</code> to decide which way to go.</li>
</ul>
${code(`
private int rank(Node x, Key key) {
    if (x == null) return 0;
    int cmp = key.compareTo(x.key);
    if (cmp < 0) return rank(x.left, key);
    if (cmp > 0) return 1 + size(x.left) + rank(x.right, key);
    return size(x.left);
}`, 'rank uses the size fields: no full traversal')}`,
      quiz: { q: 'Keys {20, 30, 35, 40, 50, 60, 70, 80}. What is floor(45)?', options: ['40', '50', '35'], answer: 0, why: 'The largest key that is ≤ 45 is 40.' },
    },
    {
      id: 'range',
      title: 'Range queries: pruning',
      body: `
<p>“All keys between lo and hi” is an inorder traversal that <strong>skips subtrees that cannot contain answers</strong>:</p>
${code(`
private void keys(Node x, ArrayList<Key> out, Key lo, Key hi) {
    if (x == null) return;
    int cmplo = lo.compareTo(x.key);
    int cmphi = hi.compareTo(x.key);
    if (cmplo < 0) keys(x.left, out, lo, hi);                 // left side might have keys ≥ lo
    if (cmplo <= 0 && cmphi >= 0) out.add(x.key);             // x itself is in range
    if (cmphi > 0) keys(x.right, out, lo, hi);                // right side might have keys ≤ hi
}`, 'Pruned inorder traversal: results come out sorted')}
<p>This is the same kind of “which side can the answer be on?” reasoning that <code>rank</code> uses. Results come out in sorted order because it is still inorder.</p>
<p><b>Designing keys for range queries.</b> If keys are built so that related items sort next to each other, a range query can fetch a whole group. Example: warehouse keys <code>"07-03"</code> (aisle 07, shelf 03). Every shelf in aisle 7 lies between <code>"07-00"</code> and <code>"07-99"</code>, because String comparison goes character by character, left to right.</p>`,
    },
    {
      id: 'delete',
      title: 'Deletion: deleteMin and Hibbard deletion',
      body: `
<p><b>deleteMin</b> goes left until a node has no left child. That node is replaced by its right child, using the same return-the-new-subtree pattern:</p>
${code(`
private Node deleteMin(Node x) {
    if (x.left == null) return x.right;       // x is the min: splice it out
    x.left = deleteMin(x.left);
    x.size = 1 + size(x.left) + size(x.right);
    return x;
}`, 'deleteMin')}
<p><b>Hibbard deletion</b> of an arbitrary key:</p>
<ol class="steps">
  <li>Find the node, as in get.</li>
  <li>No right child → replace it with its left child. No left child → replace it with its right child.</li>
  <li>Two children → replace it with its <strong>successor</strong>, the minimum of its right subtree:</li>
</ol>
${code(`
Node t = x;                      // remember the node being deleted
x = min(t.right);                // successor takes its place
x.right = deleteMin(t.right);    // successor removed from the right subtree
x.left = t.left;                 // inherits the left subtree`, 'The four lines at the heart of Hibbard deletion (order matters)')}
<p>Then, as always, <code>x.size = ...; return x;</code> on the way up. Try deleting a node with two children in the lab, and watch where the successor comes from.</p>`,
      lab: 'bst',
    },
    {
      id: 'client',
      title: 'Client code: get-then-put and grouping',
      body: `
<p>Many applications store a <em>collection</em> per key, like all packages for one apartment. A plain <code>put</code> would overwrite the collection. The standard pattern:</p>
${code(`
ArrayList<String> items = index.get(customer);   // look first
if (items == null) {                             // first time we see this key
    items = new ArrayList<>();
    index.put(customer, items);                  // store the (empty) list ONCE
}
items.add(item);                                 // the list lives inside the tree`, 'Upsert without changing how the BST works')}
<p>Counting is the same pattern with integers: <code>Integer c = st.get(k); st.put(k, c == null ? 1 : c + 1);</code></p>`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA2 (mailroom BST)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1–2. Build the index</td><td>put/get with sizes; get-then-put so mailboxes are never overwritten</td><td><em>BST put &amp; get</em>, <em>groupOrders</em></td></tr>
<tr><td>3. Building totals</td><td>range query on composite keys; generate lo/hi keys from a building number</td><td><em>range keys</em>, <em>aisleTotal</em></td></tr>
<tr><td>4. Remove mailboxes</td><td>Hibbard delete with min / deleteMin</td><td><em>Hibbard deletion</em>, deletion drills</td></tr></table>
<p><b>Pitfalls the PDF calls out:</b> the scalability test checks <code>size</code>, so every node’s size field must be right even when the shape is right. Range results must come out in inorder. Deletion must be Hibbard (successor), not predecessor.</p>`,
    },
  ],
};
