// Undirected graphs: adjacency matrix and list representations, DFS, BFS and classic applications.
import { J, harness, stub, choose } from './kit.js';

export const GRAPH_INTERFACE = J`/** Provided. The graph API used in this problem. Do not change this file. */
public interface Graph {
    int V();                       // number of vertices (named 0 .. V-1)
    int E();                       // number of distinct edges
    void addEdge(int v, int w);    // adds the undirected edge v-w
    Iterable<Integer> adj(int v);  // vertices adjacent to v
}
`;

export const LIST_GRAPH = J`import java.util.*;

/** Provided. A working adjacency-list graph (no self-loops, no parallel edges). Do not change this file. */
public class ListGraph implements Graph {
    private final int V;
    private int E;
    private final ArrayList<ArrayList<Integer>> adj = new ArrayList<>();

    public ListGraph(int V) {
        this.V = V;
        for (int v = 0; v < V; v++) adj.add(new ArrayList<>());
    }

    public int V() { return V; }

    public int E() { return E; }

    public void addEdge(int v, int w) {
        if (v == w || adj.get(v).contains(w)) return;
        adj.get(v).add(w);
        adj.get(w).add(v);
        E++;
    }

    public Iterable<Integer> adj(int v) { return adj.get(v); }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (int v = 0; v < V; v++) sb.append(v).append(": ").append(adj.get(v)).append(v + 1 < V ? ", " : "");
        return "{" + sb + "}";
    }
}
`;

/** Java helpers to build random graphs and reference traversals over the provided ListGraph. */
export const GRAPH_HELPERS = J`
    static ListGraph randomGraph(Random r, int V, int edges) {
        ListGraph g = new ListGraph(V);
        for (int i = 0; i < edges; i++) g.addEdge(r.nextInt(V), r.nextInt(V));
        return g;
    }

    static void refDfs(Graph g, int v, boolean[] marked, int[] edgeTo, List<Integer> order) {
        marked[v] = true;
        order.add(v);
        for (int w : g.adj(v)) {
            if (!marked[w]) { edgeTo[w] = v; refDfs(g, w, marked, edgeTo, order); }
        }
    }

    static void refBfs(Graph g, int s, boolean[] marked, int[] edgeTo, int[] distTo, List<Integer> order) {
        Deque<Integer> q = new ArrayDeque<>();
        marked[s] = true; distTo[s] = 0; q.add(s);
        while (!q.isEmpty()) {
            int v = q.poll();
            order.add(v);
            for (int w : g.adj(v)) {
                if (!marked[w]) { marked[w] = true; edgeTo[w] = v; distTo[w] = distTo[v] + 1; q.add(w); }
            }
        }
    }

    static List<Integer> refPath(int[] edgeTo, boolean[] marked, int s, int v) {
        if (!marked[v]) return null;
        LinkedList<Integer> path = new LinkedList<>();
        for (int x = v; x != s; x = edgeTo[x]) path.addFirst(x);
        path.addFirst(s);
        return path;
    }

    static int[] filled(int n, int value) { int[] a = new int[n]; Arrays.fill(a, value); return a; }
`;

/* ------------------------------------------------------------------ representations */

