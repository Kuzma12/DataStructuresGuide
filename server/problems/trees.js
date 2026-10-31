// Binary trees: recursive metrics, traversals, structural recursion and expression trees.
import { J, harness, stub, choose, TREE_NODE, TREE_HELPERS } from './kit.js';

const solutionClass = (methods) => `import java.util.*;\n\npublic class Solution {\n\n${methods}\n}\n`;

function treeTests(v) {
  return J`        for (int t = 0; t < 12; t++) {
            int n = ${v.nonEmpty ? '1 + rnd.nextInt(12)' : 't == 0 ? 0 : 1 + rnd.nextInt(12)'};
            final TreeNode root = randomTree(rnd, n, ${v.maxVal || 50});
${v.args || ''}
            final String label = "${v.name}(" + ser(root) + ${v.argLabel || '""'} + ")";
            test(label, () -> eq(label, ${v.refCall}, ${v.userCall}));
        }`;
}

/* ------------------------------------------------------------------ metrics */

const METRICS = [
  {
    name: 'size',
    sig: 'public static int size(TreeNode root)',
    doc: 'Returns the number of nodes in the tree. An empty tree (null) has size 0.',
    examples: [['size([5, 3, 8, 1])', '4'], ['size([])', '0']],
    body: J`        if (root == null) return 0;
        return 1 + size(root.left) + size(root.right);`,
    ref: J`    static int ref(TreeNode x) { return x == null ? 0 : 1 + ref(x.left) + ref(x.right); }`,
    refCall: 'ref(root)',
    userCall: 'Solution.size(copy(root))',
  },
  {
    name: 'height',
    sig: 'public static int height(TreeNode root)',
    doc: 'Returns the height: the number of EDGES on the longest path from the root down to a leaf.\nA single node has height 0. An empty tree has height -1.',
    examples: [['height([5])', '0'], ['height([5, 3, null, 1])', '2'], ['height([])', '-1']],
    body: J`        if (root == null) return -1;
        return 1 + Math.max(height(root.left), height(root.right));`,
    ref: J`    static int ref(TreeNode x) { return x == null ? -1 : 1 + Math.max(ref(x.left), ref(x.right)); }`,
    refCall: 'ref(root)',
    userCall: 'Solution.height(copy(root))',
  },
  {
    name: 'countLeaves',
    sig: 'public static int countLeaves(TreeNode root)',
    doc: 'Returns how many leaves the tree has (nodes with no children).',
    examples: [['countLeaves([5, 3, 8, 1])', '2']],
    body: J`        if (root == null) return 0;
        if (root.left == null && root.right == null) return 1;
        return countLeaves(root.left) + countLeaves(root.right);`,
    ref: J`    static int ref(TreeNode x) { if (x == null) return 0; if (x.left == null && x.right == null) return 1; return ref(x.left) + ref(x.right); }`,
    refCall: 'ref(root)',
    userCall: 'Solution.countLeaves(copy(root))',
  },
  {
    name: 'sum',
    sig: 'public static int sum(TreeNode root)',
    doc: 'Returns the sum of all values in the tree (0 for an empty tree).',
    examples: [['sum([5, 3, 8])', '16']],
    body: J`        if (root == null) return 0;
        return root.val + sum(root.left) + sum(root.right);`,
    ref: J`    static int ref(TreeNode x) { return x == null ? 0 : x.val + ref(x.left) + ref(x.right); }`,
    refCall: 'ref(root)',
    userCall: 'Solution.sum(copy(root))',
  },
  {
    name: 'countOneChild',
    sig: 'public static int countOneChild(TreeNode root)',
    doc: 'Returns how many nodes have exactly ONE child.',
    examples: [['countOneChild([5, 3, 8, 1])', '1  (node 3 has only a left child)']],
    body: J`        if (root == null) return 0;
        int here = (root.left == null) != (root.right == null) ? 1 : 0;
        return here + countOneChild(root.left) + countOneChild(root.right);`,
    ref: J`    static int ref(TreeNode x) { if (x == null) return 0; int h = ((x.left == null) ^ (x.right == null)) ? 1 : 0; return h + ref(x.left) + ref(x.right); }`,
    refCall: 'ref(root)',
    userCall: 'Solution.countOneChild(copy(root))',
  },
  {
    name: 'countAtDepth',
    sig: 'public static int countAtDepth(TreeNode root, int k)',
    doc: 'Returns how many nodes are at depth k. The root is at depth 0, its children at depth 1, ...',
    examples: [['countAtDepth([5, 3, 8, 1, 4], 2)', '2'], ['countAtDepth([5], 3)', '0']],
    body: J`        if (root == null) return 0;
        if (k == 0) return 1;
        return countAtDepth(root.left, k - 1) + countAtDepth(root.right, k - 1);`,
    ref: J`    static int ref(TreeNode x, int k) { if (x == null) return 0; if (k == 0) return 1; return ref(x.left, k - 1) + ref(x.right, k - 1); }`,
    args: '            final int k = rnd.nextInt(5);',
    argLabel: '", " + k',
    refCall: 'ref(root, k)',
    userCall: 'Solution.countAtDepth(copy(root), k)',
  },
  {
    name: 'maxValue',
    sig: 'public static int maxValue(TreeNode root)',
    doc: 'Returns the largest value in a NON-EMPTY tree (the tree is not a BST: search everywhere).',
    examples: [['maxValue([5, 30, 8, 1])', '30']],
    body: J`        int best = root.val;
        if (root.left != null) best = Math.max(best, maxValue(root.left));
        if (root.right != null) best = Math.max(best, maxValue(root.right));
        return best;`,
    ref: J`    static int ref(TreeNode x) { int b = x.val; if (x.left != null) b = Math.max(b, ref(x.left)); if (x.right != null) b = Math.max(b, ref(x.right)); return b; }`,
    nonEmpty: true,
    refCall: 'ref(root)',
    userCall: 'Solution.maxValue(copy(root))',
  },
  {
    name: 'countGreater',
    sig: 'public static int countGreater(TreeNode root, int x)',
    doc: 'Returns how many values in the tree are strictly greater than x.',
    examples: [['countGreater([5, 3, 8, 1], 4)', '2']],
    body: J`        if (root == null) return 0;
        int here = root.val > x ? 1 : 0;
        return here + countGreater(root.left, x) + countGreater(root.right, x);`,
    ref: J`    static int ref(TreeNode n, int x) { if (n == null) return 0; return (n.val > x ? 1 : 0) + ref(n.left, x) + ref(n.right, x); }`,
    args: '            final int x = rnd.nextInt(51);',
    argLabel: '", " + x',
    refCall: 'ref(root, x)',
    userCall: 'Solution.countGreater(copy(root), x)',
  },
];

