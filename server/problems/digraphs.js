// Directed graphs: DFS orders, reachability, cycle detection, topological sort and symbol digraphs.
import { J, harness, stub, choose } from './kit.js';

export const DIGRAPH = J`import java.util.*;

/** Provided. A directed graph backed by adjacency lists (edges kept in insertion order). Do not change this file. */
public class Digraph {
    private final int V;
    private int E;
    private final ArrayList<ArrayList<Integer>> adj = new ArrayList<>();

    public Digraph(int V) {
        this.V = V;
        for (int v = 0; v < V; v++) adj.add(new ArrayList<>());
    }

    public int V() { return V; }

    public int E() { return E; }

    /** Adds the directed edge v->w (appended to the end of v's list). */
    public void addEdge(int v, int w) {
        adj.get(v).add(w);
        E++;
    }

    /** Vertices w such that there is an edge v->w, in the order the edges were added. */
    public Iterable<Integer> adj(int v) { return adj.get(v); }

    public int outdegree(int v) { return adj.get(v).size(); }

    /** Returns a copy of this digraph with every edge reversed. */
    public Digraph reverse() {
        Digraph r = new Digraph(V);
        for (int v = 0; v < V; v++) for (int w : adj.get(v)) r.addEdge(w, v);
        return r;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (int v = 0; v < V; v++) sb.append(v).append("->").append(adj.get(v)).append(v + 1 < V ? ", " : "");
        return "{" + sb + "}";
    }
}
`;

const HELPERS = J`
    static Digraph randomDigraph(Random r, int V, int edges, boolean acyclic) {
        Digraph g = new Digraph(V);
        int[] perm = new int[V];
        for (int i = 0; i < V; i++) perm[i] = i;
        for (int i = V - 1; i > 0; i--) { int j = r.nextInt(i + 1); int t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        Set<Long> seen = new HashSet<>();
        for (int i = 0; i < edges; i++) {
            int a = r.nextInt(V), b = r.nextInt(V);
            if (a == b) continue;
            if (acyclic) { int pa = perm[a], pb = perm[b]; if (pa > pb) { int t = a; a = b; b = t; } }
            if (seen.add((long) a * 1000 + b)) g.addEdge(a, b);
        }
        return g;
    }

    static void refOrder(Digraph g, int v, boolean[] marked, List<Integer> pre, List<Integer> post) {
        marked[v] = true;
        pre.add(v);
        for (int w : g.adj(v)) if (!marked[w]) refOrder(g, w, marked, pre, post);
        post.add(v);
    }

    static boolean refCycle(Digraph g) {
        int[] state = new int[g.V()];
        for (int s = 0; s < g.V(); s++) if (state[s] == 0 && cyc(g, s, state)) return true;
        return false;
    }

    static boolean cyc(Digraph g, int v, int[] state) {
        state[v] = 1;
        for (int w : g.adj(v)) { if (state[w] == 1) return true; if (state[w] == 0 && cyc(g, w, state)) return true; }
        state[v] = 2;
        return false;
    }
`;

/* ------------------------------------------------------------------ DFS orders */

const ORDER_HEAD = J`import java.util.*;

public class DepthFirstOrder {
    private boolean[] marked;
    private ArrayList<Integer> pre = new ArrayList<>();          // vertices in preorder
    private ArrayList<Integer> post = new ArrayList<>();         // vertices in postorder
`;

const ORDER_FULL = J`    public DepthFirstOrder(Digraph G) {
        marked = new boolean[G.V()];
        for (int v = 0; v < G.V(); v++) {
            if (!marked[v]) dfs(G, v);
        }
    }

    private void dfs(Digraph G, int v) {
        marked[v] = true;
        pre.add(v);
        for (int w : G.adj(v)) {
            if (!marked[w]) dfs(G, w);
        }
        post.add(v);
    }

    public ArrayList<Integer> pre() {
        return pre;
    }

    public ArrayList<Integer> post() {
        return post;
    }

    public ArrayList<Integer> reversePost() {
        ArrayList<Integer> reversed = new ArrayList<>(post);
        Collections.reverse(reversed);
        return reversed;
    }
}
`;

const ORDER_STUB = J`    /** Runs DFS from every unmarked vertex, in order 0, 1, ..., V-1. */
    public DepthFirstOrder(Digraph G) {
        marked = new boolean[G.V()];
        // TODO
    }

    // TODO: private void dfs(Digraph G, int v)
    //   record v in pre BEFORE visiting its neighbours, and in post AFTER all of them are done

    /** Vertices in the order DFS calls began. */
    public ArrayList<Integer> pre() {
        return pre;
    }

    /** Vertices in the order DFS calls finished. */
    public ArrayList<Integer> post() {
        return post;
    }

    /** Postorder reversed. For a DAG this is a topological order. */
    public ArrayList<Integer> reversePost() {
        // TODO
        return new ArrayList<>();
    }
}
`;

