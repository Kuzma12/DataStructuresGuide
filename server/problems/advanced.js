// Very hard (level 4) and extreme (level 5) problem types.
import { J, harness, stub, choose, TREE_NODE, TREE_HELPERS } from './kit.js';
import { DIGRAPH } from './digraphs.js';

const solutionClass = (methods, imports = 'import java.util.*;\n\n') => `${imports}public class Solution {\n\n${methods}\n}\n`;

/* ------------------------------------------------------------------ L4: infix with precedence */

const INFIX_HELPERS = J`
    static int prec(String op) { return op.equals("+") || op.equals("-") ? 1 : 2; }
    static boolean isOp(String t) { return t.equals("+") || t.equals("-") || t.equals("*"); }

    static List<String> refPostfix(String expr) {
        List<String> out = new ArrayList<>();
        Deque<String> ops = new ArrayDeque<>();
        for (String t : expr.split(" ")) {
            if (isOp(t)) {
                while (!ops.isEmpty() && isOp(ops.peek()) && prec(ops.peek()) >= prec(t)) out.add(ops.pop());
                ops.push(t);
            } else if (t.equals("(")) ops.push(t);
            else if (t.equals(")")) { while (!ops.peek().equals("(")) out.add(ops.pop()); ops.pop(); }
            else out.add(t);
        }
        while (!ops.isEmpty()) out.add(ops.pop());
        return out;
    }

    static long refEval(String expr) {
        Deque<Long> st = new ArrayDeque<>();
        for (String t : refPostfix(expr)) {
            if (isOp(t)) { long b = st.pop(), a = st.pop(); st.push(t.equals("+") ? a + b : t.equals("-") ? a - b : a * b); }
            else st.push(Long.parseLong(t));
        }
        return st.pop();
    }

    static String gen(Random r, int depth) {
        if (depth == 0 || r.nextInt(4) == 0) return String.valueOf(r.nextInt(20));
        String left = gen(r, depth - 1), right = gen(r, depth - 1);
        String op = "+-*".substring(r.nextInt(3)).substring(0, 1);
        String e = left + " " + op + " " + right;
        return r.nextInt(3) == 0 ? "( " + e + " )" : e;
    }
`;

const INFIX = [
  {
    name: 'evaluate',
    sig: 'public static long evaluate(String expr)',
    doc: 'expr is an infix expression whose tokens are separated by single spaces, e.g. "3 + 4 * ( 2 - 1 )".\nOperands are non-negative integers; operators are + - * with the usual precedence (* before + and -,\nleft to right for equal precedence); parentheses may appear. Return its value.',
    examples: [['evaluate("3 + 4 * 2")', '11'], ['evaluate("( 3 + 4 ) * 2")', '14'], ['evaluate("10 - 4 - 3")', '3']],
    body: J`        Deque<Long> values = new ArrayDeque<>();
        Deque<String> ops = new ArrayDeque<>();
        for (String t : expr.split(" ")) {
            if (t.equals("(")) {
                ops.push(t);
            } else if (t.equals(")")) {
                while (!ops.peek().equals("(")) apply(values, ops.pop());
                ops.pop();
            } else if (t.equals("+") || t.equals("-") || t.equals("*")) {
                while (!ops.isEmpty() && !ops.peek().equals("(") && prec(ops.peek()) >= prec(t)) apply(values, ops.pop());
                ops.push(t);
            } else {
                values.push(Long.parseLong(t));
            }
        }
        while (!ops.isEmpty()) apply(values, ops.pop());
        return values.pop();
    }

    private static int prec(String op) {
        return op.equals("*") ? 2 : 1;
    }

    private static void apply(Deque<Long> values, String op) {
        long b = values.pop(), a = values.pop();
        values.push(op.equals("+") ? a + b : op.equals("-") ? a - b : a * b);`,
    test: J`            final long expected = refEval(e);
            test("evaluate(\"" + e + "\")", () -> eq("evaluate(\"" + e + "\")", expected, Solution.evaluate(e)));`,
  },
  {
    name: 'toPostfix',
    sig: 'public static ArrayList<String> toPostfix(String expr)',
    doc: 'Converts a space-separated infix expression (non-negative integers, + - *, parentheses) to postfix\nusing the shunting-yard algorithm. * binds tighter than + and -, and equal precedence groups left to right.',
    examples: [['toPostfix("3 + 4 * 2")', '[3, 4, 2, *, +]'], ['toPostfix("( 3 + 4 ) * 2")', '[3, 4, +, 2, *]']],
    body: J`        ArrayList<String> out = new ArrayList<>();
        Deque<String> ops = new ArrayDeque<>();
        for (String t : expr.split(" ")) {
            if (t.equals("(")) {
                ops.push(t);
            } else if (t.equals(")")) {
                while (!ops.peek().equals("(")) out.add(ops.pop());
                ops.pop();
            } else if (t.equals("+") || t.equals("-") || t.equals("*")) {
                while (!ops.isEmpty() && !ops.peek().equals("(") && prec(ops.peek()) >= prec(t)) out.add(ops.pop());
                ops.push(t);
            } else {
                out.add(t);
            }
        }
        while (!ops.isEmpty()) out.add(ops.pop());
        return out;
    }

    private static int prec(String op) {
        return op.equals("*") ? 2 : 1;`,
    test: J`            final List<String> expected = refPostfix(e);
            test("toPostfix(\"" + e + "\")", () -> eq("toPostfix(\"" + e + "\")", expected, Solution.toPostfix(e)));`,
  },
];

const infix = {
  id: 'java-infix',
  topic: 'java',
  level: 4,
  title: 'Infix with precedence',
  skill: 'Two stacks, shunting-yard',
  variants: INFIX.length,
  generate(rng, seed, vi) {
    const v = choose(rng, INFIX, vi);
    const tests = J`        String[] fixed = {"3 + 4 * 2", "( 3 + 4 ) * 2", "10 - 4 - 3", "7", "2 * 3 * 4 - 5", "( 1 + 2 ) * ( 3 + 4 ) - 5 * 2"};
        List<String> cases = new ArrayList<>(Arrays.asList(fixed));
        for (int i = 0; i < 8; i++) cases.add(gen(rnd, 4));
        for (String c : cases) {
            final String e = c;
${v.test}
        }`;
    return {
      title: `Infix with precedence: ${v.name}`,
      story: 'Calculators read normal math like <code>3 + 4 * 2</code>, with no extra parentheses, and must still multiply first. Dijkstra’s two-stack idea (the “shunting-yard” algorithm) does it in one left-to-right pass.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: INFIX_HELPERS }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: [
        'Keep a stack of operators (and, for evaluate, a stack of values). Numbers go straight to the output or value stack.',
        'Before pushing an operator, first pop every operator on top of the stack that has <b>greater or equal</b> precedence (stop at a "("). That gives left-to-right order and * before + -.',
        '"(" is pushed. ")" pops operators until the matching "(" and discards it. At the end, pop everything that is left.',
      ],
      approach: ['Trace "3 + 4 * 2" and "3 * 4 + 2" by hand, writing both stacks after each token.', 'Write the precedence helper first.', 'Handle parentheses last, once plain expressions work.'],
    };
  },
};