const metrics = {
  id: 'trees-metrics',
  topic: 'trees',
  level: 1,
  title: 'Tree metrics',
  skill: 'Recursion on left and right subtrees',
  variants: METRICS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, METRICS, vi);
    return {
      title: `Binary tree: ${v.name}`,
      story: 'Nearly every tree method has the same shape: <em>handle null, do something with this node, combine the answers from the left and right subtrees.</em> Master this shape and the rest of the course gets easier.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}<br><span class="muted">Trees in examples are written in level order, with <code>null</code> marking a missing child.</span>`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: treeTests(v), helpers: TREE_HELPERS + v.ref }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: [
        'Start with <code>if (root == null) return ...;</code>. What is the right answer for an empty tree?',
        'Assume the recursive calls <code>' + v.name + '(root.left' + (v.args ? ', ...' : '') + ')</code> and <code>' + v.name + '(root.right' + (v.args ? ', ...' : '') + ')</code> already return correct answers for each subtree.',
        'Combine: what does THIS node add on top of the two subtree answers?',
      ],
      approach: [
        'Draw a 3-node tree and write the expected answer next to every node (as if each node were the root).',
        'Notice that each node’s answer comes from its children’s answers. That relationship is your recursive case.',
        'The null tree is the base case. Its value must make the formula work for leaves.',
      ],
    };
  },
};

/* ------------------------------------------------------------------ traversals */

