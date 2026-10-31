// Binary search trees: put/get, ordered operations, ranges, Hibbard deletion, client code and validation.
import { J, harness, stub, choose, TREE_NODE, TREE_HELPERS } from './kit.js';

const HEAD = J`import java.util.*;

public class BST<Key extends Comparable<Key>, Value> {
    Node root;

    class Node {
        Key key;
        Value val;
        Node left, right;
        int size;

        Node(Key key, Value val, int size) {
            this.key = key;
            this.val = val;
            this.size = size;
        }
    }

    public int size() {
        return size(root);
    }

    int size(Node x) {
        return x == null ? 0 : x.size;
    }

    public boolean isEmpty() {
        return size() == 0;
    }
`;

const M = {
  get: J`    public Value get(Key key) {
        return get(root, key);
    }

    private Value get(Node x, Key key) {
        if (x == null) return null;
        int cmp = key.compareTo(x.key);
        if (cmp < 0) return get(x.left, key);
        if (cmp > 0) return get(x.right, key);
        return x.val;
    }`,
  put: J`    public void put(Key key, Value val) {
        root = put(root, key, val);
    }

    private Node put(Node x, Key key, Value val) {
        if (x == null) return new Node(key, val, 1);
        int cmp = key.compareTo(x.key);
        if (cmp < 0) x.left = put(x.left, key, val);
        else if (cmp > 0) x.right = put(x.right, key, val);
        else x.val = val;
        x.size = 1 + size(x.left) + size(x.right);
        return x;
    }`,
  minmax: J`    public Key min() {
        if (isEmpty()) return null;
        return min(root).key;
    }

    private Node min(Node x) {
        if (x.left == null) return x;
        return min(x.left);
    }

    public Key max() {
        if (isEmpty()) return null;
        Node x = root;
        while (x.right != null) x = x.right;
        return x.key;
    }`,
  floorceil: J`    public Key floor(Key key) {
        Node x = floor(root, key);
        return x == null ? null : x.key;
    }

    private Node floor(Node x, Key key) {
        if (x == null) return null;
        int cmp = key.compareTo(x.key);
        if (cmp == 0) return x;
        if (cmp < 0) return floor(x.left, key);
        Node t = floor(x.right, key);
        return t != null ? t : x;
    }

    public Key ceiling(Key key) {
        Node x = ceiling(root, key);
        return x == null ? null : x.key;
    }

    private Node ceiling(Node x, Key key) {
        if (x == null) return null;
        int cmp = key.compareTo(x.key);
        if (cmp == 0) return x;
        if (cmp > 0) return ceiling(x.right, key);
        Node t = ceiling(x.left, key);
        return t != null ? t : x;
    }`,
  rankselect: J`    public int rank(Key key) {
        return rank(root, key);
    }

    private int rank(Node x, Key key) {
        if (x == null) return 0;
        int cmp = key.compareTo(x.key);
        if (cmp < 0) return rank(x.left, key);
        if (cmp > 0) return 1 + size(x.left) + rank(x.right, key);
        return size(x.left);
    }

    public Key select(int k) {
        if (k < 0 || k >= size()) return null;
        return select(root, k).key;
    }

    private Node select(Node x, int k) {
        int t = size(x.left);
        if (t > k) return select(x.left, k);
        if (t < k) return select(x.right, k - t - 1);
        return x;
    }`,
  keysRange: J`    public ArrayList<Key> keys(Key lo, Key hi) {
        ArrayList<Key> out = new ArrayList<>();
        keys(root, out, lo, hi);
        return out;
    }

    private void keys(Node x, ArrayList<Key> out, Key lo, Key hi) {
        if (x == null) return;
        int cmplo = lo.compareTo(x.key);
        int cmphi = hi.compareTo(x.key);
        if (cmplo < 0) keys(x.left, out, lo, hi);
        if (cmplo <= 0 && cmphi >= 0) out.add(x.key);
        if (cmphi > 0) keys(x.right, out, lo, hi);
    }`,
  sizeRange: J`    public int size(Key lo, Key hi) {
        return size(root, lo, hi);
    }

    private int size(Node x, Key lo, Key hi) {
        if (x == null) return 0;
        if (hi.compareTo(x.key) < 0) return size(x.left, lo, hi);
        if (lo.compareTo(x.key) > 0) return size(x.right, lo, hi);
        return 1 + size(x.left, lo, hi) + size(x.right, lo, hi);
    }`,
  height: J`    public int height() {
        return height(root);
    }

    private int height(Node x) {
        if (x == null) return -1;
        return 1 + Math.max(height(x.left), height(x.right));
    }`,
  delminmax: J`    public void deleteMin() {
        if (isEmpty()) return;
        root = deleteMin(root);
    }

    private Node deleteMin(Node x) {
        if (x.left == null) return x.right;
        x.left = deleteMin(x.left);
        x.size = 1 + size(x.left) + size(x.right);
        return x;
    }

    public void deleteMax() {
        if (isEmpty()) return;
        root = deleteMax(root);
    }

    private Node deleteMax(Node x) {
        if (x.right == null) return x.left;
        x.right = deleteMax(x.right);
        x.size = 1 + size(x.left) + size(x.right);
        return x;
    }`,
  delete: J`    public void delete(Key key) {
        root = delete(root, key);
    }

    private Node delete(Node x, Key key) {
        if (x == null) return null;
        int cmp = key.compareTo(x.key);
        if (cmp < 0) x.left = delete(x.left, key);
        else if (cmp > 0) x.right = delete(x.right, key);
        else {
            if (x.right == null) return x.left;
            if (x.left == null) return x.right;
            Node t = x;
            x = min(t.right);
            x.right = deleteMin(t.right);
            x.left = t.left;
        }
        x.size = 1 + size(x.left) + size(x.right);
        return x;
    }

    private Node min(Node x) {
        if (x.left == null) return x;
        return min(x.left);
    }

    private Node deleteMin(Node x) {
        if (x.left == null) return x.right;
        x.left = deleteMin(x.left);
        x.size = 1 + size(x.left) + size(x.right);
        return x;
    }`,
  keysAll: J`    public ArrayList<Key> keys() {
        ArrayList<Key> out = new ArrayList<>();
        collect(root, out);
        return out;
    }

    private void collect(Node x, ArrayList<Key> out) {
        if (x == null) return;
        collect(x.left, out);
        out.add(x.key);
        collect(x.right, out);
    }

    public boolean contains(Key key) {
        return get(key) != null;
    }`,
};