/* ------------------------------------------------------------------ L4: advanced trees */

const TREE_ADV = [
  {
    name: 'buildTree',
    sig: 'public static TreeNode buildTree(int[] preorder, int[] inorder)',
    doc: 'The arrays are the preorder and inorder traversals of a binary tree with DISTINCT values.\nRebuild and return that tree.',
    examples: [['buildTree({3,9,20,15,7}, {9,3,15,20,7})', '[3, 9, 20, null, null, 15, 7]']],
    body: J`        HashMap<Integer, Integer> where = new HashMap<>();
        for (int i = 0; i < inorder.length; i++) where.put(inorder[i], i);
        return build(preorder, new int[] {0}, 0, inorder.length - 1, where);
    }

    private static TreeNode build(int[] pre, int[] next, int lo, int hi, HashMap<Integer, Integer> where) {
        if (lo > hi) return null;
        TreeNode root = new TreeNode(pre[next[0]++]);
        int mid = where.get(root.val);
        root.left = build(pre, next, lo, mid - 1, where);
        root.right = build(pre, next, mid + 1, hi, where);
        return root;`,
    tests: J`        for (int t = 0; t < 10; t++) {
            int n = t == 0 ? 0 : 1 + rnd.nextInt(14);
            int[] vals = distinct(rnd, n, 100);
            TreeNode tree = shapeWith(rnd, vals);
            List<Integer> pre = new ArrayList<>(), in = new ArrayList<>();
            preList(tree, pre); inList(tree, in);
            final int[] p = pre.stream().mapToInt(Integer::intValue).toArray();
            final int[] q = in.stream().mapToInt(Integer::intValue).toArray();
            final String expected = ser(tree);
            test("buildTree(" + Arrays.toString(p) + ", " + Arrays.toString(q) + ")", () -> eq("rebuilt tree (level order)", expected, ser(Solution.buildTree(p.clone(), q.clone()))));
        }`,
    hints: ['The FIRST value of preorder is the root.', 'Find the root in inorder: everything to its left is the left subtree, everything to its right is the right subtree.', 'Recurse with index ranges instead of copying arrays, and use a HashMap from value to inorder index so each lookup is O(1). Consume preorder left to right with a shared counter.'],
  },
  {
    name: 'serialize',
    sig: 'public static String serialize(TreeNode root)',
    doc: 'Encodes the tree as its PREORDER values separated by commas, writing "#" for every null child.\nAlso implement deserialize(String) that turns such a string back into the tree.\nExample: the tree [1, 2, 3] becomes "1,2,#,#,3,#,#". The empty tree is "#".',
    extra: J`    /** Rebuilds the tree written by serialize. */
    public static TreeNode deserialize(String data) {
        // TODO: write your code here
        return null;
    }`,
    examples: [['serialize([1, 2, 3])', '"1,2,#,#,3,#,#"'], ['deserialize("5,#,8,#,#")', '[5, null, 8]']],
    body: J`        StringBuilder sb = new StringBuilder();
        write(root, sb);
        return sb.toString();
    }

    private static void write(TreeNode x, StringBuilder sb) {
        if (sb.length() > 0) sb.append(',');
        if (x == null) {
            sb.append('#');
            return;
        }
        sb.append(x.val);
        write(x.left, sb);
        write(x.right, sb);
    }

    public static TreeNode deserialize(String data) {
        String[] parts = data.split(",");
        return read(parts, new int[] {0});
    }

    private static TreeNode read(String[] parts, int[] pos) {
        String t = parts[pos[0]++];
        if (t.equals("#")) return null;
        TreeNode x = new TreeNode(Integer.parseInt(t));
        x.left = read(parts, pos);
        x.right = read(parts, pos);
        return x;`,
    tests: J`        for (int t = 0; t < 10; t++) {
            final TreeNode tree = randomTree(rnd, t == 0 ? 0 : 1 + rnd.nextInt(12), 200);
            if (tree != null && rnd.nextBoolean()) tree.val = -tree.val - 1;
            final String expectedText = refSer(tree);
            final String shape = ser(tree);
            test("serialize(" + shape + ")", () -> eq("serialize", expectedText, Solution.serialize(copy(tree))));
            test("deserialize(\"" + expectedText + "\")", () -> eq("deserialized tree (level order)", shape, ser(Solution.deserialize(expectedText))));
        }`,
    hints: ['serialize is a preorder traversal that also writes "#" whenever it reaches null.', 'deserialize reads the tokens in the same order: a "#" means null; a number makes a node whose left subtree is read next, then its right subtree.', 'Share one position counter across the recursive calls (an int[1] works). Values can be negative, so use Integer.parseInt.'],
  },
  {
    name: 'maxPathSum',
    sig: 'public static int maxPathSum(TreeNode root)',
    doc: 'A path is any sequence of nodes connected by parent-child links, each node used at most once;\nit does not need to pass through the root. Return the largest sum of values on any NON-EMPTY path.\nValues may be negative. The tree is not empty.',
    examples: [['maxPathSum([1, 2, 3])', '6  (2 → 1 → 3)'], ['maxPathSum([-10, 9, 20, null, null, 15, 7])', '42  (15 → 20 → 7)']],
    body: J`        int[] best = {Integer.MIN_VALUE};
        gain(root, best);
        return best[0];
    }

    /** Best sum of a path that starts at x and goes down; updates best with paths that bend at x. */
    private static int gain(TreeNode x, int[] best) {
        if (x == null) return 0;
        int left = Math.max(0, gain(x.left, best));
        int right = Math.max(0, gain(x.right, best));
        best[0] = Math.max(best[0], x.val + left + right);
        return x.val + Math.max(left, right);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final TreeNode tree = randomTree(rnd, 1 + rnd.nextInt(12), 40);
            negate(tree, rnd);
            final int expected = refMax(tree);
            test("maxPathSum(" + ser(tree) + ")", () -> eq("maxPathSum", expected, Solution.maxPathSum(copy(tree))));
        }`,
    hints: ['Think about the single highest node of the best path: the path comes up from at most one child on the left and at most one child on the right.', 'Write a helper returning the best DOWNWARD path starting at a node; while computing it, also try “left + node + right” as a candidate answer.', 'A negative child path never helps: use max(0, childGain).'],
  },
];