const TRAVERSALS = [
  {
    name: 'preorder',
    sig: 'public static ArrayList<Integer> preorder(TreeNode root)',
    doc: 'Returns the values in PRE-order: node, then left subtree, then right subtree.',
    examples: [['preorder([5, 3, 8, 1, 4])', '[5, 3, 1, 4, 8]']],
    body: J`        ArrayList<Integer> out = new ArrayList<>();
        preorder(root, out);
        return out;
    }

    private static void preorder(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        out.add(x.val);
        preorder(x.left, out);
        preorder(x.right, out);`,
    ref: J`    static void ref(TreeNode x, List<Integer> out) { if (x == null) return; out.add(x.val); ref(x.left, out); ref(x.right, out); }`,
    hint: 'Visit order: add the node’s value FIRST, then recurse left, then right.',
  },
  {
    name: 'inorder',
    sig: 'public static ArrayList<Integer> inorder(TreeNode root)',
    doc: 'Returns the values IN-order: left subtree, then node, then right subtree.\n(For a BST this gives the keys in sorted order.)',
    examples: [['inorder([5, 3, 8, 1, 4])', '[1, 3, 4, 5, 8]']],
    body: J`        ArrayList<Integer> out = new ArrayList<>();
        inorder(root, out);
        return out;
    }

    private static void inorder(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        inorder(x.left, out);
        out.add(x.val);
        inorder(x.right, out);`,
    ref: J`    static void ref(TreeNode x, List<Integer> out) { if (x == null) return; ref(x.left, out); out.add(x.val); ref(x.right, out); }`,
    hint: 'Recurse left, THEN add the node’s value, then recurse right.',
  },
  {
    name: 'postorder',
    sig: 'public static ArrayList<Integer> postorder(TreeNode root)',
    doc: 'Returns the values in POST-order: left subtree, right subtree, then the node.',
    examples: [['postorder([5, 3, 8, 1, 4])', '[1, 4, 3, 8, 5]']],
    body: J`        ArrayList<Integer> out = new ArrayList<>();
        postorder(root, out);
        return out;
    }

    private static void postorder(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        postorder(x.left, out);
        postorder(x.right, out);
        out.add(x.val);`,
    ref: J`    static void ref(TreeNode x, List<Integer> out) { if (x == null) return; ref(x.left, out); ref(x.right, out); out.add(x.val); }`,
    hint: 'Both recursive calls first; add the node’s value LAST.',
  },
  {
    name: 'levelOrder',
    sig: 'public static ArrayList<Integer> levelOrder(TreeNode root)',
    doc: 'Returns the values level by level, left to right (breadth-first). Use a Queue.',
    examples: [['levelOrder([5, 3, 8, 1, 4])', '[5, 3, 8, 1, 4]']],
    body: J`        ArrayList<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode x = queue.remove();
            out.add(x.val);
            if (x.left != null) queue.add(x.left);
            if (x.right != null) queue.add(x.right);
        }
        return out;`,
    ref: J`    static void ref(TreeNode root, List<Integer> out) {
        if (root == null) return;
        Deque<TreeNode> q = new ArrayDeque<>(); q.add(root);
        while (!q.isEmpty()) { TreeNode x = q.poll(); out.add(x.val); if (x.left != null) q.add(x.left); if (x.right != null) q.add(x.right); }
    }`,
    hint: 'Put the root in a <code>Queue</code>. Repeat: remove the front node, record it, and add its non-null children to the back.',
  },
  {
    name: 'levels',
    sig: 'public static ArrayList<ArrayList<Integer>> levels(TreeNode root)',
    doc: 'Returns one list per depth: element 0 holds the root, element 1 holds depth-1 values\n(left to right), and so on. Empty tree gives an empty outer list.',
    examples: [['levels([5, 3, 8, 1, 4])', '[[5], [3, 8], [1, 4]]']],
    body: J`        ArrayList<ArrayList<Integer>> out = new ArrayList<>();
        ArrayList<TreeNode> level = new ArrayList<>();
        if (root != null) level.add(root);
        while (!level.isEmpty()) {
            ArrayList<Integer> values = new ArrayList<>();
            ArrayList<TreeNode> next = new ArrayList<>();
            for (TreeNode x : level) {
                values.add(x.val);
                if (x.left != null) next.add(x.left);
                if (x.right != null) next.add(x.right);
            }
            out.add(values);
            level = next;
        }
        return out;`,
    ref: J`    static void ref(TreeNode root, List<List<Integer>> out) { fill(root, 0, out); }
    static void fill(TreeNode x, int d, List<List<Integer>> out) {
        if (x == null) return;
        if (out.size() == d) out.add(new ArrayList<>());
        out.get(d).add(x.val);
        fill(x.left, d + 1, out); fill(x.right, d + 1, out);
    }`,
    hint: 'Process the tree one whole level at a time: keep a list of the nodes on the current level, and build the next level’s list from their children.',
  },
];

