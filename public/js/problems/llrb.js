// Left-leaning red-black BSTs: rotations, color flips, balanced insertion and invariant checks.
import { J, harness, choose } from './kit.js';

const HEAD = J`import java.util.*;

public class LLRB<Key extends Comparable<Key>, Value> {
    static final boolean RED = true;
    static final boolean BLACK = false;

    Node root;

    class Node {
        Key key;
        Value val;
        Node left, right;
        boolean color;  // color of the link from the parent to this node
        int size;

        Node(Key key, Value val, boolean color, int size) {
            this.key = key;
            this.val = val;
            this.color = color;
            this.size = size;
        }
    }

    boolean isRed(Node x) {
        if (x == null) return false;
        return x.color == RED;
    }

    int size(Node x) {
        return x == null ? 0 : x.size;
    }

    public int size() {
        return size(root);
    }

    public Value get(Key key) {
        Node x = root;
        while (x != null) {
            int cmp = key.compareTo(x.key);
            if (cmp < 0) x = x.left;
            else if (cmp > 0) x = x.right;
            else return x.val;
        }
        return null;
    }
`;

const M = {
  rotations: J`    Node rotateLeft(Node h) {
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

    void flipColors(Node h) {
        h.color = RED;
        h.left.color = BLACK;
        h.right.color = BLACK;
    }`,
  put: J`    public void put(Key key, Value val) {
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
    }`,
};

const STUB = {
  rotations: J`    /**
     * Turns a right-leaning red link (h -> h.right) into a left-leaning one and returns the new subtree root.
     * The new root takes h's color, h becomes RED, and both sizes must be correct afterwards.
     */
    Node rotateLeft(Node h) {
        // TODO
        return h;
    }

    /** Mirror image of rotateLeft: turns a left-leaning red link into a right-leaning one. */
    Node rotateRight(Node h) {
        // TODO
        return h;
    }

    /** h has two red children: make both children BLACK and h RED (passes a key up in the 2-3 tree). */
    void flipColors(Node h) {
        // TODO
    }`,
  put: J`    /** Inserts key/val (or replaces the value of an existing key). The root is always black afterwards. */
    public void put(Key key, Value val) {
        // TODO: call your recursive helper, then color the root BLACK
    }

    // TODO: write private Node put(Node h, Key key, Value val)
    //   1. ordinary BST insert; new nodes are RED
    //   2. on the way back up fix, in this order:
    //        right red & left black   -> rotateLeft
    //        left red & left.left red -> rotateRight
    //        both children red        -> flipColors
    //   3. update h.size and return h`,
};

const llrbClass = (...parts) => `${HEAD}\n${parts.join('\n\n')}\n}\n`;