const STUB = {
  putget: J`    public Value get(Key key) {
        return get(root, key);
    }

    /** Returns the value for key in the subtree rooted at x, or null if it is not there. */
    private Value get(Node x, Key key) {
        // TODO: compare key with x.key and go left, go right, or return x.val
        return null;
    }

    public void put(Key key, Value val) {
        root = put(root, key, val);
    }

    /**
     * Puts key/val in the subtree rooted at x and returns the (possibly new) subtree root.
     * If key already exists, replace its value. Remember to update x.size on the way back up.
     */
    private Node put(Node x, Key key, Value val) {
        // TODO
        return x;
    }`,
  minmax: J`    /** Returns the smallest key, or null if the tree is empty. */
    public Key min() {
        // TODO (tip: keep going left)
        return null;
    }

    /** Returns the largest key, or null if the tree is empty. */
    public Key max() {
        // TODO
        return null;
    }`,
  floorceil: J`    /** Returns the largest key <= key, or null if there is none. */
    public Key floor(Key key) {
        // TODO (tip: write a private recursive helper Node floor(Node x, Key key))
        return null;
    }

    /** Returns the smallest key >= key, or null if there is none. */
    public Key ceiling(Key key) {
        // TODO
        return null;
    }`,
  rankselect: J`    /** Returns the number of keys strictly less than key (key does not need to be in the tree). */
    public int rank(Key key) {
        // TODO (tip: use the size fields so you never visit a whole subtree)
        return 0;
    }

    /** Returns the key with rank k (the k-th smallest, starting at 0), or null if k is out of range. */
    public Key select(int k) {
        // TODO
        return null;
    }`,
  keysRange: J`    /** Returns every key in [lo, hi] (inclusive) in ascending order. Skip subtrees that cannot contain answers. */
    public ArrayList<Key> keys(Key lo, Key hi) {
        // TODO
        return new ArrayList<>();
    }`,
  sizeRange: J`    /** Returns how many keys are in [lo, hi] (inclusive). */
    public int size(Key lo, Key hi) {
        // TODO
        return 0;
    }`,
  height: J`    /** Returns the height of the tree: edges on the longest root-to-leaf path. Empty tree: -1. */
    public int height() {
        // TODO
        return 0;
    }`,
  delminmax: J`    /** Removes the smallest key. Does nothing if the tree is empty. Keep the size fields correct. */
    public void deleteMin() {
        // TODO
    }

    /** Removes the largest key. Does nothing if the tree is empty. Keep the size fields correct. */
    public void deleteMax() {
        // TODO
    }`,
  delete: J`    /**
     * Removes key (if present) using Hibbard deletion:
     * a node with two children is replaced by its SUCCESSOR (the minimum of its right subtree).
     * You will need private helpers min(Node x) and deleteMin(Node x). Keep the size fields correct.
     */
    public void delete(Key key) {
        // TODO
    }`,
};

const bstClass = (...parts) => `${HEAD}\n${parts.join('\n\n')}\n}\n`;

