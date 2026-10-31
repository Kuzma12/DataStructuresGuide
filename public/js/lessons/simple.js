// "In simple words" sections: the first stop for every topic. Short sentences, everyday
// comparisons, and an animation, before any technical detail.

const words = (list) => `<div class="words"><h4>Words to know</h4><dl>${list.map(([w, d]) => `<dt>${w}</dt><dd>${d}</dd>`).join('')}</dl></div>`;
const big = (t) => `<div class="big-idea"><span>Big idea</span><p>${t}</p></div>`;

export const SIMPLE = {
  method: {
    id: 'simple',
    title: 'In simple words',
    body: `
<p>Writing code is a lot like solving a puzzle. Nobody looks at a 1,000-piece puzzle and just "knows" it. They sort the edge pieces first, then work on one small area at a time.</p>
${big('You do not need to know the answer to start. You need a <b>plan</b>: understand the problem, try a tiny example by hand, then build the code one small piece at a time.')}
<p>In this guide you will always see things in this order:</p>
<ol class="steps">
  <li><b>Watch</b> an animation of the idea.</li>
  <li><b>Read</b> a short, simple explanation.</li>
  <li><b>Trace</b> it yourself with a drill (predict what happens).</li>
  <li><b>Code</b> it, and get instant feedback from real tests.</li>
</ol>
${words([['Algorithm', 'A list of steps that solves a problem, like a recipe.'], ['Bug', 'A mistake in code.'], ['Test', 'A small check: “for this input, the answer should be this.”'], ['Compile', 'Java reads your whole file to check that it makes sense before running it.']])}`,
  },
  java: {
    id: 'simple',
    title: 'In simple words',
    watch: 'recursion',
    body: `
<p>Java is very picky, like a strict teacher grading spelling. Every <code>;</code> and <code>{ }</code> matters. That sounds annoying, but it means Java tells you about many mistakes <em>before</em> your program even runs.</p>
${big('A <b>method</b> is a small machine: you give it inputs, and it gives back an answer. A <b>recursive</b> method solves a big problem by asking a copy of itself to solve a smaller one.')}
<p>Think of Russian nesting dolls. To count the dolls, you open the big one. Inside is a smaller doll, the same kind of problem but smaller. You keep opening until you reach the tiny doll that does not open. That tiny doll is the <b>base case</b>. Then you count your way back out.</p>
<p>Watch the animation below. Each call to <code>sumDigits</code> gets its own box. The boxes stack up, then finish from the top down.</p>
${words([['Variable', 'A named box that holds a value, like <code>int n = 5;</code>'], ['Method', 'A named set of steps you can run again and again.'], ['Recursion', 'A method that calls itself on a smaller problem.'], ['Base case', 'The smallest problem, with an answer you already know. It stops the recursion.'], ['Stack', 'A pile where you only add or remove at the top, like a stack of plates.']])}`,
  },
  trees: {
    id: 'simple',
    title: 'In simple words',
    watch: 'traversal',
    body: `
<p>A <b>tree</b> in code looks like a family tree drawn upside down. The top person is the <b>root</b>. Each person can have up to two children: a left child and a right child. People with no children are <b>leaves</b>.</p>
${big('Every part of a tree is also a tree. The left child, plus everyone below it, is a smaller tree. That is why recursion works so well on trees.')}
<p>A <b>traversal</b> means visiting every node once, like a mail carrier who must stop at every house. There are a few common routes. In the animation, try switching between Preorder, Inorder and Postorder and watch how only the <em>moment</em> we write a node down changes.</p>
${words([['Node', 'One circle in the tree. It holds a value and links to its children.'], ['Root', 'The top node.'], ['Leaf', 'A node with no children.'], ['Height', 'How many steps it is from the root down to the deepest leaf.'], ['null', 'Java’s word for “nothing here”, like an empty spot where a child could be.']])}`,
  },
  bst: {
    id: 'simple',
    title: 'In simple words',
    watch: 'bst-insert',
    body: `
<p>Remember the game “I’m thinking of a number from 1 to 100”? Each guess, you hear “higher” or “lower”, and you throw away half the numbers. A <b>binary search tree</b> (BST) is that game built into a tree.</p>
${big('In a BST, everything to the <b>left</b> of a node is <b>smaller</b>, and everything to the <b>right</b> is <b>bigger</b>. So to find something, you only ever go down one path.')}
<p>To <b>insert</b> a new key, play the same game: compare, go left or right, and when you reach an empty spot, the new node goes there. Then, on the way back up, each node updates how many nodes are under it (its <b>size</b>).</p>
${words([['Key', 'The thing we sort by, like a student ID.'], ['Value', 'The information stored with the key, like the student’s name.'], ['Compare', 'Check which of two keys is smaller. In Java we use <code>compareTo</code>.'], ['Successor', 'The next bigger key. It is used when deleting a node.']])}`,
  },
  llrb: {
    id: 'simple',
    title: 'In simple words',
    watch: 'llrb-insert',
    body: `
<p>A plain BST can get lopsided. Insert 1, 2, 3, 4, 5 in order and you get a long, skinny line instead of a bushy tree, and searching becomes slow.</p>
${big('A <b>red-black tree</b> fixes itself after every insert, using three small moves: <b>rotate left</b>, <b>rotate right</b>, and <b>flip colors</b>. The result always stays short and bushy.')}
<p>Think of a red link as <b>glue</b>: two nodes glued together act like one wide node that holds two keys. When three get glued together, that is too many, so the middle one gets pushed up (that is the color flip). Watch the nodes slide around in the animation. Try typing 1 2 3 4 5 6 7 to see a “stick” turn into a balanced tree.</p>
${words([['Balanced', 'All the paths from top to bottom are about the same length.'], ['Rotation', 'A small rearrangement of three nodes that keeps them in order.'], ['Red link', 'A link that glues a node to its parent.'], ['2-3 tree', 'A tree where a node can hold one or two keys. The red-black tree is secretly one of these.']])}`,
  },
  hash: {
    id: 'simple',
    title: 'In simple words',
    watch: 'hash-put',
    body: `
<p>Imagine a wall of numbered mailboxes. Instead of searching every mailbox for your letter, a rule tells you exactly which box it is in. A <b>hash table</b> works the same way.</p>
${big('A <b>hash function</b> turns any key into a number, and that number picks a bucket. To find a key later, you jump straight to its bucket. There is no searching through everything.')}
<p>Sometimes two keys land in the same bucket. That is called a <b>collision</b>. We simply keep a short list (a <b>chain</b>) in each bucket. If the chains get too long, we get more buckets and move every key to its new spot. Watch it happen in the animation.</p>
${words([['Hash code', 'A number made from a key. The same key always gives the same number.'], ['Bucket', 'One slot of the table.'], ['Collision', 'Two keys that land in the same bucket.'], ['Resize', 'Making the table bigger and moving every key to its new bucket.']])}`,
  },
  graphs: {
    id: 'simple',
    title: 'In simple words',
    watch: 'dfs',
    body: `
<p>A <b>graph</b> is a set of dots connected by lines, like a map of cities and roads, or friends on a social app. The dots are <b>vertices</b> and the lines are <b>edges</b>.</p>
${big('There are two classic ways to explore a graph. <b>Depth-first search (DFS)</b> goes as deep as it can, like exploring a maze. <b>Breadth-first search (BFS)</b> spreads out in rings, like ripples in a pond, and finds the shortest paths.')}
<p>Both keep a list of places already <b>visited</b>, so they never walk in circles. In the animation, blue means visited, and the highlighted lines show the path we used to reach each vertex.</p>
${words([['Vertex', 'A dot in the graph (plural: vertices).'], ['Edge', 'A line connecting two vertices.'], ['Neighbor', 'A vertex connected to this one by an edge.'], ['Queue', 'A line where the first one in is the first one out, like a line at a store.']])}`,
  },
  digraphs: {
    id: 'simple',
    title: 'In simple words',
    watch: 'topo',
    body: `
<p>Some connections only go one way. You must take Math 1 before Math 2, not the other way around. A graph with one-way arrows is a <b>directed graph</b>, or <b>digraph</b>.</p>
${big('A <b>topological sort</b> puts tasks in an order where every arrow points forward, so you never do a task before the tasks it needs. It only works when there are no loops (cycles).')}
<p>The clever trick: run DFS, and write a vertex down when it is completely <b>finished</b>, meaning everything it points to is done. Then read that list backwards. Watch the animation build the list.</p>
${words([['Directed edge', 'An arrow: it goes from one vertex to another, only in that direction.'], ['Cycle', 'A loop: following arrows brings you back where you started.'], ['DAG', 'A directed graph with no cycles.'], ['Postorder', 'The order in which DFS finishes vertices.']])}`,
  },
};