const MATRIX = {
  head: J`import java.util.*;

public class AdjacencyMatrixGraph implements Graph {
    private final int V;
    private int E;
    private final int[][] adj;  // adj[v][w] == 1 means v and w are adjacent

    public AdjacencyMatrixGraph(int V) {
        this.V = V;
        this.adj = new int[V][V];
    }

    public int V() {
        return V;
    }
`,
  full: {
    E: J`    public int E() {
        return E;
    }`,
    addEdge: J`    public void addEdge(int v, int w) {
        if (v == w || adj[v][w] == 1) return;
        adj[v][w] = 1;
        adj[w][v] = 1;
        E++;
    }`,
    adj: J`    public Iterable<Integer> adj(int v) {
        ArrayList<Integer> out = new ArrayList<>();
        for (int w = 0; w < V; w++) {
            if (adj[v][w] == 1) out.add(w);
        }
        return out;
    }`,
    degree: J`    public int degree(int v) {
        int d = 0;
        for (int w = 0; w < V; w++) d += adj[v][w];
        return d;
    }`,
    removeEdge: J`    public void removeEdge(int v, int w) {
        if (adj[v][w] == 0) return;
        adj[v][w] = 0;
        adj[w][v] = 0;
        E--;
    }`,
  },
  stub: {
    E: J`    /** Returns the number of distinct edges in CONSTANT time (keep a counter; never scan the matrix). */
    public int E() {
        // TODO
        return 0;
    }`,
    addEdge: J`    /**
     * Adds the undirected edge v-w: set both adj[v][w] and adj[w][v].
     * Ignore self-loops (v == w) and edges that already exist (in either direction).
     */
    public void addEdge(int v, int w) {
        // TODO
    }`,
    adj: J`    /** Returns the neighbours of v in increasing order (scan row v of the matrix). */
    public Iterable<Integer> adj(int v) {
        // TODO
        return new ArrayList<>();
    }`,
    degree: J`    /** Returns the number of neighbours of v. */
    public int degree(int v) {
        // TODO
        return 0;
    }`,
    removeEdge: J`    /** Removes the edge v-w if it exists (both directions) and updates the edge count. */
    public void removeEdge(int v, int w) {
        // TODO
    }`,
  },
};

const LIST = {
  head: J`import java.util.*;

public class AdjacencyListGraph implements Graph {
    private final int V;
    private int E;
    private final ArrayList<Integer>[] adj;  // adj[v] lists the neighbours of v in insertion order

    @SuppressWarnings("unchecked")
    public AdjacencyListGraph(int V) {
        this.V = V;
        this.adj = (ArrayList<Integer>[]) new ArrayList[V];
        for (int v = 0; v < V; v++) adj[v] = new ArrayList<>();
    }

    public int V() {
        return V;
    }
`,
  full: {
    E: MATRIX.full.E,
    addEdge: J`    public void addEdge(int v, int w) {
        if (v == w || adj[v].contains(w)) return;
        adj[v].add(w);
        adj[w].add(v);
        E++;
    }`,
    adj: J`    public Iterable<Integer> adj(int v) {
        return adj[v];
    }`,
    degree: J`    public int degree(int v) {
        return adj[v].size();
    }`,
    removeEdge: J`    public void removeEdge(int v, int w) {
        if (!adj[v].contains(w)) return;
        adj[v].remove(Integer.valueOf(w));
        adj[w].remove(Integer.valueOf(v));
        E--;
    }`,
  },
  stub: {
    E: MATRIX.stub.E,
    addEdge: J`    /**
     * Adds the undirected edge v-w by appending w to the END of adj[v] and v to the END of adj[w].
     * Ignore self-loops (v == w) and edges that already exist (in either direction).
     */
    public void addEdge(int v, int w) {
        // TODO
    }`,
    adj: J`    /** Returns the neighbours of v in the order their edges were added. */
    public Iterable<Integer> adj(int v) {
        // TODO
        return new ArrayList<>();
    }`,
    degree: MATRIX.stub.degree,
    removeEdge: J`    /** Removes the edge v-w if it exists (from both lists) and updates the edge count. Careful: remove(int) removes by INDEX. */
    public void removeEdge(int v, int w) {
        // TODO
    }`,
  },
};