const BST_HELPERS = J`
    static <K extends Comparable<K>, V> List<K> inorder(BST<K, V> t) {
        List<K> out = new ArrayList<>();
        walk(t.root, out);
        return out;
    }

    static <K extends Comparable<K>, V> void walk(BST<K, V>.Node x, List<K> out) {
        if (x == null) return;
        walk(x.left, out);
        out.add(x.key);
        walk(x.right, out);
    }

    static <K extends Comparable<K>, V> int sizeCheck(BST<K, V>.Node x) {
        if (x == null) return 0;
        int s = 1 + sizeCheck(x.left) + sizeCheck(x.right);
        if (x.size != s) {
            throw new Mismatch("node " + x.key + " has size field " + x.size + " but its subtree really has " + s
                + " nodes.\n  Update it on the way back up: x.size = 1 + size(x.left) + size(x.right);");
        }
        return s;
    }

    static <K extends Comparable<K>, V> String shape(BST<K, V> t) {
        List<String> out = new ArrayList<>();
        List<BST<K, V>.Node> level = new ArrayList<>();
        level.add(t.root);
        while (true) {
            List<BST<K, V>.Node> next = new ArrayList<>();
            boolean any = false;
            for (BST<K, V>.Node x : level) {
                out.add(x == null ? "null" : String.valueOf(x.key));
                if (x != null) { next.add(x.left); next.add(x.right); if (x.left != null || x.right != null) any = true; }
            }
            if (!any) break;
            level = next;
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(", ", out.subList(0, end)) + "]";
    }

    static class Ref<K extends Comparable<K>, V> {
        class N { K key; V val; N left, right; int size = 1; N(K k, V v) { key = k; val = v; } }
        N root;
        int size(N x) { return x == null ? 0 : x.size; }
        void put(K k, V v) { root = put(root, k, v); }
        N put(N x, K k, V v) {
            if (x == null) return new N(k, v);
            int c = k.compareTo(x.key);
            if (c < 0) x.left = put(x.left, k, v); else if (c > 0) x.right = put(x.right, k, v); else x.val = v;
            x.size = 1 + size(x.left) + size(x.right);
            return x;
        }
        V get(K k) { N x = root; while (x != null) { int c = k.compareTo(x.key); if (c == 0) return x.val; x = c < 0 ? x.left : x.right; } return null; }
        N min(N x) { return x.left == null ? x : min(x.left); }
        N deleteMin(N x) { if (x.left == null) return x.right; x.left = deleteMin(x.left); x.size = 1 + size(x.left) + size(x.right); return x; }
        N deleteMax(N x) { if (x.right == null) return x.left; x.right = deleteMax(x.right); x.size = 1 + size(x.left) + size(x.right); return x; }
        void deleteMin() { if (root != null) root = deleteMin(root); }
        void deleteMax() { if (root != null) root = deleteMax(root); }
        void delete(K k) { root = delete(root, k); }
        N delete(N x, K k) {
            if (x == null) return null;
            int c = k.compareTo(x.key);
            if (c < 0) x.left = delete(x.left, k);
            else if (c > 0) x.right = delete(x.right, k);
            else {
                if (x.right == null) return x.left;
                if (x.left == null) return x.right;
                N t = x; x = min(t.right); x.right = deleteMin(t.right); x.left = t.left;
            }
            x.size = 1 + size(x.left) + size(x.right);
            return x;
        }
        String shape() {
            List<String> out = new ArrayList<>();
            List<N> level = new ArrayList<>();
            level.add(root);
            while (true) {
                List<N> next = new ArrayList<>();
                boolean any = false;
                for (N x : level) {
                    out.add(x == null ? "null" : String.valueOf(x.key));
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

    static final String[] WORDS = {"oak", "elm", "fir", "ash", "yew", "bay", "fig", "box", "gum", "tea", "cork", "pine", "teak", "lime"};

    static int[] keys(Random r, int n, int bound) {
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = r.nextInt(bound);
        return a;
    }

    static int[] distinctKeys(Random r, int n, int bound) {
        LinkedHashSet<Integer> s = new LinkedHashSet<>();
        while (s.size() < n) s.add(r.nextInt(bound));
        int[] a = new int[n];
        int i = 0;
        for (int v : s) a[i++] = v;
        return a;
    }

    static BST<Integer, String> build(int[] ks) {
        BST<Integer, String> t = new BST<>();
        for (int k : ks) t.put(k, "v" + k);
        return t;
    }

    static Ref<Integer, String> buildRef(int[] ks) {
        Ref<Integer, String> t = new Ref<>();
        for (int k : ks) t.put(k, "v" + k);
        return t;
    }
`;

const FLAVORS = [
  'A small library indexes books by shelf code.',
  'A gym tracks members by member number.',
  'A shipping depot looks up parcels by tracking number.',
  'A game stores high scores by player id.',
  'A clinic keeps patient files by chart number.',
];

/* ------------------------------------------------------------------ put/get */

const PUTGET = [
  { keyType: 'Integer', keyGen: 'rnd.nextInt(20)', probe: 'for (int p = -1; p <= 20; p++) probes.add(p);' },
  { keyType: 'String', keyGen: 'WORDS[rnd.nextInt(WORDS.length)]', probe: 'probes.addAll(Arrays.asList(WORDS)); probes.add("zzz"); probes.add("a");' },
];