const traversals = {
  id: 'trees-traversal',
  topic: 'trees',
  level: 1,
  title: 'Traversals',
  skill: 'Pre / in / post / level order',
  variants: TRAVERSALS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, TRAVERSALS, vi);
    const nested = v.name === 'levels';
    const tests = J`        for (int t = 0; t < 12; t++) {
            int n = t == 0 ? 0 : 1 + rnd.nextInt(12);
            final TreeNode root = randomTree(rnd, n, 50);
            final ${nested ? 'List<List<Integer>>' : 'List<Integer>'} expected = new ArrayList<>();
            ref(root, expected);
            final String label = "${v.name}(" + ser(root) + ")";
            test(label, () -> eq(label, expected, Solution.${v.name}(copy(root))));
        }`;
    return {
      title: `Traversal: ${v.name}`,
      story: 'A traversal visits every node exactly once. The only difference between pre-, in- and post-order is <em>when</em> you record the current node relative to the two recursive calls.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: tests, helpers: TREE_HELPERS + v.ref }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: [
        'Recursive traversals are easiest with a private helper that takes the list as a parameter: <code>helper(TreeNode x, ArrayList&lt;Integer&gt; out)</code>. The public method creates the list, calls the helper, and returns the list.',
        v.hint,
        'Base case in the helper: if x is null, just return.',
      ],
      approach: ['Trace the example by hand, writing values down in the order you visit them.', 'Decide where the "record this node" line goes relative to the recursive calls.', 'Make sure an empty tree returns an empty list, not null.'],
    };
  },
};

/* ------------------------------------------------------------------ structure */