/** Short, kid-friendly definitions used for hover tooltips throughout the lessons. */
export const GLOSSARY = {
  recursion: 'A method that solves a problem by calling itself on a smaller version of the same problem.',
  'base case': 'The smallest version of the problem. Its answer is known, so the recursion stops there.',
  'call stack': 'The pile of method calls that are waiting to finish. The newest call is on top.',
  null: 'Java’s word for “nothing here”: a reference that points to no object.',
  traversal: 'Visiting every node of a tree (or graph) exactly once.',
  inorder: 'Left subtree, then the node, then the right subtree. In a BST this gives sorted order.',
  preorder: 'The node first, then the left subtree, then the right subtree.',
  postorder: 'The left subtree, then the right subtree, and the node last.',
  leaf: 'A node with no children.',
  height: 'The number of edges on the longest path from the root down to a leaf.',
  subtree: 'A node together with everything below it.',
  successor: 'The next bigger key: the smallest key in a node’s right subtree.',
  rotation: 'A small rearrangement of nodes that keeps them in order but changes their shape.',
  'red link': 'In a red-black tree, a link that glues a node to its parent so the pair acts like one 2-3 node.',
  collision: 'Two different keys that land in the same hash bucket.',
  'load factor': 'Keys divided by buckets: the average length of a chain.',
  'hash code': 'A number computed from a key. Equal keys always have equal hash codes.',
  vertex: 'A dot in a graph.',
  vertices: 'The dots in a graph (one dot is a vertex).',
  edge: 'A connection between two vertices.',
  queue: 'First in, first out, like a line at a store.',
  stack: 'Last in, first out, like a pile of plates.',
  dag: 'A directed graph with no cycles.',
  cycle: 'A path that leads back to where it started.',
  'topological order': 'An order of the vertices where every edge points forward.',
  generics: 'Writing one class that works for many types, like BST&lt;Key, Value&gt;.',
  'compareTo': 'The method that tells which of two keys is smaller: negative, zero, or positive.',
  invariant: 'A rule that must stay true the whole time, like “left is smaller, right is bigger”.',
};