const putget = {
  id: 'bst-putget',
  topic: 'bst',
  level: 1,
  title: 'BST put & get',
  skill: 'Recursive insert with size counts',
  variants: PUTGET.length,
  generate(rng, seed, vi) {
    const v = choose(rng, PUTGET, vi);
    const K = v.keyType;
    const tests = J`        for (int t = 0; t < 6; t++) {
            int n = t == 0 ? 0 : t == 1 ? 1 : 3 + rnd.nextInt(14);
            final List<${K}> ks = new ArrayList<>();
            final List<String> vs = new ArrayList<>();
            for (int i = 0; i < n; i++) { ks.add(${v.keyGen}); vs.add("v" + rnd.nextInt(100)); }
            final Ref<${K}, String> ref = new Ref<>();
            for (int i = 0; i < n; i++) ref.put(ks.get(i), vs.get(i));
            final String label = "put keys " + show(ks);
            test(label + " -> size, in-order keys, size fields, shape", () -> {
                BST<${K}, String> bst = new BST<>();
                for (int i = 0; i < ks.size(); i++) bst.put(ks.get(i), vs.get(i));
                eq("size()", ref.size(ref.root), bst.size());
                List<${K}> sorted = new ArrayList<>(new TreeSet<>(ks));
                eq("in-order keys (must be sorted, no duplicates)", sorted, inorder(bst));
                sizeCheck(bst.root);
                eq("tree shape (level order)", ref.shape(), shape(bst));
            });
            test(label + " -> get() for present and missing keys", () -> {
                BST<${K}, String> bst = new BST<>();
                for (int i = 0; i < ks.size(); i++) bst.put(ks.get(i), vs.get(i));
                List<${K}> probes = new ArrayList<>();
                ${v.probe}
                for (${K} p : probes) eq("get(" + show(p) + ")", ref.get(p), bst.get(p));
            });
        }`;
    return {
      title: `BST put & get (${K} keys)`,
      story: `${rng.pick(FLAVORS)} The records live in a binary search tree. Every operation starts at the root and goes left or right by comparing keys.`,
      task: 'Complete the two private recursive helpers in <code>BST.java</code>: <code>get(Node x, Key key)</code> and <code>put(Node x, Key key, Value val)</code>. Putting an existing key <strong>replaces</strong> its value. Every node’s <code>size</code> must stay equal to the number of nodes in its subtree.',
      examples: [['put(5,"a"); put(2,"b"); put(8,"c"); get(2)', '"b"'], ['put(5,"a"); put(5,"z"); size(); get(5)', '1, "z"'], ['get(99) on any tree without 99', 'null']],
      file: { name: 'BST.java', code: bstClass(STUB.putget) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: BST_HELPERS }),
      solution: bstClass(M.get, M.put),
      hints: [
        '<code>get</code>: if x is null the key is not there. Otherwise compare <code>key.compareTo(x.key)</code>: negative means go left, positive means go right, zero means you found it.',
        '<code>put</code>: if x is null, this is where the key belongs, so return <code>new Node(key, val, 1)</code>. Otherwise recurse into the correct side and REASSIGN the link: <code>x.left = put(x.left, key, val);</code>',
        'After the recursive call, fix the count: <code>x.size = 1 + size(x.left) + size(x.right);</code> then <code>return x;</code>',
      ],
      approach: [
        'Draw an empty tree, insert 5, 2, 8, 2 by hand, and watch which links change.',
        'The recursive put RETURNS the root of the subtree. That is how a new node gets linked to its parent.',
        'Every node on the path from the root to the change gets its size recomputed when the recursion unwinds.',
      ],
    };
  },
};

/* ------------------------------------------------------------------ ordered operations */

const ORDER = [
  {
    key: 'minmax',
    title: 'min & max',
    task: 'Implement <code>min()</code> and <code>max()</code>. Both return <code>null</code> on an empty tree.',
    examples: [['keys {5, 2, 8, 6}: min(), max()', '2, 8']],
    tests: J`            test("min() and max() of " + show(sorted), () -> {
                eq("min()", sorted.isEmpty() ? null : sorted.first(), bst.min());
                eq("max()", sorted.isEmpty() ? null : sorted.last(), bst.max());
            });`,
    hints: ['The minimum is the leftmost node: keep following <code>left</code> until it is null.', 'The maximum is the rightmost node.', 'Check <code>isEmpty()</code> first so you never touch a null root.'],
  },
  {
    key: 'floorceil',
    title: 'floor & ceiling',
    task: 'Implement <code>floor(key)</code> (largest key ≤ key) and <code>ceiling(key)</code> (smallest key ≥ key). Return <code>null</code> when no such key exists. The argument does not need to be in the tree.',
    examples: [['keys {2, 5, 8}: floor(6), ceiling(6)', '5, 8'], ['keys {2, 5, 8}: floor(1)', 'null']],
    tests: J`            for (int p = -1; p <= 41; p += 3 + rnd.nextInt(5)) {
                final int q = p;
                test("floor(" + q + ") and ceiling(" + q + ") with keys " + show(sorted), () -> {
                    eq("floor(" + q + ")", sorted.floor(q), bst.floor(q));
                    eq("ceiling(" + q + ")", sorted.ceiling(q), bst.ceiling(q));
                });
            }`,
    hints: [
      'floor: if key equals x.key, x is the answer. If key &lt; x.key, the floor MUST be in the left subtree.',
      'If key &gt; x.key, the floor might be in the right subtree. Look there first, and if nothing is found, x itself is the floor.',
      'ceiling is the mirror image: swap left and right, and swap &lt; and &gt;.',
    ],
  },
  {
    key: 'rankselect',
    title: 'rank & select',
    task: 'Implement <code>rank(key)</code>, the number of keys strictly less than key, and <code>select(k)</code>, the key whose rank is k (0-based). select returns <code>null</code> when k is out of range. Use the <code>size</code> fields; do not collect all the keys into a list.',
    examples: [['keys {2, 5, 8}: rank(5), rank(6), select(0), select(2)', '1, 2, 2, 8']],
    tests: J`            final List<Integer> asList = new ArrayList<>(sorted);
            for (int p = -1; p <= 41; p += 4 + rnd.nextInt(5)) {
                final int q = p;
                test("rank(" + q + ") with keys " + show(asList), () -> eq("rank(" + q + ")", sorted.headSet(q).size(), bst.rank(q)));
            }
            test("select(k) for every k with keys " + show(asList), () -> {
                for (int k = -1; k <= asList.size(); k++) {
                    eq("select(" + k + ")", k >= 0 && k < asList.size() ? asList.get(k) : null, bst.select(k));
                }
            });`,
    hints: [
      'rank: if key &lt; x.key, the answer is entirely inside the left subtree. If key &gt; x.key, then everything in the left subtree, plus x itself, is smaller. That gives <code>1 + size(x.left) + rank(x.right, key)</code>.',
      'If key equals x.key, the rank is just <code>size(x.left)</code>.',
      'select(k): let t = size(x.left). If t &gt; k, go left. If t &lt; k, go right looking for k − t − 1. If t == k, you found it.',
    ],
  },
];