const STRUCTURE = [
  {
    name: 'sameTree',
    sig: 'public static boolean sameTree(TreeNode a, TreeNode b)',
    doc: 'Returns true if a and b have the same shape AND the same value in every position.',
    examples: [['sameTree([1, 2], [1, 2])', 'true'], ['sameTree([1, 2], [1, null, 2])', 'false']],
    body: J`        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.val == b.val && sameTree(a.left, b.left) && sameTree(a.right, b.right);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final TreeNode a = randomTree(rnd, rnd.nextInt(7), 3);
            TreeNode bb = copy(a);
            if (rnd.nextBoolean()) bb = randomTree(rnd, rnd.nextInt(7), 3);
            final TreeNode b = bb;
            final boolean expected = ser(a).equals(ser(b));
            test("sameTree(" + ser(a) + ", " + ser(b) + ")", () -> eq("sameTree", expected, Solution.sameTree(copy(a), copy(b))));
        }`,
    hints: ['Two empty trees are the same. If exactly one of them is empty, they are not.', 'Otherwise: same value here AND same left subtrees AND same right subtrees.'],
  },
  {
    name: 'mirror',
    sig: 'public static TreeNode mirror(TreeNode root)',
    doc: 'Mirrors the tree IN PLACE (swap left and right children at every node) and returns the root.',
    examples: [['mirror([5, 3, 8, 1])', '[5, 8, 3, null, null, null, 1]']],
    body: J`        if (root == null) return null;
        TreeNode oldLeft = root.left;
        root.left = mirror(root.right);
        root.right = mirror(oldLeft);
        return root;`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final TreeNode root = randomTree(rnd, t == 0 ? 0 : 1 + rnd.nextInt(10), 50);
            final String expected = ser(refMirror(copy(root)));
            test("mirror(" + ser(root) + ")", () -> eq("mirror", expected, ser(Solution.mirror(copy(root)))));
        }`,
    ref: J`    static TreeNode refMirror(TreeNode x) { if (x == null) return null; TreeNode l = x.left; x.left = refMirror(x.right); x.right = refMirror(l); return x; }`,
    hints: ['Mirror both subtrees, then attach them on the opposite sides.', 'Save one child in a temporary variable before you overwrite it.'],
  },
  {
    name: 'isSymmetric',
    sig: 'public static boolean isSymmetric(TreeNode root)',
    doc: 'Returns true if the tree is a mirror image of itself around the root.',
    examples: [['isSymmetric([1, 2, 2, 3, null, null, 3])', 'true'], ['isSymmetric([1, 2, 2, null, 3, null, 3])', 'false']],
    body: J`        return root == null || mirrors(root.left, root.right);
    }

    private static boolean mirrors(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.val == b.val && mirrors(a.left, b.right) && mirrors(a.right, b.left);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            TreeNode half = randomTree(rnd, rnd.nextInt(5), 3);
            TreeNode r = new TreeNode(1, half, refMirror(copy(half)));
            if (rnd.nextInt(3) == 0) r = randomTree(rnd, rnd.nextInt(6), 2);
            final TreeNode root = r;
            final boolean expected = ser(root).equals(ser(refMirror(copy(root))));
            test("isSymmetric(" + ser(root) + ")", () -> eq("isSymmetric", expected, Solution.isSymmetric(copy(root))));
        }`,
    ref: J`    static TreeNode refMirror(TreeNode x) { if (x == null) return null; TreeNode l = x.left; x.left = refMirror(x.right); x.right = refMirror(l); return x; }`,
    hints: ['Write a helper <code>mirrors(a, b)</code> that compares two subtrees.', 'a and b mirror each other when their values match, a.left mirrors b.right, and a.right mirrors b.left.'],
  },
  {
    name: 'hasPathSum',
    sig: 'public static boolean hasPathSum(TreeNode root, int target)',
    doc: 'Returns true if some ROOT-TO-LEAF path has values adding up to target. Empty tree: false.',
    examples: [['hasPathSum([5, 3, 8, 1], 9)', 'true  (5+3+1)'], ['hasPathSum([5, 3, 8, 1], 8)', 'false']],
    body: J`        if (root == null) return false;
        int remaining = target - root.val;
        if (root.left == null && root.right == null) return remaining == 0;
        return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final TreeNode root = randomTree(rnd, t == 0 ? 0 : 1 + rnd.nextInt(9), 9);
            List<Integer> sums = new ArrayList<>();
            paths(root, 0, sums);
            final int target = !sums.isEmpty() && rnd.nextBoolean() ? sums.get(rnd.nextInt(sums.size())) : rnd.nextInt(30);
            final boolean expected = sums.contains(target);
            test("hasPathSum(" + ser(root) + ", " + target + ")", () -> eq("hasPathSum", expected, Solution.hasPathSum(copy(root), target)));
        }`,
    ref: J`    static void paths(TreeNode x, int acc, List<Integer> out) {
        if (x == null) return;
        acc += x.val;
        if (x.left == null && x.right == null) out.add(acc);
        paths(x.left, acc, out); paths(x.right, acc, out);
    }`,
    hints: ['Subtract the current node’s value from target as you go down.', 'Only a LEAF can finish a path. At a leaf, check whether what remains is exactly 0.'],
  },
  {
    name: 'leaves',
    sig: 'public static ArrayList<Integer> leaves(TreeNode root)',
    doc: 'Returns the values of all leaves, from left to right.',
    examples: [['leaves([5, 3, 8, 1, 4])', '[1, 4, 8]']],
    body: J`        ArrayList<Integer> out = new ArrayList<>();
        collect(root, out);
        return out;
    }

    private static void collect(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        if (x.left == null && x.right == null) out.add(x.val);
        collect(x.left, out);
        collect(x.right, out);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final TreeNode root = randomTree(rnd, t == 0 ? 0 : 1 + rnd.nextInt(10), 50);
            final List<Integer> expected = new ArrayList<>();
            refLeaves(root, expected);
            test("leaves(" + ser(root) + ")", () -> eq("leaves", expected, Solution.leaves(copy(root))));
        }`,
    ref: J`    static void refLeaves(TreeNode x, List<Integer> out) { if (x == null) return; if (x.left == null && x.right == null) out.add(x.val); refLeaves(x.left, out); refLeaves(x.right, out); }`,
    hints: ['Any traversal that goes left before right visits leaves from left to right.', 'Add a node only when both of its children are null.'],
  },
];

const structure = {
  id: 'trees-structure',
  topic: 'trees',
  level: 2,
  title: 'Structural recursion',
  skill: 'Comparing and reshaping trees',
  variants: STRUCTURE.length,
  generate(rng, seed, vi) {
    const v = choose(rng, STRUCTURE, vi);
    return {
      title: `Tree structure: ${v.name}`,
      story: 'These problems recurse on the <em>shape</em> of a tree, sometimes two trees at once. They train you to think about the null cases carefully.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: v.tests, helpers: TREE_HELPERS + (v.ref || '') }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['List the null cases first (both null? one null?).', 'Write the condition for the current node.', 'Combine with the recursive results using && or || as needed.'],
    };
  },
};

/* ------------------------------------------------------------------ expression trees */

const EXPR_NODE = J`/** Provided. A node of an arithmetic expression tree. Do not change this file. */
public class ExprNode {
    String token;
    ExprNode left, right;