function representation(kind) {
  const R = kind === 'matrix' ? MATRIX : LIST;
  const cls = kind === 'matrix' ? 'AdjacencyMatrixGraph' : 'AdjacencyListGraph';
  const variants = [
    { key: 'basic', title: 'addEdge, E & adj', todo: ['E', 'addEdge', 'adj', 'degree'], remove: false },
    { key: 'remove', title: 'removing edges', todo: ['E', 'addEdge', 'adj', 'degree', 'removeEdge'], remove: true },
  ];
  return {
    id: `graph-${kind}`,
    topic: 'graphs',
    level: 1,
    title: kind === 'matrix' ? 'Adjacency matrix' : 'Adjacency list',
    skill: kind === 'matrix' ? 'V×V array of 0/1' : 'Array of lists',
    variants: variants.length,
    generate(rng, seed, vi) {
      const v = choose(rng, variants, vi);
      const parts = ['E', 'addEdge', 'adj', 'degree', ...(v.remove ? ['removeEdge'] : [])];
      const build = (useStub) => `${R.head}\n${parts.map((p) => (useStub && v.todo.includes(p) ? R.stub[p] : R.full[p])).join('\n\n')}\n}\n`;
      const tests = J`        for (int t = 0; t < 8; t++) {
            final int V = 1 + rnd.nextInt(9);
            final List<int[]> ops = new ArrayList<>();
            int n = t == 0 ? 0 : rnd.nextInt(3 * V + 2);
            for (int i = 0; i < n; i++) ops.add(new int[] {${v.remove ? 'rnd.nextInt(4) == 0 ? 1 : 0' : '0'}, rnd.nextInt(V), rnd.nextInt(V)});
            StringBuilder sb = new StringBuilder();
            for (int[] op : ops) sb.append(op[0] == 1 ? " remove " : " add ").append(op[1]).append("-").append(op[2]).append(";");
            final String label = "V=" + V + ":" + (ops.isEmpty() ? " no edges" : sb.toString());
            test(label, () -> {
                ${cls} g = new ${cls}(V);
                List<List<Integer>> model = new ArrayList<>();
                for (int i = 0; i < V; i++) model.add(new ArrayList<>());
                int edges = 0;
                for (int[] op : ops) {
                    int a = op[1], b = op[2];
                    if (op[0] == 0) {
                        g.addEdge(a, b);
                        if (a != b && !model.get(a).contains(b)) { model.get(a).add(b); model.get(b).add(a); edges++; }
                    }${v.remove ? ` else {
                        g.removeEdge(a, b);
                        if (model.get(a).contains(b)) { model.get(a).remove(Integer.valueOf(b)); model.get(b).remove(Integer.valueOf(a)); edges--; }
                    }` : ''}
                }
                eq("E()", edges, g.E());
                eq("V()", V, g.V());
                for (int x = 0; x < V; x++) {
                    List<Integer> expected = new ArrayList<>(model.get(x));
                    ${kind === 'matrix' ? 'Collections.sort(expected);' : ''}
                    eq("adj(" + x + ")", expected, listOf(g.adj(x)));
                    eq("degree(" + x + ")", expected.size(), g.degree(x));
                }
            });
        }`;
      return {
        title: `${kind === 'matrix' ? 'Adjacency matrix' : 'Adjacency list'}: ${v.title}`,
        story:
          kind === 'matrix'
            ? 'An adjacency matrix answers "are v and w adjacent?" instantly with <code>adj[v][w]</code>, but it uses V² space. That is fine for dense graphs and wasteful for sparse ones.'
            : 'An adjacency list stores only the edges that exist, so it uses space proportional to V + E. Neighbours come out in the order the edges were added, and that order decides the exact DFS/BFS sequence.',
        task: `Implement ${v.todo.map((p) => `<code>${p}</code>`).join(', ')} in <code>${cls}.java</code>. The graph is undirected, so adding v-w also adds w-v. Self-loops and duplicate edges (in either direction) are ignored. <code>E()</code> must run in constant time.${kind === 'list' ? ' New neighbours are appended to the END of the lists.' : ''}`,
        examples: [['V=4: add 0-1; add 1-0; add 2-2; add 3-1', `E() = 2, adj(1) = ${kind === 'matrix' ? '[0, 3]' : '[0, 3]'}, degree(2) = 0`]],
        file: { name: `${cls}.java`, code: build(true) },
        provided: [{ name: 'Graph.java', code: GRAPH_INTERFACE }],
        harness: harness({ seed, body: tests }),
        solution: build(false),
        hints:
          kind === 'matrix'
            ? ['Before adding, check <code>v == w || adj[v][w] == 1</code>. In either case, do nothing.', 'Set both cells and increment E exactly once per new edge.', '<code>adj(v)</code>: loop w from 0 to V − 1 and collect w where <code>adj[v][w] == 1</code>.']
            : ['Use <code>adj[v].contains(w)</code> to detect an existing edge.', 'Append with <code>adj[v].add(w)</code> and <code>adj[w].add(v)</code>, then increment E once.', '<code>adj(v)</code> can return the list itself.'],
        approach: ['Draw the matrix or lists for the example.', 'List every way a call to addEdge could be "fake": self-loop, repeat, or the reversed repeat.', 'Keep E correct incrementally, never by counting.'],
      };
    },
  };
}