const order = {
  id: 'bst-order',
  topic: 'bst',
  level: 2,
  title: 'Ordered operations',
  skill: 'min/max, floor/ceiling, rank/select',
  variants: ORDER.length,
  generate(rng, seed, vi) {
    const v = choose(rng, ORDER, vi);
    const tests = J`        for (int t = 0; t < 4; t++) {
            int n = t == 0 ? 0 : 1 + rnd.nextInt(14);
            final int[] ks = distinctKeys(rnd, n, 40);
            final BST<Integer, String> bst = build(ks);
            final TreeSet<Integer> sorted = new TreeSet<>();
            for (int k : ks) sorted.add(k);
${v.tests}
        }`;
    return {
      title: `BST: ${v.title}`,
      story: 'A hash table can only answer "is this key here?". A BST knows the <em>order</em> of its keys, so it can answer "what is the closest key below 50?" or "what is the 10th smallest?" in time proportional to the height.',
      task: v.task,
      examples: v.examples,
      file: { name: 'BST.java', code: bstClass(M.get, M.put, STUB[v.key]) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: BST_HELPERS }),
      solution: bstClass(M.get, M.put, M[v.key]),
      hints: v.hints,
      approach: ['Draw a 6-node BST and answer the question by hand for a few keys.', 'At each node, decide: is the answer here, definitely on the left, or maybe on the right?', 'Write a private recursive helper that returns a Node, and let the public method extract <code>.key</code> (watch for null).'],
    };
  },
};

/* ------------------------------------------------------------------ range */

const RANGE = [
  {
    key: 'keysRange',
    title: 'range keys',
    task: 'Implement <code>keys(lo, hi)</code>: an <code>ArrayList</code> of every key in [lo, hi] in ascending order. Only visit subtrees that can contain keys in the range. This is a "pruned" in-order traversal.',
    examples: [['keys {1,4,6,9,12}: keys(4, 10)', '[4, 6, 9]']],
    tests: J`                eq("keys(" + lo + ", " + hi + ")", lo > hi ? new ArrayList<Integer>() : new ArrayList<>(sorted.subSet(lo, true, hi, true)), bst.keys(lo, hi));`,
    hints: ['Do an in-order traversal (left, node, right), but recurse left only if <code>lo &lt; x.key</code> and right only if <code>hi &gt; x.key</code>.', 'Add x.key when lo ≤ x.key ≤ hi.', 'Pass the result list down into a private helper.'],
  },
  {
    key: 'sizeRange',
    title: 'range count',
    task: 'Implement <code>size(lo, hi)</code>: how many keys are in [lo, hi] (inclusive). Any correct approach is accepted. Try a pruned recursion, or rank() plus a contains check.',
    examples: [['keys {1,4,6,9,12}: size(4, 10)', '3'], ['size(10, 4)', '0']],
    tests: J`                eq("size(" + lo + ", " + hi + ")", lo > hi ? 0 : sorted.subSet(lo, true, hi, true).size(), bst.size(lo, hi));`,
    hints: ['If hi &lt; x.key, everything in range is on the left. If lo &gt; x.key, everything is on the right.', 'Otherwise x counts, and both sides might contribute.', 'If lo &gt; hi the answer is 0, and the recursion handles that naturally.'],
  },
  {
    key: 'height',
    title: 'height',
    task: 'Implement <code>height()</code>: the number of edges on the longest root-to-leaf path. A one-node tree has height 0; an empty tree has height −1.',
    examples: [['insert 1, 2, 3, 4 (a "stick")', '3'], ['insert 2, 1, 3', '1']],
    tests: J`                eq("height()", refHeight(ref.root), bst.height());`,
    extra: J`    static int refHeight(Ref<Integer, String>.N x) { return x == null ? -1 : 1 + Math.max(refHeight(x.left), refHeight(x.right)); }`,
    hints: ['Height of a node = 1 + the taller of its two subtrees.', 'Choose the null case so that a leaf gets 1 + max(−1, −1) = 0.'],
  },
];

const range = {
  id: 'bst-range',
  topic: 'bst',
  level: 2,
  title: 'Range queries',
  skill: 'Pruned traversals',
  variants: RANGE.length,
  generate(rng, seed, vi) {
    const v = choose(rng, RANGE, vi);
    const tests = J`        for (int t = 0; t < 10; t++) {
            int n = t == 0 ? 0 : 1 + rnd.nextInt(18);
            final int[] ks = distinctKeys(rnd, n, 50);
            final BST<Integer, String> bst = build(ks);
            final Ref<Integer, String> ref = buildRef(ks);
            final TreeSet<Integer> sorted = new TreeSet<>();
            for (int k : ks) sorted.add(k);
            final int lo = rnd.nextInt(50) - 3, hi = lo + rnd.nextInt(25) - 2;
            test("${v.title} with keys inserted in order " + Arrays.toString(ks) + (${v.key === 'height' ? 'false' : 'true'} ? " for [" + lo + ", " + hi + "]" : ""), () -> {
${v.tests}
            });
        }`;
    return {
      title: `BST: ${v.title}`,
      story: 'Range queries are what make ordered symbol tables useful, e.g. "every reservation between 9:00 and 11:00" or "all apartments on floor 3". The trick is to skip whole subtrees that cannot contain answers.',
      task: v.task,
      examples: v.examples,
      file: { name: 'BST.java', code: bstClass(M.get, M.put, STUB[v.key]) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: BST_HELPERS + (v.extra || '') }),
      solution: bstClass(M.get, M.put, M[v.key]),
      hints: v.hints,
      approach: ['Sketch a BST and shade the keys in the range.', 'Notice which subtrees contain no shaded keys at all. Your code should never walk into them.', 'Write the helper with the comparisons against lo and hi.'],
    };
  },
};