const TREE_ADV_HELPERS = J`
    static TreeNode shapeWith(Random r, int[] vals) {
        TreeNode t = randomTree(r, vals.length, 1);
        int[] i = {0};
        relabel(t, vals, i);
        return t;
    }
    static void relabel(TreeNode x, int[] vals, int[] i) { if (x == null) return; x.val = vals[i[0]++]; relabel(x.left, vals, i); relabel(x.right, vals, i); }
    static void preList(TreeNode x, List<Integer> out) { if (x == null) return; out.add(x.val); preList(x.left, out); preList(x.right, out); }
    static void inList(TreeNode x, List<Integer> out) { if (x == null) return; inList(x.left, out); out.add(x.val); inList(x.right, out); }
    static String refSer(TreeNode x) { StringBuilder sb = new StringBuilder(); refWrite(x, sb); return sb.toString(); }
    static void refWrite(TreeNode x, StringBuilder sb) { if (sb.length() > 0) sb.append(','); if (x == null) { sb.append('#'); return; } sb.append(x.val); refWrite(x.left, sb); refWrite(x.right, sb); }
    static void negate(TreeNode x, Random r) { if (x == null) return; if (r.nextInt(3) == 0) x.val = -x.val; negate(x.left, r); negate(x.right, r); }
    static int bestDown(TreeNode x, int[] best) {
        if (x == null) return 0;
        int l = Math.max(0, bestDown(x.left, best)), r = Math.max(0, bestDown(x.right, best));
        best[0] = Math.max(best[0], x.val + l + r);
        return x.val + Math.max(l, r);
    }
    static int refMax(TreeNode x) { int[] b = {Integer.MIN_VALUE}; bestDown(x, b); return b[0]; }
`;

const treeAdvanced = {
  id: 'trees-advanced',
  topic: 'trees',
  level: 4,
  title: 'Advanced tree recursion',
  skill: 'Rebuild, encode, global answers',
  variants: TREE_ADV.length,
  generate(rng, seed, vi) {
    const v = choose(rng, TREE_ADV, vi);
    const starter = stub(v.sig, v.doc) + (v.extra ? `\n\n${v.extra}` : '');
    return {
      title: `Advanced trees: ${v.name}`,
      story: 'These are classic interview problems. Each one needs a recursive helper that carries extra information (an index range, a shared position, or a best-so-far answer) besides the node.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>${v.extra ? ' and <code>deserialize(String data)</code>' : ''}. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(starter) },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: v.tests, helpers: TREE_HELPERS + TREE_ADV_HELPERS }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Solve a 3-node example by hand and write down what each recursive call must know.', 'Decide what the helper returns versus what it records in a shared variable.', 'Test the smallest cases first: empty and single-node trees.'],
    };
  },
};

/* ------------------------------------------------------------------ L4: balanced rebuild */

const REBUILD = [
  {
    name: 'balance',
    sig: 'public static TreeNode balance(TreeNode root)',
    doc: 'root is a valid BST (possibly very unbalanced) with distinct values. Return a perfectly balanced BST\nwith the same values: for a sorted range a[lo..hi], the root is a[(lo + hi) / 2] (integer division),\nbuilt recursively from the left and right halves.',
    examples: [['balance(stick 1 → 2 → 3 → 4 → 5)', '[3, 1, 4, null, 2, null, 5]']],
    body: J`        ArrayList<Integer> sorted = new ArrayList<>();
        collect(root, sorted);
        return build(sorted, 0, sorted.size() - 1);
    }

    private static void collect(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        collect(x.left, out);
        out.add(x.val);
        collect(x.right, out);
    }

    private static TreeNode build(ArrayList<Integer> a, int lo, int hi) {
        if (lo > hi) return null;
        int mid = (lo + hi) / 2;
        TreeNode x = new TreeNode(a.get(mid));
        x.left = build(a, lo, mid - 1);
        x.right = build(a, mid + 1, hi);
        return x;`,
    tests: J`        for (int t = 0; t < 10; t++) {
            int[] ks = distinct(rnd, t == 0 ? 0 : 1 + rnd.nextInt(15), 100);
            if (t == 1) { ks = new int[] {1, 2, 3, 4, 5, 6, 7, 8}; }
            final TreeNode root = bstFrom(ks);
            int[] sorted = ks.clone(); Arrays.sort(sorted);
            final String expected = ser(refBuild(sorted, 0, sorted.length - 1));
            test("balance(BST from inserting " + Arrays.toString(ks) + ")", () -> eq("balanced tree (level order)", expected, ser(Solution.balance(copy(root)))));
        }`,
    hints: ['Step 1: an inorder traversal gives the values in sorted order.', 'Step 2: the middle value becomes the root, the left half builds the left subtree, the right half builds the right subtree.', 'Use index ranges (lo, hi) so you do not copy lists; stop when lo &gt; hi.'],
  },
  {
    name: 'isHeightBalanced',
    sig: 'public static boolean isHeightBalanced(TreeNode root)',
    doc: 'Returns true if, at EVERY node, the heights of the left and right subtrees differ by at most 1\n(the AVL condition). Do it in one pass: O(n), not O(n^2).',
    examples: [['isHeightBalanced([3, 9, 20, null, null, 15, 7])', 'true'], ['isHeightBalanced([1, 2, null, 3])', 'false']],
    body: J`        return check(root) >= 0;
    }

    /** Height of x, or -2 if any subtree below is unbalanced. */
    private static int check(TreeNode x) {
        if (x == null) return -1;
        int l = check(x.left);
        if (l == -2) return -2;
        int r = check(x.right);
        if (r == -2) return -2;
        if (Math.abs(l - r) > 1) return -2;
        return 1 + Math.max(l, r);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            int[] range = sortedRange(1 + rnd.nextInt(15));
            final TreeNode root = t % 3 == 0 ? refBuild(range, 0, range.length - 1) : randomTree(rnd, rnd.nextInt(10), 9);
            final boolean expected = refHeight(root) != -2;
            test("isHeightBalanced(" + ser(root) + ")", () -> eq("isHeightBalanced", expected, Solution.isHeightBalanced(copy(root))));
        }
        test("isHeightBalanced on a 3000-node stick (must not be slow)", () -> {
            TreeNode stick = null;
            for (int i = 0; i < 3000; i++) stick = new TreeNode(i, stick, null);
            eq("isHeightBalanced(stick)", false, Solution.isHeightBalanced(stick));
        });`,
    hints: ['A helper that returns the height can ALSO report “unbalanced” using a special value such as −2.', 'Compute both child heights first; if either is unbalanced, or they differ by more than 1, pass the special value up.', 'This visits each node once, so it is O(n).'],
  },
];

const REBUILD_HELPERS = J`
    static TreeNode refBuild(int[] a, int lo, int hi) {
        if (lo > hi) return null;
        int mid = (lo + hi) / 2;
        return new TreeNode(a[mid], refBuild(a, lo, mid - 1), refBuild(a, mid + 1, hi));
    }
    static int[] sortedRange(int n) { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = i * 3; return a; }
    static int refHeight(TreeNode x) {
        if (x == null) return -1;
        int l = refHeight(x.left), r = refHeight(x.right);
        if (l == -2 || r == -2 || Math.abs(l - r) > 1) return -2;
        return 1 + Math.max(l, r);
    }
`;

const rebuild = {
  id: 'bst-rebuild',
  topic: 'bst',
  level: 4,
  title: 'Balance a BST',
  skill: 'Divide and conquer on sorted data',
  variants: REBUILD.length,
  generate(rng, seed, vi) {
    const v = choose(rng, REBUILD, vi);
    return {
      title: `Balance: ${v.name}`,
      story: 'Red-black trees stay balanced automatically. Here you work out balance yourself: rebuild a lopsided tree from scratch, or check the AVL balance rule efficiently.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: v.tests, helpers: TREE_HELPERS + REBUILD_HELPERS }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Work through a 5-node example on paper.', 'Ask what each recursive call should return so that its parent can finish the job.', 'Think about the running time on a 3000-node stick.'],
    };
  },
};

