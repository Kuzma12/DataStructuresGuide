import { code } from '../ui.js';
import { buildGraph, dfoTrace } from '../ds.js';
import { graphSvg, adjListHtml } from '../viz.js';

const demo = buildGraph(5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]], true);
const dfo = dfoTrace(demo);

export default {
  id: 'digraphs',
  intro: 'One-way edges: reachability, DFS orders, cycle detection and topological sort, used for scheduling with prerequisites. This is the topic of Weekly Assignment 6.',
  sections: [
    {
      id: 'directed',
      title: 'Directed graphs',
      body: `
<div class="figure two">${graphSvg(demo, { size: 220, directed: true })}${adjListHtml(demo, true)}</div>
<p>Each edge <code>v→w</code> goes one way only. <code>addEdge(v, w)</code> adds <b>w to v’s list only</b>, and <code>adj(v)</code> lists the vertices v points to.</p>
<ul class="defs">
  <li><b>Outdegree</b>: edges leaving v. <b>Indegree</b>: edges entering v.</li>
  <li><b>Reachable</b>: there is a directed path. Here 0 can reach 4, but 4 cannot reach 0.</li>
  <li><b>Directed cycle</b>: a path that returns to its start following arrow directions.</li>
  <li><b>DAG</b>: directed acyclic graph, a digraph with no directed cycles.</li>
</ul>
<p>DFS and BFS work unchanged. They simply follow the arrows.</p>`,
    },
    {
      id: 'symbol',
      title: 'Names to vertices: symbol graphs',
      body: `
<p>Real problems use names (“CSC 403”, “load-data”), but graph code uses integers. Keep a two-way mapping:</p>
${code(`
HashMap<String, Integer> index = new HashMap<>();
for (int i = 0; i < names.size(); i++) index.put(names.get(i), i);   // name → vertex
// vertex → name is just names.get(v)

Digraph G = new Digraph(names.size());
G.addEdge(index.get("load"), index.get("clean"));`, 'A symbol table from names to vertex numbers')}
<div class="callout"><b>Use the given order.</b> If a problem says vertex i is the i-th item of a list, build the map from that list in that order. Changing the numbering changes the DFS order, and with it the expected output.</div>`,
    },
    {
      id: 'orders',
      title: 'DFS orders: pre, post and reverse post',
      body: `
<p>Run DFS from every unmarked vertex (0, 1, 2…) and watch each call at two moments:</p>
${code(`
private void dfs(Digraph G, int v) {
    marked[v] = true;
    pre.add(v);                          // call STARTS
    for (int w : G.adj(v))
        if (!marked[w]) dfs(G, w);
    post.add(v);                         // call FINISHES (everything reachable from v is done)
}`, 'DepthFirstOrder')}
<table class="mini"><tr><th>Preorder</th><td>${dfo.pre.join(' ')}</td></tr><tr><th>Postorder</th><td>${dfo.post.join(' ')}</td></tr><tr><th>Reverse postorder</th><td>${dfo.reversePost.join(' ')}</td></tr></table>
<p><b>Key fact:</b> a vertex finishes only after every vertex it can reach has finished. So in postorder, every vertex appears <em>after</em> all its descendants.</p>`,
      lab: 'digraph',
      quiz: { q: 'In postorder, where does a vertex appear relative to every vertex reachable from it?', options: ['Before them', 'After them', 'It depends on the graph'], answer: 1, why: 'dfs(v) finishes, and adds v to post, only after all the recursive calls it started have finished.' },
    },
    {
      id: 'topo',
      title: 'Topological sort',
      body: `
<p>A <b>topological order</b> lists the vertices so that every edge points <em>forward</em> (from earlier to later). It exists exactly when the digraph is a DAG.</p>
<div class="callout"><b>Reverse postorder of a DAG is a topological order.</b> Postorder puts each vertex after its descendants, so reversing it puts each vertex before them.</div>
<p><b>Think about what the edges mean.</b> Suppose an edge means “must happen before” (v→w: do v, then w). Then the topological order (reverse postorder) is a valid schedule. If the edges point the other way, from each item <em>to the things it depends on</em> (course → prerequisite), every vertex comes after its prerequisites in plain <em>postorder</em>. Then the postorder is the schedule.</p>
<p>Always sanity-check with a 3-vertex example: “A needs B, B needs C”. Write the edges as your problem defines them, run DFS by hand, and see which order puts C first.</p>`,
    },
    {
      id: 'cycles',
      title: 'Detecting directed cycles',
      body: `
<p>“Already marked” is not enough in a digraph: you can reach a vertex twice along different paths with no cycle (0→1→3 and 0→2→3 above). A cycle exists only if you reach a vertex that is <strong>still on the current DFS path</strong>.</p>
${code(`
private boolean cycle(Digraph G, int v) {
    marked[v] = true;
    onStack[v] = true;                       // v is on the current path
    for (int w : G.adj(v)) {
        if (onStack[w]) return true;         // back edge → cycle
        if (!marked[w] && cycle(G, w)) return true;
    }
    onStack[v] = false;                      // leaving v
    return false;
}`, 'Cycle detection with onStack[]')}`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA6 (course prerequisites)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1. Parse course strings</td><td>split on ":" ";" ","; strip the trailing "."; "None" means an empty list</td><td><em>Parsing: Team records</em> (same shape of format)</td></tr>
<tr><td>2. Build the digraph</td><td>HashMap code → vertex in list order; edge course → prerequisite</td><td><em>Symbol digraphs</em></td></tr>
<tr><td>3. Full schedule</td><td>DepthFirstOrder over all vertices</td><td><em>DFS orders</em>, digraph drills, the lab</td></tr>
<tr><td>4. Prerequisites of one course</td><td>DFS from a single start vertex only; leave out the start</td><td><em>reachability</em>, <em>downstream</em></td></tr></table>
<div class="callout warn"><b>Check the direction carefully.</b> The PDF’s example lists the extended prerequisites of A as C, D, B, E. That is the order in which DFS from A <em>finishes</em> those vertices when edges point from a course to its prerequisites. Compare your output with the provided expected outputs early, and make sure you know what your DepthFirstOrder method actually returns.</div>`,
    },
  ],
};