/* ------------------------------------------------------------------ delete */

const DELETE = [
  {
    key: 'delminmax',
    title: 'deleteMin & deleteMax',
    task: 'Implement <code>deleteMin()</code> and <code>deleteMax()</code>. Both do nothing on an empty tree. Sizes must stay correct.',
    examples: [['keys {5,2,8,1}: deleteMin(); keys()', '[2, 5, 8]']],
    ops: J`                    if (rnd2.nextBoolean()) { bst.deleteMin(); ref.deleteMin(); log.add("deleteMin()"); }
                    else { bst.deleteMax(); ref.deleteMax(); log.add("deleteMax()"); }`,
    hints: ['deleteMin: go left until the node has no left child. That node is the min. Replace it with its RIGHT child by returning <code>x.right</code>.', 'On the way back up, reassign <code>x.left = deleteMin(x.left)</code> and recompute x.size.', 'deleteMax is the mirror image.'],
  },
  {
    key: 'delete',
    title: 'Hibbard deletion',
    task: 'Implement <code>delete(key)</code> with <strong>Hibbard deletion</strong>. A node with 0 or 1 children is replaced by its child. A node with 2 children is replaced by its <em>successor</em>: the minimum of its right subtree, which is first removed from that subtree. Deleting a missing key does nothing. The resulting shape must match exactly.',
    examples: [['keys inserted 5,2,8,7,9: delete(5); level order', '[7, 2, 8, null, null, null, 9]']],
    ops: J`                    final int k = rnd2.nextInt(3) == 0 ? rnd2.nextInt(45) : ks[rnd2.nextInt(ks.length)];
                    bst.delete(k); ref.delete(k); log.add("delete(" + k + ")");`,
    hints: [
      'Find the node like in get. Once found: if <code>x.right == null</code> return x.left; if <code>x.left == null</code> return x.right.',
      'Two children: <code>Node t = x; x = min(t.right); x.right = deleteMin(t.right); x.left = t.left;</code> (the order of these lines matters!).',
      'Always finish with <code>x.size = 1 + size(x.left) + size(x.right); return x;</code>',
    ],
  },
];

const del = {
  id: 'bst-delete',
  topic: 'bst',
  level: 3,
  title: 'Deletion',
  skill: 'deleteMin, Hibbard delete',
  variants: DELETE.length,
  generate(rng, seed, vi) {
    const v = choose(rng, DELETE, vi);
    const tests = J`        for (int t = 0; t < 6; t++) {
            final int[] ks = distinctKeys(rnd, t == 0 ? 1 : 3 + rnd.nextInt(12), 45);
            final long subSeed = rnd.nextLong();
            final int steps = 1 + rnd.nextInt(5);
            test("insert " + Arrays.toString(ks) + ", then " + steps + " deletion(s)", () -> {
                Random rnd2 = new Random(subSeed);
                BST<Integer, String> bst = build(ks);
                Ref<Integer, String> ref = buildRef(ks);
                List<String> log = new ArrayList<>();
                for (int s = 0; s < steps; s++) {
${v.ops}
                    eq("tree shape after " + log, ref.shape(), shape(bst));
                    eq("size() after " + log, ref.size(ref.root), bst.size());
                    sizeCheck(bst.root);
                }
            });
        }`;
    return {
      title: `BST: ${v.title}`,
      story: 'Deletion is the trickiest BST operation: a node disappears, so its parent must be relinked and every size on the path must be repaired.',
      task: v.task,
      examples: v.examples,
      file: { name: 'BST.java', code: bstClass(M.get, M.put, STUB[v.key]) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: BST_HELPERS }),
      solution: bstClass(M.get, M.put, M[v.key]),
      hints: v.hints,
      approach: ['Handle the three cases one at a time: leaf, one child, two children.', 'Use the same "return the new subtree root and reassign the link" pattern as put.', 'Test on paper: delete the root of a 5-node tree and redraw it.'],
    };
  },
};

/* ------------------------------------------------------------------ client code */