const HELPERS = J`
    static final String[] WORDS = {"oak", "elm", "fir", "ash", "yew", "bay", "fig", "box", "gum", "tea", "cork", "pine", "teak", "lime", "palm", "sal"};

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

    static <K extends Comparable<K>, V> int sizeCheck(LLRB<K, V>.Node x) {
        if (x == null) return 0;
        int s = 1 + sizeCheck(x.left) + sizeCheck(x.right);
        if (x.size != s) throw new Mismatch("node " + x.key + " has size field " + x.size + " but its subtree has " + s + " nodes.");
        return s;
    }

    static class Ref<K extends Comparable<K>> {
        class N { K key; N left, right; boolean red = true; N(K k) { key = k; } }
        N root;
        boolean red(N x) { return x != null && x.red; }
        N rl(N h) { N x = h.right; h.right = x.left; x.left = h; x.red = h.red; h.red = true; return x; }
        N rr(N h) { N x = h.left; h.left = x.right; x.right = h; x.red = h.red; h.red = true; return x; }
        void put(K k) { root = put(root, k); root.red = false; }
        N put(N h, K k) {
            if (h == null) return new N(k);
            int c = k.compareTo(h.key);
            if (c < 0) h.left = put(h.left, k); else if (c > 0) h.right = put(h.right, k);
            if (red(h.right) && !red(h.left)) h = rl(h);
            if (red(h.left) && red(h.left.left)) h = rr(h);
            if (red(h.left) && red(h.right)) { h.red = true; h.left.red = false; h.right.red = false; }
            return h;
        }
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

/* ------------------------------------------------------------------ rotations */

const KEYS = [
  { K: 'Integer', gen: 'rnd.nextInt(60)', label: 'Integer' },
  { K: 'String', gen: 'WORDS[rnd.nextInt(WORDS.length)]', label: 'String' },
];

const rotations = {
  id: 'llrb-rotations',
  topic: 'llrb',
  level: 2,
  title: 'Rotations & color flips',
  skill: 'The three local transformations',
  variants: KEYS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, KEYS, vi);
    const tests = J`        test("rotateLeft on a small hand-built tree", () -> {
            LLRB<Integer, String> t = new LLRB<>();
            LLRB<Integer, String>.Node h = t.new Node(5, "h", LLRB.BLACK, 5);
            h.left = t.new Node(2, "a", LLRB.BLACK, 1);
            h.right = t.new Node(8, "x", LLRB.RED, 3);
            h.right.left = t.new Node(7, "b", LLRB.BLACK, 1);
            h.right.right = t.new Node(9, "c", LLRB.BLACK, 1);
            LLRB<Integer, String>.Node r = t.rotateLeft(h);
            check(r != null, "rotateLeft returned null");
            eq("shape after rotateLeft (R = red link)", "[8, 5(R), 9, 2, 7]", shape(r));
            eq("new root size", 5, r.size);
            eq("old root (now left child) size", 3, r.left.size);
        });
        test("rotateRight on a small hand-built tree", () -> {
            LLRB<Integer, String> t = new LLRB<>();
            LLRB<Integer, String>.Node h = t.new Node(8, "h", LLRB.RED, 5);
            h.left = t.new Node(5, "x", LLRB.RED, 3);
            h.right = t.new Node(9, "c", LLRB.BLACK, 1);
            h.left.left = t.new Node(2, "a", LLRB.BLACK, 1);
            h.left.right = t.new Node(7, "b", LLRB.BLACK, 1);
            LLRB<Integer, String>.Node r = t.rotateRight(h);
            check(r != null, "rotateRight returned null");
            eq("shape after rotateRight (R = red link)", "[5(R), 2, 8(R), null, null, 7, 9]", shape(r));
            eq("new root size", 5, r.size);
            eq("old root (now right child) size", 3, r.right.size);
        });
        test("flipColors on a node with two red children", () -> {
            LLRB<Integer, String> t = new LLRB<>();
            LLRB<Integer, String>.Node h = t.new Node(5, "h", LLRB.BLACK, 3);
            h.left = t.new Node(2, "a", LLRB.RED, 1);
            h.right = t.new Node(8, "b", LLRB.RED, 1);
            t.flipColors(h);
            eq("shape after flipColors", "[5(R), 2, 8]", shape(h));
        });
        for (int round = 0; round < 6; round++) {
            final List<${v.K}> ks = new ArrayList<>();
            int n = 2 + rnd.nextInt(18);
            for (int i = 0; i < n; i++) ks.add(${v.gen});
            test("full insertion using your helpers: put " + show(ks), () -> {
                LLRB<${v.K}, String> t = new LLRB<>();
                Ref<${v.K}> ref = new Ref<>();
                for (${v.K} k : ks) { t.put(k, "v"); ref.put(k); }
                eq("tree shape (R = red link)", ref.shape(), shape(t.root));
                sizeCheck(t.root);
            });
        }`;
    return {
      title: `LLRB: rotations & flipColors (${v.label} keys)`,
      story: 'A left-leaning red-black BST stays balanced with three small local moves. Each one is a few pointer changes that keep the in-order sequence the same. <code>put</code> is already written and uses your helpers.',
      task: 'Implement <code>rotateLeft</code>, <code>rotateRight</code> and <code>flipColors</code> in <code>LLRB.java</code>. Rotations must hand the old root’s color to the new root, color the old root RED, and fix both <code>size</code> fields. In test output, <code>(R)</code> marks a node whose link from its parent is red.',
      examples: [['rotateLeft(5 with red right child 8)', '8 becomes the root; 5 is its red left child'], ['flipColors(h) with two red children', 'h red, both children black']],
      file: { name: 'LLRB.java', code: llrbClass(STUB.rotations, M.put) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: HELPERS }),
      solution: llrbClass(M.rotations, M.put),
      hints: [
        'rotateLeft: <code>Node x = h.right;</code> The middle subtree <code>x.left</code> moves over to become <code>h.right</code>. Then <code>x.left = h</code>.',
        'Colors: <code>x.color = h.color; h.color = RED;</code> Sizes: x now roots the whole subtree, so <code>x.size = h.size</code>. Recompute h’s size from its new children.',
        'flipColors only changes three color fields; no links move.',
      ],
      approach: ['Draw h, x and the three subtrees (call them A, B, C) before and after the rotation.', 'Write one line per link that changes, then the color lines, then the size lines.', 'Check that the in-order order (A, h, B, x, C) is the same before and after.'],
    };
  },
};

/* ------------------------------------------------------------------ put */

const put = {
  id: 'llrb-put',
  topic: 'llrb',
  level: 3,
  title: 'LLRB insertion',
  skill: 'Balanced put',
  variants: KEYS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, KEYS, vi);
    const tests = J`        for (int round = 0; round < 8; round++) {
            final List<${v.K}> ks = new ArrayList<>();
            int n = round == 0 ? 1 : round == 1 ? 3 : 2 + rnd.nextInt(22);
            for (int i = 0; i < n; i++) ks.add(${v.gen});
            if (round == 2) { ks.clear(); ${v.K === 'Integer' ? 'for (int i = 1; i <= 12; i++) ks.add(i);' : 'ks.addAll(new TreeSet<>(Arrays.asList(WORDS)));'} }
            test("put " + show(ks) + (round == 2 ? "  (ascending order: a plain BST would become a stick)" : ""), () -> {
                LLRB<${v.K}, String> t = new LLRB<>();
                Ref<${v.K}> ref = new Ref<>();
                for (${v.K} k : ks) { t.put(k, "v" + k); ref.put(k); }
                eq("tree shape (R = red link)", ref.shape(), shape(t.root));
                eq("size()", new TreeSet<>(ks).size(), t.size());
                sizeCheck(t.root);
                check(t.root == null || !t.root.color, "the root must be BLACK after every put");
                for (${v.K} k : ks) eq("get(" + show(k) + ")", "v" + k, t.get(k));
            });
        }`;
    return {
      title: `LLRB: put (${v.label} keys)`,
      story: 'This is the heart of the red-black BST: an ordinary BST insert, plus three checks on the way back up the recursion. They keep the tree a perfect mirror of a 2-3 tree, so it is always balanced.',
      task: 'Write <code>put</code> in <code>LLRB.java</code> (public method + private recursive helper). New nodes are RED; equal keys replace the value; the root is BLACK after every insertion; sizes stay correct. The rotation/flip helpers are provided. The resulting tree must match the reference exactly.',
      examples: [['put 1, 2, 3 (ascending)', 'root 2 (black) with children 1 and 3 (both black)'], ['put 5, 3', 'root 5 (black) with red left child 3']],
      file: { name: 'LLRB.java', code: llrbClass(M.rotations, STUB.put) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: HELPERS }),
      solution: llrbClass(M.rotations, M.put),
      hints: [
        'Start from BST put. Base case: <code>return new Node(key, val, RED, 1);</code>',
        'After the recursive call and before returning, do the three checks IN THIS ORDER, each as its own <code>if</code> (not else-if):<br><code>if (isRed(h.right) &amp;&amp; !isRed(h.left)) h = rotateLeft(h);</code><br><code>if (isRed(h.left) &amp;&amp; isRed(h.left.left)) h = rotateRight(h);</code><br><code>if (isRed(h.left) &amp;&amp; isRed(h.right)) flipColors(h);</code>',
        'Then <code>h.size = 1 + size(h.left) + size(h.right); return h;</code>. In the public put, set <code>root.color = BLACK</code> after the call.',
      ],
      approach: ['Insert 1, 2, 3 by hand and apply the three checks at each level as the recursion returns.', 'Notice how each check fixes the situation the previous one might create.', 'Remember that rotations RETURN the new subtree root, so always reassign h.'],
    };
  },
};

/* ------------------------------------------------------------------ inspections */

const INSPECT = [
  {
    name: 'countRed',
    sig: 'public int countRed()',
    doc: 'Returns the number of red links (red nodes) in the tree.\nEach red link glues two keys into one 3-node of the 2-3 tree.',
    body: J`        return countRed(root);
    }

    private int countRed(Node x) {
        if (x == null) return 0;
        return (isRed(x) ? 1 : 0) + countRed(x.left) + countRed(x.right);`,
    expect: 'refRed(t.root)',
    call: 't.countRed()',
    corrupt: false,
  },
  {
    name: 'blackHeight',
    sig: 'public int blackHeight()',
    doc: 'Returns the number of BLACK nodes on the path from the root to the leftmost null link\n(the root counts, since it is black). Empty tree: 0. In a valid LLRB this is the height of the\nequivalent 2-3 tree plus one, and it is the same for every root-to-null path.',
    body: J`        int count = 0;
        for (Node x = root; x != null; x = x.left) {
            if (!isRed(x)) count++;
        }
        return count;`,
    expect: 'refBlackHeight(t.root)',
    call: 't.blackHeight()',
    corrupt: false,
  },
  {
    name: 'redKeys',
    sig: 'public ArrayList<Key> redKeys()',
    doc: 'Returns the keys of all RED nodes in ascending order.\n(These are the smaller keys of each 3-node.)',
    body: J`        ArrayList<Key> out = new ArrayList<>();
        redKeys(root, out);
        return out;
    }

    private void redKeys(Node x, ArrayList<Key> out) {
        if (x == null) return;
        redKeys(x.left, out);
        if (isRed(x)) out.add(x.key);
        redKeys(x.right, out);`,
    expect: 'refRedKeys(t.root)',
    call: 't.redKeys()',
    corrupt: false,
  },
  {
    name: 'is23',
    sig: 'public boolean is23()',
    doc: 'Returns true if no node has a RED right child, and no RED node has a RED left child\n(no two red links in a row). The root\'s own color is ignored. The tests deliberately\nbreak some trees.',
    body: J`        return is23(root);
    }

    private boolean is23(Node x) {
        if (x == null) return true;
        if (isRed(x.right)) return false;
        if (isRed(x) && isRed(x.left)) return false;
        return is23(x.left) && is23(x.right);`,
    expect: 'refIs23(t.root)',
    call: 't.is23()',
    corrupt: true,
  },
  {
    name: 'isBalanced',
    sig: 'public boolean isBalanced()',
    doc: 'Returns true if every path from the root to a null link contains the same number of\nBLACK nodes (perfect black balance). The tests deliberately break some trees.',
    body: J`        int black = 0;
        for (Node x = root; x != null; x = x.left) if (!isRed(x)) black++;
        return isBalanced(root, black);
    }

    private boolean isBalanced(Node x, int black) {
        if (x == null) return black == 0;
        if (!isRed(x)) black--;
        return isBalanced(x.left, black) && isBalanced(x.right, black);`,
    expect: 'refBalanced(t.root)',
    call: 't.isBalanced()',
    corrupt: true,
  },
];

const INSPECT_HELPERS = J`
    static <K extends Comparable<K>, V> int refRed(LLRB<K, V>.Node x) { return x == null ? 0 : (x.color ? 1 : 0) + refRed(x.left) + refRed(x.right); }
    static <K extends Comparable<K>, V> int refBlackHeight(LLRB<K, V>.Node x) { int c = 0; for (; x != null; x = x.left) if (!x.color) c++; return c; }
    static <K extends Comparable<K>, V> List<K> refRedKeys(LLRB<K, V>.Node x) { List<K> out = new ArrayList<>(); collectRed(x, out); return out; }
    static <K extends Comparable<K>, V> void collectRed(LLRB<K, V>.Node x, List<K> out) { if (x == null) return; collectRed(x.left, out); if (x.color) out.add(x.key); collectRed(x.right, out); }
    static <K extends Comparable<K>, V> boolean refIs23(LLRB<K, V>.Node x) {
        if (x == null) return true;
        if (x.right != null && x.right.color) return false;
        if (x.color && x.left != null && x.left.color) return false;
        return refIs23(x.left) && refIs23(x.right);
    }
    static <K extends Comparable<K>, V> int blacks(LLRB<K, V>.Node x) {
        if (x == null) return 0;
        int l = blacks(x.left), r = blacks(x.right);
        if (l < 0 || r < 0 || l != r) return -1;
        return l + (x.color ? 0 : 1);
    }
    static <K extends Comparable<K>, V> boolean refBalanced(LLRB<K, V>.Node x) { return blacks(x) >= 0; }
    static <K extends Comparable<K>, V> void nodes(LLRB<K, V>.Node x, List<LLRB<K, V>.Node> out) { if (x == null) return; out.add(x); nodes(x.left, out); nodes(x.right, out); }
`;

const inspect = {
  id: 'llrb-inspect',
  topic: 'llrb',
  level: 2,
  title: 'Inspecting an LLRB',
  skill: 'Reading the 2-3 tree inside',
  variants: INSPECT.length,
  generate(rng, seed, vi) {
    const v = choose(rng, INSPECT, vi);
    const tests = J`        for (int round = 0; round < 12; round++) {
            final List<Integer> ks = new ArrayList<>();
            int n = round == 0 ? 0 : 1 + rnd.nextInt(25);
            for (int i = 0; i < n; i++) ks.add(rnd.nextInt(80));
            final LLRB<Integer, String> t = new LLRB<>();
            for (int k : ks) t.put(k, "v");
            String note = "";
            if (${v.corrupt ? 'true' : 'false'} && n > 0 && rnd.nextInt(3) > 0) {
                List<LLRB<Integer, String>.Node> all = new ArrayList<>();
                nodes(t.root, all);
                LLRB<Integer, String>.Node victim = all.get(rnd.nextInt(all.size()));
                victim.color = !victim.color;
                note = "  (then the color of node " + victim.key + " was flipped on purpose)";
            }
            final String label = "${v.name}() after putting " + show(ks) + note;
            test(label, () -> eq(label + "\n  tree: " + shape(t.root), ${v.expect}, ${v.call}));
        }`;
    return {
      title: `LLRB: ${v.name}()`,
      story: 'An LLRB is a 2-3 tree in disguise: every red link glues two keys into one 3-node. Being able to "see" the 2-3 tree inside the red-black tree is the key to reasoning about it.',
      task: `Add <code>${v.sig.replace('public ', '')}</code> to <code>LLRB.java</code> (everything else is already implemented). ${v.doc.split('\n').join(' ')}`,
      examples: [['put 5, 3 then ' + v.name + '()', v.name === 'countRed' ? '1' : v.name === 'blackHeight' ? '1' : v.name === 'redKeys' ? '[3]' : 'true']],
      file: { name: 'LLRB.java', code: llrbClass(M.rotations, M.put, `    /**\n${v.doc.split('\n').map((l) => `     * ${l}`).join('\n')}\n     */\n    ${v.sig} {\n        // TODO (tip: a private recursive helper on Node usually makes this easy)\n        ${v.sig.includes('boolean') ? 'return false;' : v.sig.includes('ArrayList') ? 'return new ArrayList<>();' : 'return 0;'}\n    }`) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: HELPERS + INSPECT_HELPERS }),
      solution: llrbClass(M.rotations, M.put, `    ${v.sig} {\n${v.body}\n    }`),
      hints: [
        '<code>isRed(x)</code> already handles null for you.',
        'Most of these are a plain tree recursion: handle null, check this node, combine the left and right results.',
        v.corrupt ? 'The tests flip colors on purpose. Return false as soon as you find ANY violation, and do not assume the tree is valid.' : 'Red nodes are always left children in a valid LLRB, but your code does not need to rely on that.',
      ],
      approach: ['Use the LLRB lab to build a tree, and look at the red-black view and the 2-3 view side by side.', 'Translate the definition into a check you can do at a single node.', 'Recurse over the whole tree.'],
    };
  },
};

export default [rotations, put, inspect];