    ExprNode(String token) {
        this.token = token;
    }

    ExprNode(String token, ExprNode left, ExprNode right) {
        this.token = token;
        this.left = left;
        this.right = right;
    }

    boolean isOperator() {
        return token.equals("+") || token.equals("-") || token.equals("*") || token.equals("/");
    }
}
`;

const EXPR_HELPERS = J`
    static ExprNode randomExpr(Random r, int depth) {
        if (depth == 0 || r.nextInt(4) == 0) return new ExprNode(String.valueOf(r.nextInt(10)));
        String op = String.valueOf("+-*/".charAt(r.nextInt(4)));
        ExprNode left = randomExpr(r, depth - 1);
        ExprNode right = randomExpr(r, depth - 1);
        if (op.equals("/") && refEval(right) == 0) op = "+";
        return new ExprNode(op, left, right);
    }

    static double refEval(ExprNode x) {
        if (!x.isOperator()) return Double.parseDouble(x.token);
        double a = refEval(x.left), b = refEval(x.right);
        switch (x.token) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            default: return a / b;
        }
    }

    static String infix(ExprNode x) {
        if (x == null) return "null";
        if (!x.isOperator()) return x.token;
        return "(" + infix(x.left) + x.token + infix(x.right) + ")";
    }

    static void prefix(ExprNode x, List<String> out) {
        if (x == null) return;
        out.add(x.token);
        prefix(x.left, out);
        prefix(x.right, out);
    }