/* ------------------------------------------------------------------ L4: grid BFS */

const GRID = [
  {
    name: 'shortestPath',
    sig: 'public static int shortestPath(String[] grid)',
    doc: 'grid is a maze of equal-length rows: "S" start, "E" exit, "#" wall, "." open floor (S and E are open).\nYou move up, down, left or right one cell per step. Return the fewest steps from S to E, or -1 if\nthe exit cannot be reached.',
    examples: [['shortestPath({"S.#", "..#", "#.E"})', '4'], ['shortestPath({"S#E"})', '-1']],
    body: J`        int rows = grid.length, cols = grid[0].length();
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, -1);
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r].charAt(c) == 'S') { dist[r][c] = 0; queue.add(new int[] {r, c}); }
        int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.remove();
            int r = cell[0], c = cell[1];
            if (grid[r].charAt(c) == 'E') return dist[r][c];
            for (int[] m : moves) {
                int nr = r + m[0], nc = c + m[1];
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                if (grid[nr].charAt(nc) == '#' || dist[nr][nc] != -1) continue;
                dist[nr][nc] = dist[r][c] + 1;
                queue.add(new int[] {nr, nc});
            }
        }
        return -1;`,
    expected: 'refShortest(g)',
    hints: ['Every cell is a vertex; neighbours are the up to 4 open cells around it. Fewest steps means BFS.', 'Keep a dist[][] array filled with −1 for “not visited”. Set the distance when you ADD a cell to the queue.', 'Return the distance when you take E out of the queue (or when you add it). If the queue empties first, return −1.'],
  },
  {
    name: 'countRooms',
    sig: 'public static int countRooms(String[] grid)',
    doc: 'grid has "#" walls and "." floor. A room is a group of floor cells connected up/down/left/right.\nReturn the number of rooms.',
    examples: [['countRooms({"..#..", "..#..", "#####", "....."})', '3']],
    body: J`        int rows = grid.length, cols = grid[0].length();
        boolean[][] seen = new boolean[rows][cols];
        int rooms = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) == '.' && !seen[r][c]) {
                    rooms++;
                    fill(grid, seen, r, c);
                }
            }
        }
        return rooms;
    }

    private static void fill(String[] grid, boolean[][] seen, int r0, int c0) {
        ArrayDeque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[] {r0, c0});
        seen[r0][c0] = true;
        while (!stack.isEmpty()) {
            int[] cell = stack.pop();
            int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
            for (int[] m : moves) {
                int r = cell[0] + m[0], c = cell[1] + m[1];
                if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length()) continue;
                if (grid[r].charAt(c) != '.' || seen[r][c]) continue;
                seen[r][c] = true;
                stack.push(new int[] {r, c});
            }
        }`,
    expected: 'refRooms(g)',
    hints: ['This is “count connected components”, where cells are vertices.', 'Scan every cell. An unvisited floor cell starts a new room: count it, then mark its whole room with DFS or BFS (a flood fill).', 'On big grids, a recursive flood fill can overflow the stack. An explicit stack or queue is safer.'],
  },
];

const GRID_HELPERS = J`
    static String[] makeGrid(Random r, int rows, int cols, boolean withEnds) {
        char[][] g = new char[rows][cols];
        for (int i = 0; i < rows; i++) for (int j = 0; j < cols; j++) g[i][j] = r.nextInt(100) < 30 ? '#' : '.';
        if (withEnds) {
            g[r.nextInt(rows)][r.nextInt(cols)] = 'S';
            int er, ec;
            do { er = r.nextInt(rows); ec = r.nextInt(cols); } while (g[er][ec] == 'S');
            g[er][ec] = 'E';
        }
        String[] out = new String[rows];
        for (int i = 0; i < rows; i++) out[i] = new String(g[i]);
        return out;
    }
    static int refShortest(String[] g) {
        int R = g.length, C = g[0].length();
        int[][] d = new int[R][C];
        for (int[] row : d) Arrays.fill(row, -1);
        Deque<int[]> q = new ArrayDeque<>();
        for (int i = 0; i < R; i++) for (int j = 0; j < C; j++) if (g[i].charAt(j) == 'S') { d[i][j] = 0; q.add(new int[] {i, j}); }
        int[][] mv = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.isEmpty()) {
            int[] c = q.poll();
            if (g[c[0]].charAt(c[1]) == 'E') return d[c[0]][c[1]];
            for (int[] m : mv) {
                int a = c[0] + m[0], b = c[1] + m[1];
                if (a < 0 || b < 0 || a >= R || b >= C || g[a].charAt(b) == '#' || d[a][b] != -1) continue;
                d[a][b] = d[c[0]][c[1]] + 1;
                q.add(new int[] {a, b});
            }
        }
        return -1;
    }
    static int refRooms(String[] g) {
        int R = g.length, C = g[0].length(), n = 0;
        boolean[][] s = new boolean[R][C];
        for (int i = 0; i < R; i++) for (int j = 0; j < C; j++) {
            if (g[i].charAt(j) != '.' || s[i][j]) continue;
            n++;
            Deque<int[]> st = new ArrayDeque<>();
            st.push(new int[] {i, j}); s[i][j] = true;
            while (!st.isEmpty()) {
                int[] c = st.pop();
                int[][] mv = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
                for (int[] m : mv) {
                    int a = c[0] + m[0], b = c[1] + m[1];
                    if (a < 0 || b < 0 || a >= R || b >= C || g[a].charAt(b) != '.' || s[a][b]) continue;
                    s[a][b] = true; st.push(new int[] {a, b});
                }
            }
        }
        return n;
    }
`;