const REACH = {
  sig: 'public static ArrayList<Integer> reachable(Digraph G, int s)',
  doc: 'Returns every vertex reachable from s by following edge directions (s included), sorted ascending.',
  body: J`        boolean[] marked = new boolean[G.V()];
        visit(G, s, marked);
        ArrayList<Integer> out = new ArrayList<>();
        for (int v = 0; v < G.V(); v++) {
            if (marked[v]) out.add(v);
        }
        return out;
    }

    private static void visit(Digraph G, int v, boolean[] marked) {
        marked[v] = true;
        for (int w : G.adj(v)) {
            if (!marked[w]) visit(G, w, marked);
        }`,
};

const ORDERS = [
  { key: 'order', title: 'pre, post & reverse postorder' },
  { key: 'reach', title: 'reachability' },
];

const orders = {
  id: 'digraph-order',
  topic: 'digraphs',
  level: 2,
  title: 'DFS orders',
  skill: 'Preorder, postorder, reachability',
  variants: ORDERS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, ORDERS, vi);
    if (v.key === 'reach') {
      const tests = J`        for (int t = 0; t < 10; t++) {
            final int V = 1 + rnd.nextInt(10);
            final Digraph g = randomDigraph(rnd, V, rnd.nextInt(2 * V + 1), false);
            final int s = rnd.nextInt(V);
            boolean[] m = new boolean[V];
            refOrder(g, s, m, new ArrayList<>(), new ArrayList<>());
            final List<Integer> expected = new ArrayList<>();
            for (int x = 0; x < V; x++) if (m[x]) expected.add(x);
            test("reachable(" + g + ", " + s + ")", () -> eq("reachable from " + s, expected, Solution.reachable(g, s)));
        }`;
      return {
        title: 'Digraph: reachability',
        story: 'In a digraph an edge is a one-way street. "Which vertices can I get to from s?" is answered by the same DFS as before, but it only follows edges forward.',
        task: `Implement <code>${REACH.sig.replace('public static ', '')}</code>. ${REACH.doc}`,
        examples: [['{0->[1], 1->[2], 2->[], 3->[0]}, s = 0', '[0, 1, 2]  (3 points TO 0, but 0 cannot reach 3)']],
        file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(REACH.sig, REACH.doc)}\n}\n` },
        provided: [{ name: 'Digraph.java', code: DIGRAPH }],
        harness: harness({ seed, body: tests, helpers: HELPERS }),
        solution: `import java.util.*;\n\npublic class Solution {\n\n    ${REACH.sig} {\n${REACH.body}\n    }\n}\n`,
        hints: ['Run a marking DFS from s using <code>G.adj(v)</code>.', 'Afterwards loop v = 0..V−1 and collect the marked ones, which gives sorted order for free.'],
        approach: ['Trace the example and notice which edges you are NOT allowed to use.', 'Reuse the undirected DFS code; nothing else changes.'],
      };
    }
    const tests = J`        for (int t = 0; t < 10; t++) {
            final int V = 1 + rnd.nextInt(10);
            final Digraph g = randomDigraph(rnd, V, rnd.nextInt(2 * V + 1), rnd.nextBoolean());
            final List<Integer> pre = new ArrayList<>(), post = new ArrayList<>();
            boolean[] m = new boolean[V];
            for (int s = 0; s < V; s++) if (!m[s]) refOrder(g, s, m, pre, post);
            final List<Integer> rev = new ArrayList<>(post);
            Collections.reverse(rev);
            test("DepthFirstOrder(" + g + ")", () -> {
                DepthFirstOrder d = new DepthFirstOrder(g);
                eq("pre()", pre, d.pre());
                eq("post()", post, d.post());
                eq("reversePost()", rev, d.reversePost());
            });
        }`;
    return {
      title: 'Digraph: pre, post & reverse postorder',
      story: 'The same DFS, watched at two moments: when a call <em>starts</em> (preorder) and when it <em>finishes</em> (postorder). Reverse postorder is the famous one: in a DAG, it is a topological order.',
      task: 'Complete <code>DepthFirstOrder.java</code>: the constructor runs DFS from every unmarked vertex in order 0..V−1, a private <code>dfs</code> records preorder and postorder, and <code>reversePost()</code> returns the postorder reversed.',
      examples: [['{0->[1, 2], 1->[3], 2->[3], 3->[]}', 'pre [0, 1, 3, 2], post [3, 1, 2, 0], reversePost [0, 2, 1, 3]']],
      file: { name: 'DepthFirstOrder.java', code: `${ORDER_HEAD}\n${ORDER_STUB}` },
      provided: [{ name: 'Digraph.java', code: DIGRAPH }],
      harness: harness({ seed, body: tests, helpers: HELPERS }),
      solution: `${ORDER_HEAD}\n${ORDER_FULL}`,
      hints: ['In dfs: mark v and add it to pre, recurse into unmarked neighbours, then add v to post.', 'Constructor: <code>for (int v = 0; v &lt; G.V(); v++) if (!marked[v]) dfs(G, v);</code>', 'reversePost: copy post into a new list and <code>Collections.reverse</code> it (or push onto a Stack and pop).'],
      approach: ['Trace the example with a call stack drawing: write a vertex in pre when its box opens and in post when it closes.', 'Notice that a vertex finishes only after everything it points to has finished.'],
    };
  },
};

/* ------------------------------------------------------------------ cycles & topological sort */

const TOPO = [
  {
    name: 'hasCycle',
    sig: 'public static boolean hasCycle(Digraph G)',
    doc: 'Returns true if the digraph has a directed cycle.\nKeep an onStack[] array: reaching a vertex that is still on the current DFS path means a cycle.',
    examples: [['{0->[1], 1->[2], 2->[0]}', 'true'], ['{0->[1, 2], 1->[2], 2->[]}', 'false  (2 is reached twice, but never while on the stack)']],
    body: J`        boolean[] marked = new boolean[G.V()];
        boolean[] onStack = new boolean[G.V()];
        for (int s = 0; s < G.V(); s++) {
            if (!marked[s] && cycleFrom(G, s, marked, onStack)) return true;
        }
        return false;
    }

    private static boolean cycleFrom(Digraph G, int v, boolean[] marked, boolean[] onStack) {
        marked[v] = true;
        onStack[v] = true;
        for (int w : G.adj(v)) {
            if (onStack[w]) return true;
            if (!marked[w] && cycleFrom(G, w, marked, onStack)) return true;
        }
        onStack[v] = false;
        return false;`,
    expected: 'refCycle(g)',
    hints: ['A marked vertex is not enough evidence: in a digraph you can reach a vertex twice without a cycle.', 'Set <code>onStack[v] = true</code> when dfs(v) starts and back to false when it finishes. An edge to a vertex with onStack true closes a cycle.'],
  },
  {
    name: 'topologicalOrder',
    sig: 'public static ArrayList<Integer> topologicalOrder(Digraph G)',
    doc: 'If G is a DAG, returns its topological order computed as the REVERSE POSTORDER of a DFS that\nstarts from vertices 0, 1, ..., V-1 in order. If G has a directed cycle, returns null.',
    examples: [['{0->[1, 2], 1->[3], 2->[3], 3->[]}', '[0, 2, 1, 3]'], ['{0->[1], 1->[0]}', 'null']],
    body: J`        if (hasCycle(G)) return null;
        boolean[] marked = new boolean[G.V()];
        ArrayList<Integer> post = new ArrayList<>();
        for (int s = 0; s < G.V(); s++) {
            if (!marked[s]) dfs(G, s, marked, post);
        }
        Collections.reverse(post);
        return post;
    }

    private static void dfs(Digraph G, int v, boolean[] marked, ArrayList<Integer> post) {
        marked[v] = true;
        for (int w : G.adj(v)) {
            if (!marked[w]) dfs(G, w, marked, post);
        }
        post.add(v);
    }

    private static boolean hasCycle(Digraph G) {
        int[] state = new int[G.V()];  // 0 = new, 1 = on stack, 2 = done
        for (int s = 0; s < G.V(); s++) {
            if (state[s] == 0 && cycle(G, s, state)) return true;
        }
        return false;
    }

    private static boolean cycle(Digraph G, int v, int[] state) {
        state[v] = 1;
        for (int w : G.adj(v)) {
            if (state[w] == 1) return true;
            if (state[w] == 0 && cycle(G, w, state)) return true;
        }
        state[v] = 2;
        return false;`,
    expected: 'refTopo(g)',
    hints: ['Two parts: (1) detect a cycle and return null; (2) otherwise run DFS from 0..V−1 collecting postorder, then reverse it.', 'Why reverse postorder? A vertex finishes only after everything it points to has finished, so reversing puts each vertex before all of its descendants.'],
  },
];

const topo = {
  id: 'digraph-topo',
  topic: 'digraphs',
  level: 2,
  title: 'Cycles & topological sort',
  skill: 'onStack[], reverse postorder',
  variants: TOPO.length,
  generate(rng, seed, vi) {
    const v = choose(rng, TOPO, vi);
    const tests = J`        for (int t = 0; t < 12; t++) {
            final int V = 1 + rnd.nextInt(10);
            Digraph built = randomDigraph(rnd, V, rnd.nextInt(2 * V + 1), t % 2 == 0);
            if (t % 4 == 1 && V > 1) {
                int a = rnd.nextInt(V), b = (a + 1 + rnd.nextInt(V - 1)) % V;
                built.addEdge(a, b);
                built.addEdge(b, a);
            }
            final Digraph g = built;
            final Object expected = ${v.expected};
            test("${v.name}(" + g + ")", () -> eq("${v.name}", expected, Solution.${v.name}(g)));
        }`;
    return {
      title: `Digraph: ${v.name}`,
      story: 'Scheduling problems are digraphs: an edge v→w means "v must come before w". A valid schedule exists exactly when the digraph has no directed cycle, and reverse postorder produces one.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'Digraph.java', code: DIGRAPH }],
      harness: harness({
        seed,
        body: tests,
        helpers: HELPERS + J`
    static List<Integer> refTopo(Digraph g) {
        if (refCycle(g)) return null;
        boolean[] m = new boolean[g.V()];
        List<Integer> post = new ArrayList<>();
        for (int s = 0; s < g.V(); s++) if (!m[s]) refOrder(g, s, m, new ArrayList<>(), post);
        Collections.reverse(post);
        return post;
    }
`,
      }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Draw the example and run DFS by hand, keeping the "current path" (the call stack) visible.', 'Decide what you record when a call starts and when it ends.', 'Loop over all start vertices so that disconnected parts are covered.'],
    };
  },
};

/* ------------------------------------------------------------------ symbol digraphs */

const SYMBOL = [
  {
    name: 'targets',
    sig: 'public static ArrayList<String> targets(List<String> names, List<String> edges, String name)',
    doc: 'names lists every job; job i becomes vertex i. Each edge looks like "A -> B" (job A feeds job B).\nBuild a Digraph using a HashMap from name to vertex, then return the names that `name` points to,\nin the order those edges were added.',
    examples: [['names [load, clean, train, report], edges ["load -> clean", "clean -> train", "clean -> report"], name "clean"', '["train", "report"]']],
    body: J`        Digraph g = build(names, edges);
        ArrayList<String> out = new ArrayList<>();
        for (int w : g.adj(names.indexOf(name))) out.add(names.get(w));
        return out;`,
    expected: J`            List<String> e = new ArrayList<>();
            for (String[] p : pairs) if (p[0].equals(query)) e.add(p[1]);
            final Object expected = e;`,
  },
  {
    name: 'inDegrees',
    sig: 'public static HashMap<String, Integer> inDegrees(List<String> names, List<String> edges)',
    doc: 'names lists every job; edges look like "A -> B". Returns, for EVERY job, how many edges point INTO it.\n(Tip: build the Digraph with a name -> vertex HashMap, then count, or use G.reverse().)',
    examples: [['names [a, b, c], edges ["a -> c", "b -> c"]', '{a=0, b=0, c=2}']],
    body: J`        Digraph g = build(names, edges);
        HashMap<String, Integer> result = new HashMap<>();
        for (String n : names) result.put(n, 0);
        for (int v = 0; v < g.V(); v++) {
            for (int w : g.adj(v)) result.put(names.get(w), result.get(names.get(w)) + 1);
        }
        return result;`,
    expected: J`            Map<String, Integer> e = new HashMap<>();
            for (String nm : names) e.put(nm, 0);
            for (String[] p : pairs) e.put(p[1], e.get(p[1]) + 1);
            final Object expected = e;`,
  },
  {
    name: 'downstream',
    sig: 'public static ArrayList<String> downstream(List<String> names, List<String> edges, String name)',
    doc: 'names lists every job; edges look like "A -> B". Returns every job reachable from `name` by\nfollowing edges (NOT including `name` itself), sorted alphabetically.',
    examples: [['edges ["load -> clean", "clean -> train", "clean -> report"], name "load"', '["clean", "report", "train"]']],
    body: J`        Digraph g = build(names, edges);
        boolean[] marked = new boolean[g.V()];
        int start = names.indexOf(name);
        visit(g, start, marked);
        ArrayList<String> out = new ArrayList<>();
        for (int v = 0; v < g.V(); v++) {
            if (marked[v] && v != start) out.add(names.get(v));
        }
        Collections.sort(out);
        return out;
    }

    private static void visit(Digraph g, int v, boolean[] marked) {
        marked[v] = true;
        for (int w : g.adj(v)) {
            if (!marked[w]) visit(g, w, marked);
        }`,
    expected: J`            Map<String, List<String>> out = new HashMap<>();
            for (String nm : names) out.put(nm, new ArrayList<>());
            for (String[] p : pairs) out.get(p[0]).add(p[1]);
            Set<String> reach = new HashSet<>(); Deque<String> st = new ArrayDeque<>(); st.push(query);
            while (!st.isEmpty()) { String x = st.pop(); for (String y : out.get(x)) if (reach.add(y)) st.push(y); }
            reach.remove(query);
            List<String> e = new ArrayList<>(reach); Collections.sort(e);
            final Object expected = e;`,
  },
];

const BUILD_HELPER = J`    private static Digraph build(List<String> names, List<String> edges) {
        HashMap<String, Integer> index = new HashMap<>();
        for (int i = 0; i < names.size(); i++) index.put(names.get(i), i);
        Digraph g = new Digraph(names.size());
        for (String edge : edges) {
            String[] parts = edge.split("->");
            g.addEdge(index.get(parts[0].trim()), index.get(parts[1].trim()));
        }
        return g;
    }`;

const symbol = {
  id: 'digraph-symbol',
  topic: 'digraphs',
  level: 2,
  title: 'Symbol digraphs',
  skill: 'Name ↔ vertex mapping',
  variants: SYMBOL.length,
  generate(rng, seed, vi) {
    const v = choose(rng, SYMBOL, vi);
    const call = v.name === 'inDegrees' ? 'Solution.inDegrees(names, edges)' : `Solution.${v.name}(names, edges, query)`;
    const tests = J`        String[] pool = {"load", "clean", "merge", "train", "test", "report", "deploy", "audit", "backup"};
        for (int t = 0; t < 10; t++) {
            List<String> shuffled = new ArrayList<>(Arrays.asList(pool));
            Collections.shuffle(shuffled, rnd);
            final List<String> names = new ArrayList<>(shuffled.subList(0, 2 + rnd.nextInt(7)));
            final List<String[]> pairs = new ArrayList<>();
            final List<String> edges = new ArrayList<>();
            Set<String> seen = new HashSet<>();
            int n = rnd.nextInt(2 * names.size());
            for (int i = 0; i < n; i++) {
                int a = rnd.nextInt(names.size()), b = rnd.nextInt(names.size());
                if (a >= b || !seen.add(a + ":" + b)) continue;
                pairs.add(new String[] {names.get(a), names.get(b)});
                edges.add(names.get(a) + " -> " + names.get(b));
            }
            final String query = names.get(rnd.nextInt(names.size()));
${v.expected}
            test("${v.name}(" + show(names) + ", " + show(edges) + ${v.name === 'inDegrees' ? '""' : '", \\"" + query + "\\""'} + ")", () -> eq("${v.name}", expected, ${call}));
        }`;
    return {
      title: `Symbol digraph: ${v.name}`,
      story: 'Real graphs have names, not numbers: job names, course codes, web pages. Graph algorithms work on integers 0..V−1, so the standard trick is a <code>HashMap&lt;String, Integer&gt;</code> from name to vertex, plus the names list to translate back.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'Digraph.java', code: DIGRAPH }],
      harness: harness({ seed, body: tests }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n\n${BUILD_HELPER}\n}\n`,
      hints: [
        'Write a helper that builds the Digraph: first map every name to its index in <code>names</code>, then for each edge split on <code>"->"</code>, trim both sides, look up both indices and call <code>addEdge</code>.',
        'Translate back with <code>names.get(w)</code>.',
        v.name === 'downstream' ? 'Run a marking DFS from the start vertex, collect the marked names except the start, and sort.' : 'Loop over the vertices and their adjacency lists to read the answer.',
      ],
      approach: ['Separate the problem into "build the graph" and "ask the graph a question".', 'Test the build step on its own by printing the Digraph (it has a toString).', 'Then answer the question using integer vertices, and translate the result back to names at the end.'],
    };
  },
};

export default [orders, topo, symbol];