`;

const EXPRESSIONS = [
  {
    name: 'evaluate',
    sig: 'public static double evaluate(ExprNode root)',
    doc: 'Returns the value of the expression tree. Leaves hold single digits; internal nodes hold + - * /.\nUse real (double) division.',
    examples: [['evaluate( + (2) (* (4) (5)) )', '22.0'], ['evaluate( / (7) (2) )', '3.5']],
    body: J`        if (!root.isOperator()) return Double.parseDouble(root.token);
        double left = evaluate(root.left);
        double right = evaluate(root.right);
        switch (root.token) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            default: return left / right;
        }`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final ExprNode e = randomExpr(rnd, t < 2 ? 0 : 4);
            final double expected = refEval(e);
            test("evaluate(" + infix(e) + ")", () -> eq("evaluate(" + infix(e) + ")", expected, Solution.evaluate(e)));
        }`,
    hints: ['A leaf is a number: <code>Double.parseDouble(root.token)</code>.', 'For an operator, evaluate the left and right subtrees first (post-order), then apply the operator.'],
  },
  {
    name: 'toInfix',
    sig: 'public static String toInfix(ExprNode root)',
    doc: 'Returns the fully parenthesized infix form, with no spaces.\nEvery operator node becomes "(" + left + op + right + ")". A lone digit has no parentheses.',
    examples: [['toInfix( + (2) (* (4) (5)) )', '"(2+(4*5))"'], ['toInfix( 7 )', '"7"']],
    body: J`        if (!root.isOperator()) return root.token;
        return "(" + toInfix(root.left) + root.token + toInfix(root.right) + ")";`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final ExprNode e = randomExpr(rnd, t < 2 ? 0 : 4);
            final String expected = infix(e);
            List<String> pre = new ArrayList<>(); prefix(e, pre);
            test("toInfix(tree with prefix " + pre + ")", () -> eq("toInfix", expected, Solution.toInfix(e)));
        }`,
    hints: ['This is an IN-order traversal that builds a string.', 'Leaf: return the token. Operator: wrap left + token + right in parentheses.'],
  },
  {
    name: 'toPrefix',
    sig: 'public static ArrayList<String> toPrefix(ExprNode root)',
    doc: 'Returns the tokens in prefix (Polish) notation: operator first, then left operand, then right operand.',
    examples: [['toPrefix( (2+(4*5)) )', '["+", "2", "*", "4", "5"]']],
    body: J`        ArrayList<String> out = new ArrayList<>();
        collect(root, out);
        return out;
    }

    private static void collect(ExprNode x, ArrayList<String> out) {
        if (x == null) return;
        out.add(x.token);
        collect(x.left, out);
        collect(x.right, out);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final ExprNode e = randomExpr(rnd, t < 2 ? 0 : 4);
            final List<String> expected = new ArrayList<>(); prefix(e, expected);
            test("toPrefix(" + infix(e) + ")", () -> eq("toPrefix(" + infix(e) + ")", expected, Solution.toPrefix(e)));
        }`,
    hints: ['Prefix notation is exactly a PRE-order traversal.', 'Use a helper that appends to a list: record token, recurse left, recurse right.'],
  },
  {
    name: 'fromPrefix',
    sig: 'public static ExprNode fromPrefix(List<String> tokens)',
    doc: 'tokens is a valid prefix expression, e.g. ["+", "2", "*", "4", "5"]. Build and return its tree.\nHint: keep a position counter that every recursive call advances (a field or a one-element int array).',
    examples: [['fromPrefix(["+", "2", "*", "4", "5"])', 'tree for (2+(4*5))']],
    body: J`        int[] pos = {0};
        return build(tokens, pos);
    }

    private static ExprNode build(List<String> tokens, int[] pos) {
        String token = tokens.get(pos[0]++);
        ExprNode node = new ExprNode(token);
        if (node.isOperator()) {
            node.left = build(tokens, pos);
            node.right = build(tokens, pos);
        }
        return node;`,
    tests: J`        for (int t = 0; t < 12; t++) {
            ExprNode e = randomExpr(rnd, t < 2 ? 0 : 4);
            final List<String> tokens = new ArrayList<>(); prefix(e, tokens);
            final String expected = infix(e);
            test("fromPrefix(" + tokens + ")", () -> eq("tree (shown as infix)", expected, infix(Solution.fromPrefix(new ArrayList<>(tokens)))));
        }`,
    hints: [
      'Read one token. If it is a digit, it is a leaf and you are done with this call.',
      'If it is an operator, the next complete expression is its left child and the one after that is its right child. Build both recursively.',
      'All the calls must share ONE position counter, so pass an <code>int[] pos</code> (arrays are shared by reference) or use a static field that you reset.',
    ],
  },
];

const expressions = {
  id: 'trees-expression',
  topic: 'trees',
  level: 2,
  title: 'Expression trees',
  skill: 'Trees as hierarchy of operations',
  variants: EXPRESSIONS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, EXPRESSIONS, vi);
    return {
      title: `Expression tree: ${v.name}`,
      story: 'Operators are internal nodes and operands are leaves. The tree’s shape encodes the order of operations, so there are no parentheses inside the tree.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [{ name: 'ExprNode.java', code: EXPR_NODE }],
      harness: harness({ seed, body: v.tests, helpers: EXPR_HELPERS }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Draw the tree for (2+(4*5)): + at the root, 2 on the left, * on the right with children 4 and 5.', 'Decide which traversal order matches the task.', 'Leaves (digits) are the base case.'],
    };
  },
};

export default [metrics, traversals, structure, expressions];