/* ------------------------------------------------------------------ DFS */

const DFS_HEAD = J`import java.util.*;

public class DepthFirstPaths {
    final int s;
    boolean[] marked;                                // marked[v] = has v been reached?
    int[] edgeTo;                                    // edgeTo[v] = vertex we came from to reach v (-1 for s and unreached)
    ArrayList<Integer> order = new ArrayList<>();    // vertices in the order they were first reached

    public DepthFirstPaths(Graph G, int s) {
        this.s = s;
        marked = new boolean[G.V()];
        edgeTo = new int[G.V()];
        Arrays.fill(edgeTo, -1);
        dfs(G, s);
    }
`;

const DFS = {
  dfs: J`    private void dfs(Graph G, int v) {
        marked[v] = true;
        order.add(v);
        for (int w : G.adj(v)) {
            if (!marked[w]) {
                edgeTo[w] = v;
                dfs(G, w);
            }
        }
    }`,
  paths: J`    public boolean hasPathTo(int v) {
        return marked[v];
    }

    public ArrayList<Integer> pathTo(int v) {
        if (!hasPathTo(v)) return null;
        ArrayList<Integer> path = new ArrayList<>();
        for (int x = v; x != s; x = edgeTo[x]) path.add(x);
        path.add(s);
        Collections.reverse(path);
        return path;
    }`,
  dfsStub: J`    /**
     * Recursive depth-first search from v: mark v, record it in order, then for each neighbour w
     * (in adj order) that is not marked, set edgeTo[w] = v and recurse on w.
     */
    private void dfs(Graph G, int v) {
        // TODO
    }`,
  pathsStub: J`    /** Is there a path from s to v? */
    public boolean hasPathTo(int v) {
        // TODO
        return false;
    }

    /** Returns the vertices on the DFS path from s to v (s first, v last), or null if v is unreachable. */
    public ArrayList<Integer> pathTo(int v) {
        // TODO (tip: follow edgeTo[] backwards from v until you reach s, then reverse)
        return null;
    }`,
};

const DFSV = [
  { key: 'dfs', title: 'recursive DFS', todo: ['dfs'] },
  { key: 'paths', title: 'paths from edgeTo[]', todo: ['paths'] },
];