const grid = {
  id: 'graph-grid',
  topic: 'graphs',
  level: 4,
  title: 'Graphs hidden in grids',
  skill: 'Implicit graphs, BFS, flood fill',
  variants: GRID.length,
  generate(rng, seed, vi) {
    const v = choose(rng, GRID, vi);
    const ends = v.name === 'shortestPath';
    const tests = J`        for (int t = 0; t < 10; t++) {
            final String[] g = makeGrid(rnd, 1 + rnd.nextInt(7), 1 + rnd.nextInt(9), ${ends ? 'true' : 'false'});
            final int expected = ${v.expected};
            test("${v.name}(" + show(g) + ")", () -> eq("${v.name}", expected, Solution.${v.name}(g.clone())));
        }
        test("${v.name} on a 300 x 300 grid (needs to be efficient, no deep recursion)", () -> {
            Random big = new Random(${String(seed)}L);
            String[] g = makeGrid(big, 300, 300, ${ends ? 'true' : 'false'});
            eq("${v.name}(300 x 300)", ${v.expected}, Solution.${v.name}(g));
        });`;
    return {
      title: `Grid graph: ${v.name}`,
      story: 'Many graphs are never written as edge lists. A maze, a game map, or an image is a graph in disguise: every cell is a vertex, and its neighbours are the cells next to it.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass(stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: GRID_HELPERS }),
      solution: solutionClass(`    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Draw a 3×3 grid and write each cell’s neighbours.', 'Pick the search: BFS for fewest steps, any search for “which cells are connected”.', 'Keep a visited/dist array the same size as the grid.'],
    };
  },
};

/* ------------------------------------------------------------------ L4/L5: linear probing */

const LP_HEAD = J`import java.util.*;

public class LinearProbingHashST<Key, Value> {
    int n;          // number of key-value pairs
    int m;          // size of the arrays
    Key[] keys;
    Value[] vals;

    @SuppressWarnings("unchecked")
    public LinearProbingHashST(int capacity) {
        m = capacity;
        keys = (Key[]) new Object[m];
        vals = (Value[]) new Object[m];
    }

    public int size() {
        return n;
    }

    int hash(Key key) {
        return (key.hashCode() & 0x7fffffff) % m;
    }

    void resize(int capacity) {
        LinearProbingHashST<Key, Value> temp = new LinearProbingHashST<>(capacity);
        for (int i = 0; i < m; i++) {
            if (keys[i] != null) temp.put(keys[i], vals[i]);
        }
        keys = temp.keys;
        vals = temp.vals;
        m = temp.m;
    }
`;

const LP = {
  put: J`    public void put(Key key, Value val) {
        if (n >= m / 2) resize(2 * m);
        int i;
        for (i = hash(key); keys[i] != null; i = (i + 1) % m) {
            if (keys[i].equals(key)) {
                vals[i] = val;
                return;
            }
        }
        keys[i] = key;
        vals[i] = val;
        n++;
    }`,
  get: J`    public Value get(Key key) {
        for (int i = hash(key); keys[i] != null; i = (i + 1) % m) {
            if (keys[i].equals(key)) return vals[i];
        }
        return null;
    }`,
  delete: J`    public void delete(Key key) {
        if (get(key) == null) return;
        int i = hash(key);
        while (!key.equals(keys[i])) i = (i + 1) % m;
        keys[i] = null;
        vals[i] = null;
        i = (i + 1) % m;
        while (keys[i] != null) {
            Key keyToRedo = keys[i];
            Value valToRedo = vals[i];
            keys[i] = null;
            vals[i] = null;
            n--;
            put(keyToRedo, valToRedo);
            i = (i + 1) % m;
        }
        n--;
        if (n > 0 && n <= m / 8) resize(m / 2);
    }`,
};

const LP_STUB = {
  put: J`    /**
     * Linear probing put. FIRST, if n >= m / 2, call resize(2 * m). Then start at hash(key) and move
     * right (wrapping around with % m) until you find the key (replace its value) or an empty slot
     * (store the key and value there and increase n).
     */
    public void put(Key key, Value val) {
        // TODO
    }`,
  get: J`    /** Probes from hash(key) until it finds the key (return its value) or an empty slot (return null). */
    public Value get(Key key) {
        // TODO
        return null;
    }`,
  delete: J`    /**
     * Removes key if present. Clearing the slot would break later searches in the same cluster, so
     * after removing it, take every following key of the cluster out and put it back in (n must stay
     * correct). Finally, if n > 0 and n <= m / 8, call resize(m / 2).
     */
    public void delete(Key key) {
        // TODO
    }`,
};

const LP_HELPERS = J`
    static class RefLP {
        int n, m;
        Object[] keys;
        RefLP(int cap) { m = cap; keys = new Object[m]; }
        int hash(Object k) { return (k.hashCode() & 0x7fffffff) % m; }
        void resize(int cap) { RefLP t = new RefLP(cap); for (Object k : keys) if (k != null) t.put(k); keys = t.keys; m = t.m; }
        void put(Object k) {
            if (n >= m / 2) resize(2 * m);
            int i;
            for (i = hash(k); keys[i] != null; i = (i + 1) % m) if (keys[i].equals(k)) return;
            keys[i] = k; n++;
        }
        boolean has(Object k) { for (int i = hash(k); keys[i] != null; i = (i + 1) % m) if (keys[i].equals(k)) return true; return false; }
        void delete(Object k) {
            if (!has(k)) return;
            int i = hash(k);
            while (!k.equals(keys[i])) i = (i + 1) % m;
            keys[i] = null;
            i = (i + 1) % m;
            while (keys[i] != null) { Object redo = keys[i]; keys[i] = null; n--; put(redo); i = (i + 1) % m; }
            n--;
            if (n > 0 && n <= m / 8) resize(m / 2);
        }
    }
    static String word(Random r) { StringBuilder sb = new StringBuilder(); int len = 1 + r.nextInt(3); for (int i = 0; i < len; i++) sb.append((char) ('a' + r.nextInt(6))); return sb.toString(); }
`;

function probingTemplate(level) {
  const withDelete = level === 5;
  return {
    id: withDelete ? 'hash-probing-delete' : 'hash-probing',
    topic: 'hash',
    level,
    title: withDelete ? 'Linear probing: deletion' : 'Linear probing table',
    skill: withDelete ? 'Cluster repair, shrinking' : 'Open addressing, resizing at half full',
    variants: 1,
    generate(rng, seed) {
      const parts = withDelete ? [LP.put, LP.get, LP_STUB.delete] : [LP_STUB.put, LP_STUB.get];
      const solParts = withDelete ? [LP.put, LP.get, LP.delete] : [LP.put, LP.get];
      const cls = (p) => `${LP_HEAD}\n${p.join('\n\n')}\n}\n`;
      const tests = J`        for (int t = 0; t < 8; t++) {
            final int cap = 1 + rnd.nextInt(6);
            final boolean ints = rnd.nextBoolean();
            final List<Object[]> ops = new ArrayList<>();
            int n = t == 0 ? 0 : 1 + rnd.nextInt(t < 3 ? 8 : 60);
            List<Object> present = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                boolean del = ${withDelete ? 'rnd.nextInt(3) == 0 && i > 2' : 'false'};
                Object k = del && !present.isEmpty() && rnd.nextInt(4) > 0 ? present.get(rnd.nextInt(present.size())) : (ints ? (Object) (rnd.nextInt(300) - 100) : (Object) word(rnd));
                ops.add(new Object[] {del ? "del" : "put", k});
                if (!del && !present.contains(k)) present.add(k);
                if (del) present.remove(k);
            }
            StringBuilder label = new StringBuilder("capacity " + cap + ":");
            for (int i = 0; i < Math.min(ops.size(), 14); i++) label.append(" ").append(ops.get(i)[0]).append("(").append(show(ops.get(i)[1])).append(")");
            if (ops.size() > 14) label.append(" ... (" + ops.size() + " operations)");
            test(label.toString(), () -> {
                LinearProbingHashST<Object, Integer> st = new LinearProbingHashST<>(cap);
                RefLP ref = new RefLP(cap);
                Map<Object, Integer> vals = new HashMap<>();
                int step = 0;
                for (Object[] op : ops) {
                    if (op[0].equals("put")) { st.put(op[1], step); ref.put(op[1]); vals.put(op[1], step); }
                    else { ${withDelete ? 'st.delete(op[1]); ref.delete(op[1]); vals.remove(op[1]);' : ''} }
                    step++;
                }
                eq("m (array size)", ref.m, st.m);
                eq("size()", ref.n, st.size());
                eq("keys[] slot by slot", Arrays.asList(ref.keys), Arrays.asList(st.keys));
                for (Map.Entry<Object, Integer> e : vals.entrySet()) eq("get(" + show(e.getKey()) + ")", e.getValue(), st.get(e.getKey()));
                eq("get(missing)", null, st.get(ints ? (Object) 77777 : (Object) "zzzz"));
            });
        }`;
      return {
        title: withDelete ? 'Linear probing: delete' : 'Linear probing: put & get',
        story: withDelete
          ? 'Deleting from a linear-probing table is the classic trap. If you just empty a slot, every key that had probed past it becomes unreachable. The fix: re-insert the rest of the cluster.'
          : 'Instead of chains, <b>linear probing</b> stores keys directly in an array. On a collision, it tries the next slot, then the next… Keeping the array at most half full keeps those runs (clusters) short.',
        task: withDelete
          ? 'Implement <code>delete(Key key)</code> in <code>LinearProbingHashST.java</code> (put, get, hash and resize are provided). Every key must end up in exactly the slot the reference implementation uses.'
          : 'Implement <code>put</code> and <code>get</code> in <code>LinearProbingHashST.java</code>. Resize to <code>2 * m</code> at the START of put whenever <code>n &gt;= m / 2</code>. The tests check the exact slot of every key.',
        examples: withDelete
          ? [['m = 8 with keys in slots 3, 4, 5 (one cluster); delete the key in slot 3', 'the keys in 4 and 5 are re-inserted, so they may move to slot 3']]
          : [['new table(4), then put 3 keys', 'before the 3rd put, n = 2 >= 4 / 2, so the arrays double to m = 8 first'], ['two keys with the same hash', 'the second goes into the next free slot to the right'], ['get(missing key)', 'null']],
        file: { name: 'LinearProbingHashST.java', code: cls(parts) },
        provided: [],
        harness: harness({ seed, body: tests, helpers: LP_HELPERS }),
        solution: cls(solParts),
        hints: withDelete
          ? ['If the key is not there, return. Otherwise find its slot i and set keys[i] and vals[i] to null.', 'Walk forward from i + 1 while slots are non-empty: remove each key/value (n--), then put it again, because put will place it correctly now.', 'After the loop, n-- for the deleted key, then shrink with resize(m / 2) if n &gt; 0 and n &lt;= m / 8.']
          : ['Probe loop: <code>for (i = hash(key); keys[i] != null; i = (i + 1) % m)</code>.', 'Inside put’s loop, an equal key means: replace the value and return. After the loop, slot i is empty: store the key there and n++.', 'Do the resize check before anything else in put. get uses the same loop and returns null when it hits an empty slot.'],
        approach: ['Draw an array of 8 slots and insert 4 keys that collide.', 'Notice that a search stops at the first EMPTY slot. That is what makes deletion tricky.', 'Match the exact resize rules, because the tests compare slot by slot.'],
      };
    },
  };
}

/* ------------------------------------------------------------------ L5: LLRB deleteMin / deleteMax */

const LLRB5_HEAD = J`import java.util.*;

public class LLRB<Key extends Comparable<Key>, Value> {
    static final boolean RED = true;
    static final boolean BLACK = false;

    Node root;

    class Node {
        Key key;
        Value val;
        Node left, right;
        boolean color;
        int size;

        Node(Key key, Value val, boolean color, int size) {
            this.key = key;
            this.val = val;
            this.color = color;
            this.size = size;
        }
    }

    boolean isRed(Node x) {
        return x != null && x.color == RED;
    }

    int size(Node x) {
        return x == null ? 0 : x.size;
    }

    public int size() {
        return size(root);
    }

    public boolean isEmpty() {
        return root == null;
    }

    public void put(Key key, Value val) {
        root = put(root, key, val);
        root.color = BLACK;
    }

    private Node put(Node h, Key key, Value val) {
        if (h == null) return new Node(key, val, RED, 1);
        int cmp = key.compareTo(h.key);
        if (cmp < 0) h.left = put(h.left, key, val);
        else if (cmp > 0) h.right = put(h.right, key, val);
        else h.val = val;
        if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
        if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
        if (isRed(h.left) && isRed(h.right)) flipColors(h);
        h.size = 1 + size(h.left) + size(h.right);
        return h;
    }

    Node rotateLeft(Node h) {
        Node x = h.right;
        h.right = x.left;
        x.left = h;
        x.color = h.color;
        h.color = RED;
        x.size = h.size;
        h.size = 1 + size(h.left) + size(h.right);
        return x;
    }

    Node rotateRight(Node h) {
        Node x = h.left;
        h.left = x.right;
        x.right = h;
        x.color = h.color;
        h.color = RED;
        x.size = h.size;
        h.size = 1 + size(h.left) + size(h.right);
        return x;
    }

    /** Toggles the colors of h and both children (works for insertion AND deletion). */
    void flipColors(Node h) {
        h.color = !h.color;
        h.left.color = !h.left.color;
        h.right.color = !h.right.color;
    }

    /** Restores the LLRB rules on the way back up. */
    Node balance(Node h) {
        if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
        if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
        if (isRed(h.left) && isRed(h.right)) flipColors(h);
        h.size = 1 + size(h.left) + size(h.right);
        return h;
    }
`;

const DEL = {
  min: J`    public void deleteMin() {
        if (isEmpty()) return;
        if (!isRed(root.left) && !isRed(root.right)) root.color = RED;
        root = deleteMin(root);
        if (!isEmpty()) root.color = BLACK;
    }

    private Node deleteMin(Node h) {
        if (h.left == null) return null;
        if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h);
        h.left = deleteMin(h.left);
        return balance(h);
    }

    private Node moveRedLeft(Node h) {
        flipColors(h);
        if (isRed(h.right.left)) {
            h.right = rotateRight(h.right);
            h = rotateLeft(h);
            flipColors(h);
        }
        return h;
    }`,
  max: J`    public void deleteMax() {
        if (isEmpty()) return;
        if (!isRed(root.left) && !isRed(root.right)) root.color = RED;
        root = deleteMax(root);
        if (!isEmpty()) root.color = BLACK;
    }

    private Node deleteMax(Node h) {
        if (isRed(h.left)) h = rotateRight(h);
        if (h.right == null) return null;
        if (!isRed(h.right) && !isRed(h.right.left)) h = moveRedRight(h);
        h.right = deleteMax(h.right);
        return balance(h);
    }

    private Node moveRedRight(Node h) {
        flipColors(h);
        if (isRed(h.left.left)) {
            h = rotateRight(h);
            flipColors(h);
        }
        return h;
    }`,
  minStub: J`    /**
     * Removes the smallest key, keeping the tree a valid LLRB (Sedgewick's top-down approach).
     *  - Public method: if both children of the root are black, color the root RED first; after the
     *    recursive call, color the root BLACK again (if the tree is not empty).
     *  - Recursive deleteMin(h): if h.left is null, return null (h is the minimum). If h.left and
     *    h.left.left are both black, call moveRedLeft(h) first. Recurse left, then return balance(h).
     *  - moveRedLeft(h): flipColors(h); if h.right.left is red, rotate h.right right, rotate h left,
     *    and flipColors(h) again.
     */
    public void deleteMin() {
        // TODO
    }`,
  maxStub: J`    /**
     * Removes the largest key, keeping the tree a valid LLRB (Sedgewick's top-down approach).
     *  - Public method: if both children of the root are black, color the root RED first; after the
     *    recursive call, color the root BLACK again (if the tree is not empty).
     *  - Recursive deleteMax(h): if h.left is red, rotate h right. If h.right is null, return null.
     *    If h.right and h.right.left are both black, call moveRedRight(h). Recurse right, then
     *    return balance(h).
     *  - moveRedRight(h): flipColors(h); if h.left.left is red, rotate h right and flipColors(h).
     */
    public void deleteMax() {
        // TODO
    }`,
};

const LLRB5_HELPERS = J`
    static <K extends Comparable<K>, V> String shape(LLRB<K, V>.Node root) {
        List<String> out = new ArrayList<>();
        List<LLRB<K, V>.Node> level = new ArrayList<>();
        level.add(root);
        while (true) {
            List<LLRB<K, V>.Node> next = new ArrayList<>();
            boolean any = false;
            for (LLRB<K, V>.Node x : level) {
                out.add(x == null ? "null" : x.key + (x.color ? "(R)" : ""));
                if (x != null) { next.add(x.left); next.add(x.right); if (x.left != null || x.right != null) any = true; }
            }
            if (!any) break;
            level = next;
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(", ", out.subList(0, end)) + "]";
    }

    static class Ref {
        class N { int key; N left, right; boolean red = true; int size = 1; N(int k) { key = k; } }
        N root;
        boolean red(N x) { return x != null && x.red; }
        int size(N x) { return x == null ? 0 : x.size; }
        N rl(N h) { N x = h.right; h.right = x.left; x.left = h; x.red = h.red; h.red = true; x.size = h.size; h.size = 1 + size(h.left) + size(h.right); return x; }
        N rr(N h) { N x = h.left; h.left = x.right; x.right = h; x.red = h.red; h.red = true; x.size = h.size; h.size = 1 + size(h.left) + size(h.right); return x; }
        void flip(N h) { h.red = !h.red; h.left.red = !h.left.red; h.right.red = !h.right.red; }
        N bal(N h) { if (red(h.right) && !red(h.left)) h = rl(h); if (red(h.left) && red(h.left.left)) h = rr(h); if (red(h.left) && red(h.right)) flip(h); h.size = 1 + size(h.left) + size(h.right); return h; }
        void put(int k) { root = put(root, k); root.red = false; }
        N put(N h, int k) { if (h == null) return new N(k); if (k < h.key) h.left = put(h.left, k); else if (k > h.key) h.right = put(h.right, k); return bal(h); }
        void deleteMin() { if (root == null) return; if (!red(root.left) && !red(root.right)) root.red = true; root = dmin(root); if (root != null) root.red = false; }
        N dmin(N h) { if (h.left == null) return null; if (!red(h.left) && !red(h.left.left)) h = mrl(h); h.left = dmin(h.left); return bal(h); }
        N mrl(N h) { flip(h); if (red(h.right.left)) { h.right = rr(h.right); h = rl(h); flip(h); } return h; }
        void deleteMax() { if (root == null) return; if (!red(root.left) && !red(root.right)) root.red = true; root = dmax(root); if (root != null) root.red = false; }
        N dmax(N h) { if (red(h.left)) h = rr(h); if (h.right == null) return null; if (!red(h.right) && !red(h.right.left)) h = mrr(h); h.right = dmax(h.right); return bal(h); }
        N mrr(N h) { flip(h); if (red(h.left.left)) { h = rr(h); flip(h); } return h; }
        String shape() {
            List<String> out = new ArrayList<>();
            List<N> level = new ArrayList<>();
            level.add(root);
            while (true) {
                List<N> next = new ArrayList<>();
                boolean any = false;
                for (N x : level) {
                    out.add(x == null ? "null" : x.key + (x.red ? "(R)" : ""));
                    if (x != null) { next.add(x.left); next.add(x.right); if (x.left != null || x.right != null) any = true; }
                }
                if (!any) break;
                level = next;
            }
            int end = out.size();
            while (end > 0 && out.get(end - 1).equals("null")) end--;
            return "[" + String.join(", ", out.subList(0, end)) + "]";
        }
    }
`;

const LLRB5 = [
  { key: 'min', name: 'deleteMin', title: 'deleteMin' },
  { key: 'max', name: 'deleteMax', title: 'deleteMax' },
];

const llrbDelete = {
  id: 'llrb-delete',
  topic: 'llrb',
  level: 5,
  title: 'LLRB deletion',
  skill: 'moveRedLeft / moveRedRight',
  variants: LLRB5.length,
  generate(rng, seed, vi) {
    const v = choose(rng, LLRB5, vi);
    const cls = (part) => `${LLRB5_HEAD}\n${part}\n}\n`;
    const tests = J`        for (int t = 0; t < 8; t++) {
            final int[] ks = new int[t == 0 ? 1 : 2 + rnd.nextInt(28)];
            for (int i = 0; i < ks.length; i++) ks[i] = rnd.nextInt(100);
            final int times = 1 + rnd.nextInt(Math.max(1, ks.length));
            test("put " + Arrays.toString(ks) + ", then ${v.name}() x" + times, () -> {
                LLRB<Integer, String> tree = new LLRB<>();
                Ref ref = new Ref();
                for (int k : ks) { tree.put(k, "v"); ref.put(k); }
                for (int i = 0; i < times; i++) {
                    tree.${v.name}();
                    ref.${v.name}();
                    eq("tree after ${v.name}() #" + (i + 1) + " (R = red link)", ref.shape(), shape(tree.root));
                    eq("size() after ${v.name}() #" + (i + 1), ref.size(ref.root), tree.size());
                }
            });
        }`;
    return {
      title: `LLRB: ${v.title}`,
      story: 'Deletion is the hardest red-black operation. The trick is to walk down while making sure the node you are about to remove is never a lone 2-node: you borrow a red link from a sibling (move red left or right) on the way down, then clean up with balance() on the way back up.',
      task: `Implement <code>${v.name}()</code> in <code>LLRB.java</code>, including its private recursive helper and <code>${v.key === 'min' ? 'moveRedLeft' : 'moveRedRight'}</code>. Rotations, a color-<em>toggling</em> flipColors and <code>balance</code> are provided. The resulting tree must match the reference exactly after every deletion.`,
      examples: [[`put 1..7, then ${v.name}()`, v.key === 'min' ? '1 is removed; the tree stays perfectly black-balanced' : '7 is removed; the tree stays perfectly black-balanced']],
      file: { name: 'LLRB.java', code: cls(v.key === 'min' ? DEL.minStub : DEL.maxStub) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: LLRB5_HELPERS }),
      solution: cls(DEL[v.key]),
      hints: [
        'Follow the comment above the method exactly. It is Sedgewick’s algorithm, step by step.',
        v.key === 'min' ? 'The base case is when h.left is null: h is the minimum, and in an LLRB it has no right child either, so return null.' : 'Rotating a red left link to the right first makes sure the maximum can be removed from the right spine.',
        'Every recursive call ends with <code>return balance(h);</code>, which repairs any temporary right-leaning or 4-node links.',
      ],
      approach: ['Use the red-black lab to build a small tree and draw its 2-3 version.', 'Trace the algorithm by hand on a 7-key tree, one call at a time.', 'Implement the public method, then the recursive one, then the move-red helper.'],
    };
  },
};

/* ------------------------------------------------------------------ L5: strongly connected components */

const SCC = [
  {
    name: 'scc',
    sig: 'public static int[] scc(Digraph G)',
    doc: 'Returns id[] where id[v] numbers v\'s strongly connected component, using Kosaraju-Sharir:\n(1) compute the reverse postorder of G.reverse(), running DFS from vertices 0, 1, ..., V-1;\n(2) run DFS on G from the vertices in that order, skipping marked ones; each new DFS tree is the next\ncomponent, numbered 0, 1, 2, ... in the order found.',
    examples: [['{0->[1], 1->[2], 2->[0], 3->[2]}', '[1, 1, 1, 0]  (with this exact numbering rule)']],
    body: J`        Digraph R = G.reverse();
        boolean[] marked = new boolean[G.V()];
        ArrayList<Integer> post = new ArrayList<>();
        for (int v = 0; v < R.V(); v++) {
            if (!marked[v]) postorder(R, v, marked, post);
        }
        Collections.reverse(post);
        int[] id = new int[G.V()];
        marked = new boolean[G.V()];
        int count = 0;
        for (int v : post) {
            if (!marked[v]) {
                label(G, v, marked, id, count);
                count++;
            }
        }
        return id;
    }

    private static void postorder(Digraph G, int v, boolean[] marked, ArrayList<Integer> post) {
        marked[v] = true;
        for (int w : G.adj(v)) {
            if (!marked[w]) postorder(G, w, marked, post);
        }
        post.add(v);
    }

    private static void label(Digraph G, int v, boolean[] marked, int[] id, int count) {
        marked[v] = true;
        id[v] = count;
        for (int w : G.adj(v)) {
            if (!marked[w]) label(G, w, marked, id, count);
        }`,
    expected: 'refScc(g)',
    call: 'Solution.scc(g)',
  },
  {
    name: 'stronglyConnected',
    sig: 'public static boolean stronglyConnected(Digraph G, int v, int w)',
    doc: 'Returns true if v and w are strongly connected: there is a directed path from v to w AND one from w to v.\n(Any correct method is accepted; Kosaraju-Sharir answers it for every pair at once.)',
    examples: [['{0->[1], 1->[0, 2], 2->[]}, 0, 1', 'true'], ['same graph, 1, 2', 'false']],
    body: J`        return reaches(G, v, w) && reaches(G, w, v);
    }

    private static boolean reaches(Digraph G, int s, int t) {
        boolean[] marked = new boolean[G.V()];
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(s);
        marked[s] = true;
        while (!stack.isEmpty()) {
            int x = stack.pop();
            if (x == t) return true;
            for (int y : G.adj(x)) {
                if (!marked[y]) {
                    marked[y] = true;
                    stack.push(y);
                }
            }
        }
        return false;`,
    expected: 'refScc(g)[a] == refScc(g)[b]',
    call: 'Solution.stronglyConnected(g, a, b)',
  },
];

const SCC_HELPERS = J`
    static Digraph randomDigraph(Random r, int V, int edges) {
        Digraph g = new Digraph(V);
        Set<Long> seen = new HashSet<>();
        for (int i = 0; i < edges; i++) {
            int a = r.nextInt(V), b = r.nextInt(V);
            if (a != b && seen.add((long) a * 1000 + b)) g.addEdge(a, b);
        }
        return g;
    }
    static void post(Digraph g, int v, boolean[] m, List<Integer> out) { m[v] = true; for (int w : g.adj(v)) if (!m[w]) post(g, w, m, out); out.add(v); }
    static void lab(Digraph g, int v, boolean[] m, int[] id, int c) { m[v] = true; id[v] = c; for (int w : g.adj(v)) if (!m[w]) lab(g, w, m, id, c); }
    static int[] refScc(Digraph g) {
        Digraph r = g.reverse();
        boolean[] m = new boolean[g.V()];
        List<Integer> order = new ArrayList<>();
        for (int v = 0; v < g.V(); v++) if (!m[v]) post(r, v, m, order);
        Collections.reverse(order);
        int[] id = new int[g.V()];
        m = new boolean[g.V()];
        int c = 0;
        for (int v : order) if (!m[v]) lab(g, v, m, id, c++);
        return id;
    }
`;

const scc = {
  id: 'digraph-scc',
  topic: 'digraphs',
  level: 5,
  title: 'Strong components',
  skill: 'Kosaraju-Sharir',
  variants: SCC.length,
  generate(rng, seed, vi) {
    const v = choose(rng, SCC, vi);
    const tests = J`        for (int t = 0; t < 12; t++) {
            final int V = 1 + rnd.nextInt(11);
            final Digraph g = randomDigraph(rnd, V, rnd.nextInt(2 * V + 2));
            final int a = rnd.nextInt(V), b = rnd.nextInt(V);
            final Object expected = ${v.expected};
            test("${v.name}(" + g + "${v.name === 'scc' ? '' : ', " + a + ", " + b + "'})", () -> eq("${v.name}", expected, ${v.call}));
        }`;
    return {
      title: `Digraph: ${v.name}`,
      story: 'Two vertices are <b>strongly connected</b> when each can reach the other. Grouping vertices this way reveals the “loops” of a system, such as circular dependencies. Kosaraju-Sharir finds every group with just two depth-first searches.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'Digraph.java', code: DIGRAPH }],
      harness: harness({ seed, body: tests, helpers: SCC_HELPERS }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: [
        'Phase 1: DFS on the REVERSED graph (G.reverse()) over all vertices 0..V−1, collecting postorder; then reverse it.',
        'Phase 2: go through that order; every vertex not yet marked starts a new DFS on the ORIGINAL graph, and everything it reaches gets the current component number.',
        'Why it works: the reverse postorder of Gᴿ visits a “sink” component of G first, so a DFS from it cannot leak into other components.',
      ],
      approach: ['Draw a 5-vertex digraph with one cycle and find its components by eye.', 'Run phase 1 by hand on the reversed graph.', 'Run phase 2 and compare with what you found by eye.'],
    };
  },
};

export default [infix, treeAdvanced, rebuild, grid, probingTemplate(4), probingTemplate(5), llrbDelete, scc];
