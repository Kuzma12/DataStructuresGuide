// Shared pieces for generated Java problems: the TestKit runtime, harness wrapper and starter helpers.

export const J = String.raw;

export const TESTKIT = J`import java.io.*;
import java.util.*;

public class TestKit {
    public interface Body { void run() throws Throwable; }

    static class Mismatch extends RuntimeException {
        Mismatch(String message) { super(message); }
    }

    private static final long LIMIT_MS = 3000;
    private static PrintWriter out;
    private static int passed = 0;
    private static int failed = 0;

    public static void start(String[] args) throws IOException {
        out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(args[0]), "UTF-8"), true);
    }

    public static void test(String name, Body body) {
        final Throwable[] error = new Throwable[1];
        Thread worker = new Thread(null, () -> {
            try { body.run(); } catch (Throwable t) { error[0] = t; }
        }, "test", 1L << 26);
        worker.setDaemon(true);
        worker.start();
        try { worker.join(LIMIT_MS); } catch (InterruptedException ignored) { }
        if (worker.isAlive()) {
            failed++;
            emit("TIMEOUT", name, "Still running after " + (LIMIT_MS / 1000) + " seconds. Look for a loop that never ends, or recursion that never reaches its base case.");
            out.println("ABORT");
            out.flush();
            System.out.flush();
            System.exit(0);
        }
        if (error[0] == null) { passed++; emit("PASS", name, ""); }
        else if (error[0] instanceof Mismatch) { failed++; emit("FAIL", name, error[0].getMessage()); }
        else { failed++; emit("ERROR", name, describe(error[0])); }
    }

    public static void finish() {
        out.println("END\t" + passed + "\t" + failed);
        out.flush();
        System.out.flush();
        System.exit(0);
    }

    public static void check(boolean condition, String message) {
        if (!condition) throw new Mismatch(message);
    }

    public static void eq(String what, Object expected, Object actual) {
        if (!same(expected, actual)) {
            throw new Mismatch(what + "\n  expected: " + show(expected) + "\n  but got:  " + show(actual));
        }
    }

    public static <T> List<T> listOf(Iterable<T> items) {
        List<T> list = new ArrayList<>();
        if (items != null) for (T item : items) list.add(item);
        return list;
    }

    static boolean same(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if ((a instanceof Double || a instanceof Float) && b instanceof Number) {
            return Math.abs(((Number) a).doubleValue() - ((Number) b).doubleValue()) < 1e-6;
        }
        if (a.getClass().isArray() && b.getClass().isArray()) {
            return Arrays.deepEquals(new Object[] { a }, new Object[] { b });
        }
        if (a instanceof List && b instanceof List) {
            List<?> x = (List<?>) a, y = (List<?>) b;
            if (x.size() != y.size()) return false;
            for (int i = 0; i < x.size(); i++) if (!same(x.get(i), y.get(i))) return false;
            return true;
        }
        return a.equals(b);
    }

    public static String show(Object o) {
        String s = render(o);
        return s.length() > 700 ? s.substring(0, 700) + " ..." : s;
    }

    private static String render(Object o) {
        if (o == null) return "null";
        if (o instanceof String) return "\"" + o + "\"";
        if (o instanceof Character) return "'" + o + "'";
        if (o instanceof int[]) return Arrays.toString((int[]) o);
        if (o instanceof double[]) return Arrays.toString((double[]) o);
        if (o instanceof boolean[]) return Arrays.toString((boolean[]) o);
        if (o instanceof Object[]) return render(Arrays.asList((Object[]) o));
        if (o instanceof Collection) {
            StringBuilder sb = new StringBuilder("[");
            for (Object item : (Collection<?>) o) {
                if (sb.length() > 1) sb.append(", ");
                sb.append(render(item));
            }
            return sb.append("]").toString();
        }
        if (o instanceof Map) {
            Map<String, String> sorted = new TreeMap<>();
            for (Map.Entry<?, ?> e : ((Map<?, ?>) o).entrySet()) sorted.put(render(e.getKey()), render(e.getValue()));
            return sorted.toString();
        }
        return String.valueOf(o);
    }

    private static String describe(Throwable t) {
        if (t instanceof StackOverflowError) {
            return "StackOverflowError: the recursion went too deep. Usually the base case is missing or never reached." + where(t);
        }
        String msg = t.getMessage();
        String s = t.getClass().getSimpleName() + (msg == null ? "" : ": " + msg);
        if (t instanceof NullPointerException && msg == null) s += " (a reference was null; check for null before reading its fields)";
        return s + where(t);
    }

    private static String where(Throwable t) {
        for (StackTraceElement e : t.getStackTrace()) {
            String file = e.getFileName();
            String cls = e.getClassName();
            if (file == null || file.equals("Main.java") || file.equals("TestKit.java")) continue;
            if (cls.startsWith("java.") || cls.startsWith("jdk.") || cls.startsWith("sun.")) continue;
            return "\n  at " + file + " line " + e.getLineNumber() + ", in " + e.getMethodName() + "()";
        }
        return "";
    }

    private static void emit(String status, String name, String message) {
        out.println(status + "\t" + esc(name) + "\t" + esc(message));
        out.flush();
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\n", "\\n").replace("\t", "\\t").replace("\r", "");
    }
}
`;