const dfs = {
  id: 'graph-dfs',
  topic: 'graphs',
  level: 2,
  title: 'Depth-first search',
  skill: 'marked[], edgeTo[], recursion',
  variants: DFSV.length,
  generate(rng, seed, vi) {
    const v = choose(rng, DFSV, vi);
    const build = (useStub) =>
      `${DFS_HEAD}\n${useStub && v.todo.includes('dfs') ? DFS.dfsStub : DFS.dfs}\n\n${useStub && v.todo.includes('paths') ? DFS.pathsStub : DFS.paths}\n}\n`;
    const tests = J`        for (int t = 0; t < 10; t++) {
            final int V = 1 + rnd.nextInt(10);
            final ListGraph g = randomGraph(rnd, V, rnd.nextInt(2 * V + 1));
            final int s = rnd.nextInt(V);
            final boolean[] marked = new boolean[V];
            final int[] edgeTo = filled(V, -1);
            final List<Integer> order = new ArrayList<>();
            refDfs(g, s, marked, edgeTo, order);
            test("DFS from " + s + " in graph " + g, () -> {
                DepthFirstPaths d = new DepthFirstPaths(g, s);
                eq("order (first-visit order)", order, d.order);
                eq("marked[]", marked, d.marked);
                eq("edgeTo[]", edgeTo, d.edgeTo);
                for (int x = 0; x < V; x++) {
                    eq("hasPathTo(" + x + ")", marked[x], d.hasPathTo(x));
                    eq("pathTo(" + x + ")", refPath(edgeTo, marked, s, x), d.pathTo(x));
                }
            });
        }`;
    return {
      title: `DFS: ${v.title}`,
      story: 'Depth-first search is "explore a maze with a ball of string". Go as deep as you can, and back up only when there is nowhere new to go. <code>edgeTo[]</code> is the string: it remembers how you reached each vertex, so you can retrace a path.',
      task: v.key === 'dfs'
        ? 'Implement the recursive <code>dfs</code> in <code>DepthFirstPaths.java</code>. It must fill <code>marked</code>, <code>edgeTo</code> and <code>order</code> exactly like the classic algorithm, visiting neighbours in <code>adj</code> order.'
        : 'Implement <code>hasPathTo</code> and <code>pathTo</code> in <code>DepthFirstPaths.java</code> (DFS is provided). <code>pathTo(v)</code> returns the path from s to v as a list starting with s, or <code>null</code> when v is unreachable. <code>pathTo(s)</code> is <code>[s]</code>.',
      examples: [['graph {0: [1, 2], 1: [0, 3], 2: [0], 3: [1]}, DFS from 0', 'order [0, 1, 3, 2], edgeTo [-1, 0, 0, 1], pathTo(3) = [0, 1, 3]']],
      file: { name: 'DepthFirstPaths.java', code: build(true) },
      provided: [{ name: 'Graph.java', code: GRAPH_INTERFACE }, { name: 'ListGraph.java', code: LIST_GRAPH }],
      harness: harness({ seed, body: tests, helpers: GRAPH_HELPERS }),
      solution: build(false),
      hints: v.key === 'dfs'
        ? ['First line of dfs: mark v. Second: <code>order.add(v)</code>.', 'Loop <code>for (int w : G.adj(v))</code>. For each unmarked w, record <code>edgeTo[w] = v</code> BEFORE recursing.', 'There is no explicit base case: the recursion stops when every neighbour is already marked.']
        : ['hasPathTo is just <code>marked[v]</code>.', 'Walk backwards: <code>for (int x = v; x != s; x = edgeTo[x]) path.add(x);</code> then add s.', 'The list is backwards (v first), so reverse it with <code>Collections.reverse</code>, or insert at the front as you go.'],
      approach: ['Trace the example graph by hand, writing the order and edgeTo as you go.', 'Make sure that you mark a vertex before exploring its neighbours.', 'Check the unreachable case.'],
    };
  },
};

/* ------------------------------------------------------------------ BFS */

const BFS_HEAD = J`import java.util.*;

public class BreadthFirstPaths {
    final int s;
    boolean[] marked;                                // marked[v] = has v been reached?
    int[] edgeTo;                                    // edgeTo[v] = previous vertex on a shortest path (-1 for s and unreached)
    int[] distTo;                                    // distTo[v] = number of edges on a shortest s-v path (-1 if unreached)
    ArrayList<Integer> order = new ArrayList<>();    // vertices in the order they are removed from the queue

    public BreadthFirstPaths(Graph G, int s) {
        this.s = s;
        marked = new boolean[G.V()];
        edgeTo = new int[G.V()];
        distTo = new int[G.V()];
        Arrays.fill(edgeTo, -1);
        Arrays.fill(distTo, -1);
        bfs(G, s);
    }
`;

