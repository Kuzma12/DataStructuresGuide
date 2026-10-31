import { code } from '../ui.js';
import { LLRB, to23 } from '../ds.js';
import { treeSvg, tree23Svg } from '../viz.js';

const demoKeys = ['S', 'E', 'A', 'R', 'C', 'H', 'X', 'M'];
const demo = new LLRB(demoKeys);

export default {
  id: 'llrb',
  intro: 'Guaranteed balance: 2-3 trees, and the left-leaning red-black BST that encodes them. This is the topic of Weekly Assignment 3 (game object index).',
  sections: [
    {
      id: 'why',
      title: 'Why we need balance',
      body: `
<p>A plain BST is only fast if it stays short. Sorted input (very common in practice: IDs, timestamps) produces a stick of height N − 1. We want height around log₂ N <em>no matter</em> the insertion order.</p>
<p>The plan: understand a tree that is <strong>perfectly balanced by design</strong> (the 2-3 tree), then see how to store it inside an ordinary BST using one extra bit per node: the color.</p>`,
    },
    {
      id: 'two-three',
      title: '2-3 trees',
      body: `
<ul class="defs">
  <li>A <b>2-node</b> holds 1 key and has 2 children (smaller / larger).</li>
  <li>A <b>3-node</b> holds 2 keys and has 3 children (smaller than both / between / larger than both).</li>
  <li>Every path from the root to a null link has the <b>same length</b>: perfect balance.</li>
</ul>
<p><b>Insertion</b> always adds the key to an existing bottom node:</p>
<ol class="steps">
  <li>Into a 2-node → it becomes a 3-node. Done.</li>
  <li>Into a 3-node → temporarily a 4-node (3 keys). <b>Split</b> it: the middle key moves up into the parent, and the other two become separate 2-nodes.</li>
  <li>If the parent overflows too, split it, and so on up. If the root splits, the tree grows one level taller at the top, so every path gets longer by one together.</li>
</ol>
<p>Because the tree only ever grows <em>at the root</em>, balance is never lost.</p>
<div class="figure">${tree23Svg(to23(demo.root))}</div>
<p class="muted center">The 2-3 tree after inserting ${demoKeys.join(' ')}.</p>`,
      quiz: { q: 'When does a 2-3 tree get taller?', options: ['When a leaf splits', 'Only when the root splits', 'Every time a key is inserted'], answer: 1, why: 'Splits push a key upward. Height increases only when the root itself splits, which lengthens every path at once.' },
    },
    {
      id: 'encoding',
      title: 'Red links: a 2-3 tree in BST clothing',
      body: `
<p>Represent each 3-node as <strong>two BST nodes joined by a red link</strong>, leaning left. Ordinary links are black. The color is stored in the child node: <code>x.color == RED</code> means “the link from my parent to me is red”.</p>
<div class="figure two">${treeSvg(demo.root)}${tree23Svg(to23(demo.root))}</div>
<p>Rules of a left-leaning red-black BST:</p>
<ol class="steps">
  <li>Red links lean <b>left</b>.</li>
  <li>No node has two red links touching it (no red-red in a row, no two red children).</li>
  <li><b>Perfect black balance</b>: every path from the root to null has the same number of black links.</li>
</ol>
<p>Squash every red link flat and you get the 2-3 tree back. That is why the LLRB stays balanced: its black height <em>is</em> the 2-3 tree’s height.</p>`,
    },
    {
      id: 'rotations',
      title: 'Rotations',
      body: `
<p>Insertions can create a red link that leans the wrong way. A <strong>rotation</strong> fixes it locally and keeps the inorder order (and the black balance) unchanged:</p>
${code(`
Node rotateLeft(Node h) {          // h's RIGHT link is red; make it lean left
    Node x = h.right;
    h.right = x.left;              // the middle subtree changes parent
    x.left = h;
    x.color = h.color;             // x takes h's place, and its color
    h.color = RED;                 // h is now x's red left child
    x.size = h.size;               // x roots the same set of nodes
    h.size = 1 + size(h.left) + size(h.right);
    return x;                      // new root of this subtree
}`, 'rotateLeft (rotateRight is the mirror image)')}
<p>Draw it: before, the order is <code>A h B x C</code> (A, B and C are subtrees). After, it is still <code>A h B x C</code>, but x is on top. The caller must reassign its link to the returned node: <code>h = rotateLeft(h);</code>.</p>`,
    },
    {
      id: 'flip',
      title: 'Color flips',
      body: `
<p>If a node has <b>two red children</b>, that is a temporary 4-node. A color flip splits it: both children turn black, and the node turns red, which sends it up into its parent’s 2-3 node.</p>
${code(`
void flipColors(Node h) {
    h.color = RED;
    h.left.color = BLACK;
    h.right.color = BLACK;
}`, 'flipColors: no links move, only three colors change')}
<p>After any insertion the root might end up red. Since the root has no parent link, simply color it black again.</p>`,
    },
    {
      id: 'put',
      title: 'put in three lines',
      body: `
<p>LLRB insertion = BST insertion with a <strong>red</strong> new node, plus three checks on the way back up. Each check fixes what the previous one might create:</p>
${code(`
private Node put(Node h, Key key, Value val) {
    if (h == null) return new Node(key, val, RED, 1);
    int cmp = key.compareTo(h.key);
    if      (cmp < 0) h.left  = put(h.left,  key, val);
    else if (cmp > 0) h.right = put(h.right, key, val);
    else              h.val   = val;

    if (isRed(h.right) && !isRed(h.left))     h = rotateLeft(h);   // lean left
    if (isRed(h.left)  &&  isRed(h.left.left)) h = rotateRight(h); // balance a 4-node
    if (isRed(h.left)  &&  isRed(h.right))     flipColors(h);      // split it

    h.size = 1 + size(h.left) + size(h.right);
    return h;
}`, 'Sedgewick’s LLRB put; the public put then sets root.color = BLACK')}
<p>Three separate <code>if</code>s, not <code>else if</code>: a single insertion may need a rotate-left, then a rotate-right, then a flip, all at the same node. Insert keys in the lab and read the log to see which fixes fire.</p>`,
      lab: 'llrb',
      quiz: { q: 'Insert 1, 2, 3 (ascending) into an empty LLRB. What is the root afterwards?', options: ['1', '2', '3'], answer: 1, why: '1 is the root and 2 goes right (red) → rotateLeft makes 2 the root. 3 goes right of 2 (red), so 2 has two red children → flip. Root 2, recolored black.' },
    },
    {
      id: 'reading',
      title: 'Reading the 2-3 tree inside an LLRB',
      body: `
<p>Many questions about an LLRB are really questions about its hidden 2-3 tree:</p>
<ul class="defs">
  <li><b>How many 3-nodes?</b> One per red link.</li>
  <li><b>Height of the 2-3 tree?</b> The number of black links on any root-to-null path. They are all equal.</li>
  <li><b>Which keys share a logical node?</b> A node and its <em>red</em> left child.</li>
</ul>
<p>To walk the 2-3 tree level by level, treat “node plus red left child” as <em>one</em> logical node, and remember its up to three logical children: the red child’s two children and the node’s right child. A logical node’s children are always reached by <em>black</em> links.</p>
<p>The <em>Inspecting an LLRB</em> problems (countRed, blackHeight, redKeys, is23, isBalanced) build exactly this way of seeing.</p>`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA3 (game objects in an LLRB)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1. Parse CSV lines</td><td>split on commas, trim, parse numbers, construct objects</td><td>Parsing problems</td></tr>
<tr><td>2. LLRB put</td><td>BST put + rotations + flip, root black</td><td><em>LLRB insertion</em>, <em>rotations</em>, LLRB drills</td></tr>
<tr><td>3. get + area filter</td><td>get returns null for missing ids; check for null before using the value</td><td>BST get, client problems</td></tr>
<tr><td>4. 2-3 level traversal</td><td>level-by-level walk where a red link means “same logical node”; lists of lists of lists</td><td><em>levels</em> traversal, <em>Inspecting an LLRB</em>, the 2-3 view in the lab</td></tr></table>
<p><b>Pitfalls:</b> the expected tree must match exactly, so do the three checks in the right order. Handle invalid ids without NullPointerException. For Step 4, compare your output against Figure 2 of the PDF before writing much code.</p>`,
    },
  ],
};
