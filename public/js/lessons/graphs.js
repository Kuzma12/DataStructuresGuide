import { code } from '../ui.js';
import { buildGraph, dfsTrace, bfsTrace } from '../ds.js';
import { graphSvg, adjListHtml } from '../viz.js';

const demoEdges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [5, 6]];
const demo = buildGraph(7, demoEdges);
const dfs = dfsTrace(demo, 0);
const bfs = bfsTrace(demo, 0);

export default {
  id: 'graphs',
  intro: 'Vertices and edges: two ways to store them, and the two fundamental searches (DFS and BFS). This is the topic of Weekly Assignment 5.',
  sections: [
    {
      id: 'vocab',
      title: 'Graph vocabulary',
      body: `
<div class="figure two">${graphSvg(demo, { size: 240 })}${adjListHtml(demo)}</div>
<ul class="defs">
  <li><b>Vertices</b> are named <code>0 … V−1</code>. <b>Edges</b> connect pairs; in an <b>undirected</b> graph, v–w is the same edge as w–v.</li>
  <li><b>Adjacent</b>: joined by an edge. <b>Degree</b>: number of neighbours.</li>
  <li><b>Path</b>: a sequence of edges. <b>Connected component</b>: a maximal set of mutually reachable vertices (here {0,1,2,3,4} and {5,6}).</li>
  <li><b>Self-loop</b>: an edge v–v. <b>Parallel edges</b>: the same edge twice. Many APIs, including the problems here, ignore both.</li>
</ul>
${code(`
public interface Graph {
    int V();
    int E();
    void addEdge(int v, int w);
    Iterable<Integer> adj(int v);
}`, 'The Graph API: algorithms only ever use these four methods')}`,
    },
    {
      id: 'matrix',
      title: 'Adjacency matrix',
      body: `
<p>A V×V grid of 0/1: <code>adj[v][w] == 1</code> means v and w are adjacent. For an undirected graph it is symmetric.</p>
${code(`
public void addEdge(int v, int w) {
    if (v == w || adj[v][w] == 1) return;   // ignore self-loops and repeats (either direction!)
    adj[v][w] = 1;
    adj[w][v] = 1;                          // undirected: both directions
    E++;                                    // one edge, counted once
}

public Iterable<Integer> adj(int v) {
    ArrayList<Integer> out = new ArrayList<>();
    for (int w = 0; w < V; w++) if (adj[v][w] == 1) out.add(w);   // always increasing order
    return out;
}`, 'Matrix: adding an edge is O(1); listing neighbours is O(V)')}
<p><b>E() in constant time:</b> keep a counter and update it only when a <em>new</em> edge is really added. Counting the 1s in the matrix would be O(V²).</p>
<p>Use a matrix when the graph is <b>dense</b> (close to V² edges) or when you need instant “are v and w adjacent?” checks. It wastes space on sparse graphs.</p>`,
      quiz: { q: 'addEdge(2, 5) then addEdge(5, 2) on an undirected graph. What is E()?', options: ['1', '2', '0'], answer: 0, why: 'Same undirected edge twice. The second call must be detected and ignored, so E() = 1.' },
    },
    {
      id: 'list',
      title: 'Adjacency lists',
      body: `
<p>For each vertex, keep a list of its neighbours. Space is proportional to V + E, the right choice for sparse graphs (most real graphs).</p>
${code(`
private final ArrayList<Integer>[] adj;

@SuppressWarnings("unchecked")
public AdjacencyListGraph(int V) {
    this.V = V;
    adj = (ArrayList<Integer>[]) new ArrayList[V];   // generic-array trick
    for (int v = 0; v < V; v++) adj[v] = new ArrayList<>();
}

public void addEdge(int v, int w) {
    if (v == w || adj[v].contains(w)) return;
    adj[v].add(w);                                    // append at the END
    adj[w].add(v);
    E++;
}`, 'Adjacency lists with an array of ArrayLists')}
<div class="callout"><b>Order matters.</b> DFS and BFS visit neighbours in list order. Appending at the end, in the order the edges arrive, is what makes your traversal match the expected output. With a matrix, the order is always 0, 1, 2…, regardless of insertion order.</div>`,
    },
    {
      id: 'dfs',
      title: 'Depth-first search',
      body: `
<p>DFS explores as far as possible along each branch before backing up. It needs two arrays: <code>marked[]</code> (visited?) and <code>edgeTo[]</code> (which vertex we came from, i.e. the trail back).</p>
${code(`
private void dfs(Graph G, int v) {
    marked[v] = true;              // 1. mark on arrival
    order.add(v);                  //    (record the visit order if needed)
    for (int w : G.adj(v)) {       // 2. try every neighbour in adj order
        if (!marked[w]) {
            edgeTo[w] = v;         // 3. remember how we reached w
            dfs(G, w);             // 4. go deep
        }
    }
}`, 'Recursive DFS (Sedgewick’s DepthFirstPaths)')}
<p>On the example graph from 0: order <b>${dfs.order.join(', ')}</b>, edgeTo = [${dfs.edgeTo.join(', ')}]. Vertices 5 and 6 are never reached, because they are in another component.</p>
<p>Step through it in the lab below and watch the recursion stack grow and shrink.</p>`,
      lab: 'graph',
    },
    {
      id: 'bfs',
      title: 'Breadth-first search',
      body: `
<p>BFS explores in rings of increasing distance, using a <strong>queue</strong>. The first time it reaches a vertex is along a <strong>shortest</strong> path (fewest edges).</p>
${code(`
private void bfs(Graph G, int s) {
    Queue<Integer> queue = new LinkedList<>();
    marked[s] = true;  distTo[s] = 0;  queue.add(s);
    while (!queue.isEmpty()) {
        int v = queue.remove();
        for (int w : G.adj(v)) {
            if (!marked[w]) {
                marked[w] = true;          // mark when ENQUEUED, not when dequeued
                edgeTo[w] = v;
                distTo[w] = distTo[v] + 1;
                queue.add(w);
            }
        }
    }
}`, 'Queue-based BFS')}
<p>On the example from 0: dequeue order <b>${bfs.order.join(', ')}</b>, distTo = [${bfs.distTo.join(', ')}] (−1 = unreachable).</p>
<p><b>Classic bug:</b> marking on dequeue instead of enqueue lets a vertex enter the queue twice. The results can still look right on small graphs but break edgeTo and distTo.</p>`,
      lab: 'graph',
      quiz: { q: 'Which data structure turns the search into BFS rather than DFS?', options: ['A stack (or recursion)', 'A queue', 'A hash table'], answer: 1, why: 'FIFO order processes vertices ring by ring. LIFO, which is what recursion uses, goes deep first.' },
    },
    {
      id: 'paths',
      title: 'Paths from edgeTo[]',
      body: `
<p>Both searches leave a tree of “parent” pointers in <code>edgeTo[]</code>. To get the path from s to v, walk backwards from v and reverse:</p>
${code(`
public ArrayList<Integer> pathTo(int v) {
    if (!marked[v]) return null;                 // unreachable
    ArrayList<Integer> path = new ArrayList<>();
    for (int x = v; x != s; x = edgeTo[x]) path.add(x);
    path.add(s);
    Collections.reverse(path);
    return path;                                 // s ... v
}`, 'Reconstructing a path')}
<p>With BFS’s edgeTo this is a shortest path. With DFS’s edgeTo it is just <em>some</em> path.</p>`,
    },
    {
      id: 'applications',
      title: 'Applications of DFS',
      body: `
<ul class="defs">
  <li><b>Connected components</b>: loop v = 0..V−1. Every unmarked v starts a new component, and a DFS from it labels everything reachable with the component number.</li>
  <li><b>Cycle detection</b> (undirected): during DFS, finding a marked neighbour that is <em>not your parent</em> means a cycle.</li>
  <li><b>Bipartite (two-colorable)</b>: give each newly reached vertex the opposite color of the vertex you came from. A neighbour with the same color means the graph is not bipartite.</li>
</ul>
<p>Same skeleton every time. Only what you record or check changes. That is the pattern to internalize.</p>`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA5 (matrix vs lists)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1. AdjacencyMatrixGraph</td><td>symmetric 0/1 matrix, O(1) E(), ignore repeats and reversed repeats</td><td><em>Adjacency matrix</em></td></tr>
<tr><td>2. AdjacencyListGraph</td><td>array of lists (generic-array trick), append order, no duplicates</td><td><em>Adjacency list</em></td></tr>
<tr><td>3. DFS</td><td>recursive helper filling marked / edgeTo / results</td><td><em>Depth-first search</em>, DFS drills, the graph lab</td></tr>
<tr><td>4. BFS</td><td>queue; mark on enqueue; same arrays</td><td><em>Breadth-first search</em>, BFS drills</td></tr></table>
<p><b>Pitfalls the PDF calls out:</b> the visit order depends on the representation (a matrix gives increasing order; a list gives insertion order). Always append new adjacencies at the end.</p>`,
    },
  ],
};