const BFS = {
  bfs: J`    private void bfs(Graph G, int s) {
        Queue<Integer> queue = new LinkedList<>();
        marked[s] = true;
        distTo[s] = 0;
        queue.add(s);
        while (!queue.isEmpty()) {
            int v = queue.remove();
            order.add(v);
            for (int w : G.adj(v)) {
                if (!marked[w]) {
                    marked[w] = true;
                    edgeTo[w] = v;
                    distTo[w] = distTo[v] + 1;
                    queue.add(w);
                }
            }
        }
    }`,
  path: J`    public ArrayList<Integer> pathTo(int v) {
        if (!marked[v]) return null;
        ArrayList<Integer> path = new ArrayList<>();
        for (int x = v; x != s; x = edgeTo[x]) path.add(x);
        path.add(s);
        Collections.reverse(path);
        return path;
    }`,
  bfsStub: J`    /**
     * Breadth-first search from s using a Queue. Mark a vertex (and set edgeTo/distTo) when you ADD it
     * to the queue, not when you remove it. Append a vertex to order when you REMOVE it.
     */
    private void bfs(Graph G, int s) {
        // TODO
    }`,
  pathStub: J`    /** Returns a SHORTEST path from s to v (s first), or null if v is unreachable. */
    public ArrayList<Integer> pathTo(int v) {
        // TODO
        return null;
    }`,
};

const BFSV = [
  { key: 'bfs', title: 'queue-based BFS', todo: 'bfs' },
  { key: 'path', title: 'shortest paths', todo: 'path' },
];

const bfs = {
  id: 'graph-bfs',
  topic: 'graphs',
  level: 2,
  title: 'Breadth-first search',
  skill: 'Queue, distTo[], shortest paths',
  variants: BFSV.length,
  generate(rng, seed, vi) {
    const v = choose(rng, BFSV, vi);
    const build = (useStub) =>
      `${BFS_HEAD}\n${useStub && v.todo === 'bfs' ? BFS.bfsStub : BFS.bfs}\n\n${useStub && v.todo === 'path' ? BFS.pathStub : BFS.path}\n}\n`;
    const tests = J`        for (int t = 0; t < 10; t++) {
            final int V = 1 + rnd.nextInt(10);
            final ListGraph g = randomGraph(rnd, V, rnd.nextInt(2 * V + 1));
            final int s = rnd.nextInt(V);
            final boolean[] marked = new boolean[V];
            final int[] edgeTo = filled(V, -1), distTo = filled(V, -1);
            final List<Integer> order = new ArrayList<>();
            refBfs(g, s, marked, edgeTo, distTo, order);
            test("BFS from " + s + " in graph " + g, () -> {
                BreadthFirstPaths b = new BreadthFirstPaths(g, s);
                eq("order (queue removal order)", order, b.order);
                eq("marked[]", marked, b.marked);
                eq("edgeTo[]", edgeTo, b.edgeTo);
                eq("distTo[]", distTo, b.distTo);
                for (int x = 0; x < V; x++) eq("pathTo(" + x + ")", refPath(edgeTo, marked, s, x), b.pathTo(x));
            });
        }`;
    return {
      title: `BFS: ${v.title}`,
      story: 'Breadth-first search explores in rings: first everything 1 edge away, then 2 edges, and so on. That is why the first time BFS reaches a vertex, it has found a <strong>shortest</strong> path to it.',
      task: v.todo === 'bfs'
        ? 'Implement <code>bfs</code> in <code>BreadthFirstPaths.java</code>. Fill <code>marked</code>, <code>edgeTo</code>, <code>distTo</code> and <code>order</code>, visiting neighbours in <code>adj</code> order.'
        : 'Implement <code>pathTo</code> in <code>BreadthFirstPaths.java</code> (BFS is provided). Return a shortest path from s to v (s first) using <code>edgeTo</code>, or <code>null</code> if v is unreachable.',
      examples: [['graph {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}, BFS from 0', 'order [0, 1, 2, 3], distTo [0, 1, 1, 2], pathTo(3) = [0, 1, 3]']],
      file: { name: 'BreadthFirstPaths.java', code: build(true) },
      provided: [{ name: 'Graph.java', code: GRAPH_INTERFACE }, { name: 'ListGraph.java', code: LIST_GRAPH }],
      harness: harness({ seed, body: tests, helpers: GRAPH_HELPERS }),
      solution: build(false),
      hints: v.todo === 'bfs'
        ? ['<code>Queue&lt;Integer&gt; queue = new LinkedList&lt;&gt;();</code> Mark s, set distTo[s] = 0, and add s.', 'Loop while the queue is not empty: remove v, add it to order, then look at each neighbour.', 'For an unmarked neighbour w: mark it, set edgeTo[w] = v and distTo[w] = distTo[v] + 1, and add it to the queue. Marking on ADD means no vertex enters the queue twice.']
        : ['Same as DFS pathTo: follow edgeTo backwards from v to s.', 'Because BFS built edgeTo, the path you get is automatically a shortest one.'],
      approach: ['Trace the queue contents step by step for the example.', 'Note exactly when a vertex is marked (on add) and when it is recorded in order (on remove).', 'Check that distTo grows by 1 per ring.'],
    };
  },
};