const CLIENT = [
  {
    name: 'wordCounts',
    sig: 'public static BST<String, Integer> wordCounts(List<String> words)',
    doc: 'Returns a BST mapping each distinct word to how many times it appears.',
    story: 'A text analyzer counts word frequencies. The classic "get, then put" pattern: look up the current count and store count + 1.',
    examples: [['wordCounts(["to", "be", "or", "not", "to", "be"])', 'be=2, not=1, or=1, to=2']],
    body: J`        BST<String, Integer> counts = new BST<>();
        for (String w : words) {
            Integer current = counts.get(w);
            counts.put(w, current == null ? 1 : current + 1);
        }
        return counts;`,
    tests: J`        String[] pool = {"to", "be", "or", "not", "that", "is", "the", "question"};
        for (int t = 0; t < 8; t++) {
            final List<String> words = new ArrayList<>();
            int n = rnd.nextInt(15);
            for (int i = 0; i < n; i++) words.add(pool[rnd.nextInt(pool.length)]);
            final TreeMap<String, Integer> expected = new TreeMap<>();
            for (String w : words) expected.merge(w, 1, Integer::sum);
            test("wordCounts(" + show(words) + ")", () -> {
                BST<String, Integer> got = Solution.wordCounts(words);
                eq("keys", new ArrayList<>(expected.keySet()), got.keys());
                for (String k : expected.keySet()) eq("count of \"" + k + "\"", expected.get(k), got.get(k));
            });
        }`,
    hints: ['Start with an empty BST.', 'For each word: <code>Integer c = counts.get(w);</code> If c is null this is the first time you have seen the word.', 'Put back 1 or c + 1.'],
  },
  {
    name: 'groupOrders',
    sig: 'public static BST<String, ArrayList<String>> groupOrders(List<String> orders)',
    doc: 'Each order looks like "customer:item". Returns a BST mapping each customer to the list\nof their items, in the order they appear. Never lose items already stored.',
    story: 'A bakery groups online orders by customer. Each key maps to a LIST, and a careless put would replace the whole list. You have to <em>get</em> the existing list and add to it.',
    examples: [['groupOrders(["ana:bread", "bo:cake", "ana:pie"])', 'ana=[bread, pie], bo=[cake]']],
    body: J`        BST<String, ArrayList<String>> groups = new BST<>();
        for (String order : orders) {
            String[] parts = order.split(":");
            ArrayList<String> items = groups.get(parts[0]);
            if (items == null) {
                items = new ArrayList<>();
                groups.put(parts[0], items);
            }
            items.add(parts[1]);
        }
        return groups;`,
    tests: J`        String[] people = {"ana", "bo", "cy", "dee"};
        String[] items = {"bread", "cake", "pie", "bagel", "tart"};
        for (int t = 0; t < 8; t++) {
            final List<String> orders = new ArrayList<>();
            int n = rnd.nextInt(10);
            for (int i = 0; i < n; i++) orders.add(people[rnd.nextInt(people.length)] + ":" + items[rnd.nextInt(items.length)]);
            final TreeMap<String, List<String>> expected = new TreeMap<>();
            for (String o : orders) expected.computeIfAbsent(o.split(":")[0], k -> new ArrayList<>()).add(o.split(":")[1]);
            test("groupOrders(" + show(orders) + ")", () -> {
                BST<String, ArrayList<String>> got = Solution.groupOrders(orders);
                eq("customers", new ArrayList<>(expected.keySet()), got.keys());
                for (String k : expected.keySet()) eq("items of " + k, expected.get(k), got.get(k));
            });
        }`,
    hints: ['Split each order on ":".', 'get the customer’s list. If it is null, create a new list and put it in the tree ONCE.', 'Then add the item to the list. The list object lives inside the tree, so changes to it are kept.'],
  },
  {
    name: 'aisleTotal',
    sig: 'public static int aisleTotal(BST<String, Integer> stock, int aisle)',
    doc: 'stock maps locations "AA-SS" (two-digit aisle, two-digit shelf, e.g. "07-03") to item counts.\nReturns the total count on the given aisle (1-99). Use stock.keys(lo, hi) with a key range\nthat covers exactly that aisle: do not scan every key.',
    story: 'A warehouse encodes locations so that all shelves of one aisle are <em>adjacent in sorted order</em>. That turns "everything in aisle 7" into a single range query.',
    examples: [['stock {"03-01"=4, "07-02"=5, "07-11"=1, "08-01"=9}, aisle 7', '6']],
    body: J`        String prefix = String.format("%02d", aisle);
        int total = 0;
        for (String key : stock.keys(prefix + "-00", prefix + "-99")) {
            total += stock.get(key);
        }
        return total;`,
    tests: J`        for (int t = 0; t < 8; t++) {
            final BST<String, Integer> stock = new BST<>();
            final TreeMap<String, Integer> copy = new TreeMap<>();
            int n = 1 + rnd.nextInt(20);
            for (int i = 0; i < n; i++) {
                String key = String.format("%02d-%02d", 1 + rnd.nextInt(9), 1 + rnd.nextInt(20));
                int count = rnd.nextInt(30);
                stock.put(key, count);
                copy.put(key, count);
            }
            final int aisle = 1 + rnd.nextInt(9);
            int e = 0;
            for (Map.Entry<String, Integer> en : copy.entrySet()) if (Integer.parseInt(en.getKey().substring(0, 2)) == aisle) e += en.getValue();
            final int expected = e;
            test("aisleTotal(" + copy + ", " + aisle + ")", () -> eq("aisleTotal", expected, Solution.aisleTotal(stock, aisle)));
        }`,
    hints: ['Build the two-digit aisle text with <code>String.format("%02d", aisle)</code>.', 'Every shelf in aisle 7 sorts between "07-00" and "07-99".', 'Loop over <code>stock.keys(lo, hi)</code> and add up <code>stock.get(key)</code>.'],
  },
];