/** Wraps test statements into a Main class that inherits the TestKit assertions. */
export function harness({ seed, body, helpers = '', imports = '' }) {
  return J`import java.util.*;
${imports}
public class Main extends TestKit {
    public static void main(String[] args) throws Exception {
        start(args);
        final Random rnd = new Random(${String(seed)}L);
${body}
        finish();
    }
${helpers}
}
`;
}

export const TODO = '        // TODO: write your code here';

/** Indents every line of a block by n spaces (used to place method bodies inside classes). */
export function indent(text, n) {
  const pad = ' '.repeat(n);
  return text
    .split('\n')
    .map((l) => (l.trim() ? pad + l : l))
    .join('\n');
}

export function defaultReturn(type) {
  if (type === 'void') return '';
  if (type === 'boolean') return '        return false;';
  if (type === 'double') return '        return 0.0;';
  if (type === 'long') return '        return 0L;';
  if (type === 'int' || type === 'char') return '        return 0;';
  return '        return null;';
}

/** Builds a stub method from a signature like "public static int size(TreeNode root)". */
export function stub(signature, doc) {
  let rest = signature.replace(/^((public|private|protected|static)\s+)+/, '');
  if (rest.startsWith('<')) {
    let depth = 0;
    let i = 0;
    for (; i < rest.length; i++) {
      if (rest[i] === '<') depth++;
      else if (rest[i] === '>' && --depth === 0) break;
    }
    rest = rest.slice(i + 1).trim();
  }
  const type = rest.split(/\s+/)[0];
  const ret = defaultReturn(type);
  const lines = [`    /**`, ...doc.split('\n').map((l) => `     * ${l}`), `     */`, `    ${signature} {`, TODO];
  if (ret) lines.push(ret);
  lines.push('    }');
  return lines.join('\n');
}

export function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export const TREE_NODE = J`/** Provided. A node in a binary tree of ints. Do not change this file. */
public class TreeNode {
    int val;
    TreeNode left, right;

    TreeNode(int val) {
        this.val = val;
    }

    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
`;

/** Java helpers for building random int trees and printing them in level order. */
export const TREE_HELPERS = J`
    static TreeNode randomTree(Random r, int n, int maxVal) {
        if (n == 0) return null;
        int leftSize = r.nextInt(n);
        TreeNode node = new TreeNode(r.nextInt(maxVal + 1));
        node.left = randomTree(r, leftSize, maxVal);
        node.right = randomTree(r, n - 1 - leftSize, maxVal);
        return node;
    }

    static TreeNode bstFrom(int[] keys) {
        TreeNode root = null;
        for (int k : keys) root = bstInsert(root, k);
        return root;
    }

    static TreeNode bstInsert(TreeNode x, int k) {
        if (x == null) return new TreeNode(k);
        if (k < x.val) x.left = bstInsert(x.left, k);
        else if (k > x.val) x.right = bstInsert(x.right, k);
        return x;
    }

    static int[] distinct(Random r, int n, int bound) {
        LinkedHashSet<Integer> set = new LinkedHashSet<>();
        while (set.size() < n) set.add(r.nextInt(bound));
        int[] a = new int[n];
        int i = 0;
        for (int v : set) a[i++] = v;
        return a;
    }

    static TreeNode copy(TreeNode x) {
        return x == null ? null : new TreeNode(x.val, copy(x.left), copy(x.right));
    }

    static String ser(TreeNode root) {
        if (root == null) return "[]";
        List<String> out = new ArrayList<>();
        Deque<TreeNode> q = new ArrayDeque<>();
        List<TreeNode> level = new ArrayList<>();
        level.add(root);
        while (!level.isEmpty()) {
            List<TreeNode> next = new ArrayList<>();
            for (TreeNode t : level) {
                if (t == null) { out.add("null"); continue; }
                out.add(String.valueOf(t.val));
                next.add(t.left);
                next.add(t.right);
            }
            boolean any = false;
            for (TreeNode t : next) if (t != null) any = true;
            level = any ? next : new ArrayList<>();
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(", ", out.subList(0, end)) + "]";
    }
`;

/** Picks a variant: forced index when given (used by the verifier), random otherwise. */
export function choose(rng, variants, index) {
  return index === undefined ? rng.pick(variants) : variants[index % variants.length];
}