/* ------------------------------------------------------------------ applications */

const APPS = [
  {
    name: 'components',
    sig: 'public static int[] components(Graph G)',
    doc: 'Returns id[] where id[v] is the connected-component number of v. Number the components\n0, 1, 2, ... in the order you discover them by running DFS from vertex 0, 1, 2, ... (skipping\nvertices that are already marked).',
    examples: [['graph {0: [1], 1: [0], 2: [], 3: [4], 4: [3]}', '[0, 0, 1, 2, 2]']],
    body: J`        int[] id = new int[G.V()];
        boolean[] marked = new boolean[G.V()];
        int count = 0;
        for (int s = 0; s < G.V(); s++) {
            if (!marked[s]) {
                label(G, s, marked, id, count);
                count++;
            }
        }
        return id;
    }

    private static void label(Graph G, int v, boolean[] marked, int[] id, int count) {
        marked[v] = true;
        id[v] = count;
        for (int w : G.adj(v)) {
            if (!marked[w]) label(G, w, marked, id, count);
        }`,
    expected: J`            int[] id = new int[V]; boolean[] m = new boolean[V]; int c = 0;
            for (int s = 0; s < V; s++) if (!m[s]) { List<Integer> ord = new ArrayList<>(); refDfs(g, s, m, filled(V, -1), ord); for (int x : ord) id[x] = c; c++; }
            final Object expected = id;`,
    call: 'Solution.components(g)',
    hints: ['Loop over every vertex s. If it is not marked yet, it starts a NEW component: run DFS from it, labeling everything reached with the current count, then increment the count.', 'A recursive helper that takes marked, id and the current count works well.'],
  },
  {
    name: 'hasCycle',
    sig: 'public static boolean hasCycle(Graph G)',
    doc: 'Returns true if the graph contains a cycle. (There are no self-loops or parallel edges.)\nIdea: during DFS, reaching an already-marked vertex that is NOT the vertex you just came from means a cycle.',
    examples: [['graph {0: [1], 1: [0, 2], 2: [1]}', 'false'], ['graph {0: [1, 2], 1: [0, 2], 2: [0, 1]}', 'true']],
    body: J`        boolean[] marked = new boolean[G.V()];
        for (int s = 0; s < G.V(); s++) {
            if (!marked[s] && cycleFrom(G, s, -1, marked)) return true;
        }
        return false;
    }

    private static boolean cycleFrom(Graph G, int v, int parent, boolean[] marked) {
        marked[v] = true;
        for (int w : G.adj(v)) {
            if (!marked[w]) {
                if (cycleFrom(G, w, v, marked)) return true;
            } else if (w != parent) {
                return true;
            }
        }
        return false;`,
    expected: J`            final Object expected = g.E() > V - countComponents(g);`,
    call: 'Solution.hasCycle(g)',
    hints: ['Run DFS from every unmarked vertex (the graph may be disconnected).', 'Pass the parent vertex into the recursion. Seeing a marked neighbour other than the parent closes a cycle.'],
  },
  {
    name: 'isBipartite',
    sig: 'public static boolean isBipartite(Graph G)',
    doc: 'Returns true if the vertices can be colored with two colors so that every edge joins different colors.\nIdea: color each vertex the opposite of the vertex you reached it from; a conflict means "not bipartite".',
    examples: [['a square 0-1-2-3-0', 'true'], ['a triangle 0-1-2-0', 'false']],
    body: J`        int[] color = new int[G.V()];
        Arrays.fill(color, -1);
        for (int s = 0; s < G.V(); s++) {
            if (color[s] == -1 && !paint(G, s, 0, color)) return false;
        }
        return true;
    }

    private static boolean paint(Graph G, int v, int c, int[] color) {
        color[v] = c;
        for (int w : G.adj(v)) {
            if (color[w] == -1) {
                if (!paint(G, w, 1 - c, color)) return false;
            } else if (color[w] == c) {
                return false;
            }
        }
        return true;`,
    expected: J`            final Object expected = refBipartite(g);`,
    call: 'Solution.isBipartite(g)',
    hints: ['Use an int[] color initialised to −1 for "uncolored".', 'DFS: give a neighbour the opposite color (1 − c). If a neighbour already has the SAME color as v, return false.', 'Start a fresh DFS from every uncolored vertex.'],
  },
];