const client = {
  id: 'bst-client',
  topic: 'bst',
  level: 2,
  title: 'BST client code',
  skill: 'get-then-put, key design, range keys',
  variants: CLIENT.length,
  generate(rng, seed, vi) {
    const v = choose(rng, CLIENT, vi);
    const provided = bstClass(M.get, M.put, M.keysAll, M.keysRange).replace('import java.util.*;\n\n', 'import java.util.*;\n\n/** Provided: a complete, working BST. Do not change this file. */\n');
    return {
      title: `BST client: ${v.name}`,
      story: v.story,
      task: `Implement <code>${v.sig.replace('public static ', '')}</code> in <code>Solution.java</code> using the provided <code>BST</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'BST.java', code: provided }],
      harness: harness({ seed, body: v.tests, helpers: '' }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Read the provided BST’s public methods. They are your whole toolbox.', 'Work one input record at a time: what get/put calls does it need?', 'Watch for the case where the key is not in the tree yet (get returns null).'],
    };
  },
};

/* ------------------------------------------------------------------ BST property on raw nodes */

const CHECK = [
  {
    name: 'isBST',
    sig: 'public static boolean isBST(TreeNode root)',
    doc: 'Returns true if the tree is a valid BST with DISTINCT values: for every node, all values in its\nleft subtree are smaller and all values in its right subtree are larger. Empty tree: true.',
    examples: [['isBST([5, 3, 8])', 'true'], ['isBST([5, 3, 8, 1, 6])', 'false  (6 is in 5’s left subtree)']],
    body: J`        return check(root, null, null);
    }

    private static boolean check(TreeNode x, Integer min, Integer max) {
        if (x == null) return true;
        if (min != null && x.val <= min) return false;
        if (max != null && x.val >= max) return false;
        return check(x.left, min, x.val) && check(x.right, x.val, max);`,
    tests: J`        for (int t = 0; t < 14; t++) {
            TreeNode r = bstFrom(distinct(rnd, t == 0 ? 0 : 1 + rnd.nextInt(10), 60));
            if (t % 2 == 1) r = randomTree(rnd, 2 + rnd.nextInt(7), 60);
            final TreeNode root = r;
            final boolean expected = refIs(root, Long.MIN_VALUE, Long.MAX_VALUE);
            test("isBST(" + ser(root) + ")", () -> eq("isBST", expected, Solution.isBST(copy(root))));
        }`,
    ref: J`    static boolean refIs(TreeNode x, long lo, long hi) { if (x == null) return true; if (x.val <= lo || x.val >= hi) return false; return refIs(x.left, lo, x.val) && refIs(x.right, x.val, hi); }`,
    hints: ['Checking only a node against its two children is NOT enough. A grandchild can break the rule.', 'Pass down the allowed range (min, max). Going left tightens max to x.val, going right tightens min to x.val.', 'Use <code>Integer</code> (nullable) bounds, or <code>long</code> bounds starting at Long.MIN_VALUE / MAX_VALUE.'],
  },
  {
    name: 'kthSmallest',
    sig: 'public static int kthSmallest(TreeNode root, int k)',
    doc: 'root is a valid BST with n >= k distinct values. Returns the k-th smallest value (k = 1 is the minimum).',
    examples: [['kthSmallest(BST of {2, 5, 8, 9}, 3)', '8']],
    body: J`        ArrayList<Integer> sorted = new ArrayList<>();
        inorder(root, sorted);
        return sorted.get(k - 1);
    }

    private static void inorder(TreeNode x, ArrayList<Integer> out) {
        if (x == null) return;
        inorder(x.left, out);
        out.add(x.val);
        inorder(x.right, out);`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final int[] ks = distinct(rnd, 1 + rnd.nextInt(12), 80);
            final TreeNode root = bstFrom(ks);
            int[] sorted = ks.clone(); Arrays.sort(sorted);
            final int k = 1 + rnd.nextInt(ks.length);
            final int expected = sorted[k - 1];
            test("kthSmallest(" + ser(root) + ", " + k + ")", () -> eq("kthSmallest", expected, Solution.kthSmallest(copy(root), k)));
        }`,
    hints: ['An in-order traversal of a BST visits values in sorted order.', 'Collect them into a list and return element k − 1. Or, better, count as you go and stop at the k-th visit.'],
  },
  {
    name: 'lca',
    sig: 'public static int lca(TreeNode root, int a, int b)',
    doc: 'root is a valid BST containing both a and b. Returns the value of their lowest common ancestor:\nthe deepest node that has both a and b in its subtree (a node counts as its own descendant).',
    examples: [['lca(BST from 6,2,8,0,4,7,9; 2, 4)', '2'], ['lca(same, 0, 9)', '6']],
    body: J`        TreeNode x = root;
        while (true) {
            if (a < x.val && b < x.val) x = x.left;
            else if (a > x.val && b > x.val) x = x.right;
            else return x.val;
        }`,
    tests: J`        for (int t = 0; t < 12; t++) {
            final int[] ks = distinct(rnd, 2 + rnd.nextInt(12), 80);
            final TreeNode root = bstFrom(ks);
            final int a = ks[rnd.nextInt(ks.length)], b = ks[rnd.nextInt(ks.length)];
            final int expected = refLca(root, a, b);
            test("lca(" + ser(root) + ", " + a + ", " + b + ")", () -> eq("lca", expected, Solution.lca(copy(root), a, b)));
        }`,
    ref: J`    static int refLca(TreeNode x, int a, int b) { if (a < x.val && b < x.val) return refLca(x.left, a, b); if (a > x.val && b > x.val) return refLca(x.right, a, b); return x.val; }`,
    hints: ['If both values are smaller than x.val, the answer is in the left subtree. If both are larger, it is in the right subtree.', 'Otherwise they split here (or one of them IS x), so x is the answer.'],
  },
];

const check = {
  id: 'bst-check',
  topic: 'bst',
  level: 2,
  title: 'BST property',
  skill: 'Using the ordering invariant',
  variants: CHECK.length,
  generate(rng, seed, vi) {
    const v = choose(rng, CHECK, vi);
    return {
      title: `BST property: ${v.name}`,
      story: 'The BST invariant (smaller to the left, larger to the right, at EVERY level) is what makes searching fast. These problems make you reason about it directly.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'TreeNode.java', code: TREE_NODE }],
      harness: harness({ seed, body: v.tests, helpers: TREE_HELPERS + (v.ref || '') }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Draw a BST and ask the question about specific nodes.', 'Decide at each node whether the answer is here, left, or right.', 'Look for a counterexample that would fool a simpler approach.'],
    };
  },
};

export default [putget, order, range, del, client, check];