const APP_HELPERS = J`
    static int countComponents(Graph g) {
        boolean[] m = new boolean[g.V()]; int c = 0;
        for (int s = 0; s < g.V(); s++) if (!m[s]) { refDfs(g, s, m, filled(g.V(), -1), new ArrayList<>()); c++; }
        return c;
    }

    static boolean refBipartite(Graph g) {
        int[] col = filled(g.V(), -1);
        for (int s = 0; s < g.V(); s++) {
            if (col[s] != -1) continue;
            Deque<Integer> q = new ArrayDeque<>(); q.add(s); col[s] = 0;
            while (!q.isEmpty()) { int v = q.poll(); for (int w : g.adj(v)) { if (col[w] == -1) { col[w] = 1 - col[v]; q.add(w); } else if (col[w] == col[v]) return false; } }
        }
        return true;
    }
`;

const apps = {
  id: 'graph-apps',
  topic: 'graphs',
  level: 3,
  title: 'Graph applications',
  skill: 'Components, cycles, 2-coloring',
  variants: APPS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, APPS, vi);
    const tests = J`        for (int t = 0; t < 12; t++) {
            final int V = 1 + rnd.nextInt(10);
            final ListGraph g = randomGraph(rnd, V, rnd.nextInt(V + 3));
${v.expected}
            test("${v.name}(" + g + ")", () -> eq("${v.name}", expected, ${v.call}));
        }`;
    return {
      title: `Graph application: ${v.name}`,
      story: 'With DFS in your toolbox, many questions about a graph become a small variation of the same search. You only change what you record, or what you check, at each step.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code> in <code>Solution.java</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [{ name: 'Graph.java', code: GRAPH_INTERFACE }, { name: 'ListGraph.java', code: LIST_GRAPH }],
      harness: harness({ seed, body: tests, helpers: GRAPH_HELPERS + APP_HELPERS }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Start from the DFS template: a marked[] array and a recursive helper.', 'Decide what extra information each call needs (count? parent? color?).', 'Remember disconnected graphs: loop over all start vertices.'],
    };
  },
};

export default [representation('matrix'), representation('list'), dfs, bfs, apps];
