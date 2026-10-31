import { code } from '../ui.js';
import { ChainTable } from '../ds.js';
import { chainsHtml } from '../viz.js';

const demo = new ChainTable(5, 8, false);
for (const k of ['tree', 'heap', 'hash', 'node', 'edge', 'stack', 'queue', 'graph']) demo.put(k);

export default {
  id: 'hash',
  intro: 'Constant-time lookups on average: hash functions, separate chaining, resizing, and the client patterns built on them. This is the topic of Weekly Assignment 4 (course grades).',
  sections: [
    {
      id: 'idea',
      title: 'The idea: compute where a key lives',
      body: `
<p>A BST finds a key by comparing. A hash table finds it by <strong>computing</strong> an array index from the key:</p>
<pre class="grammar">key  →  hashCode()  →  index in [0, m)  →  look in that bucket only</pre>
<p>If keys spread evenly over m buckets, each bucket holds about N/m keys, so a lookup checks only a few keys, no matter how big N is.</p>
<p>What you give up: <strong>no ordering</strong>. A hash table cannot answer min, floor, rank or range queries. If you need order, use a BST.</p>`,
    },
    {
      id: 'hashcode',
      title: 'hashCode and equals',
      body: `
<p>Every Java object has <code>hashCode()</code>, which returns any int, possibly negative. The contract:</p>
<div class="callout">If <code>a.equals(b)</code>, then <code>a.hashCode() == b.hashCode()</code>. (The reverse is not required: different keys may share a hash, which is called a <em>collision</em>.)</div>
<p>Java’s <code>String.hashCode()</code> uses <b>Horner’s method</b>: start with h = 0, and for each character, <code>h = 31 * h + c</code>, letting int overflow wrap around.</p>
${code(`
// A composite key: mix every field that equals() compares
public int hashCode() {
    int h = 17;
    h = 31 * h + term.hashCode();
    h = 31 * h + course.hashCode();
    h = 31 * h + student.hashCode();
    return h;
}`, 'Writing hashCode for a multi-field key')}
<p>A simpler approach that is very common in assignments: build a single <code>String</code> key such as <code>term + "|" + course + "|" + student</code> and use the String’s hashCode.</p>`,
    },
    {
      id: 'modular',
      title: 'From hashCode to an index',
      body: `
${code(`
int hash(Key key) {
    return (key.hashCode() & 0x7fffffff) % m;
}`, 'Modular hashing, Sedgewick style')}
<ul>
  <li><code>% m</code> squeezes any int into the range [0, m)… except that in Java a <em>negative</em> number % m is negative, which is not a valid index.</li>
  <li><code>& 0x7fffffff</code> clears the sign bit, so the result is always ≥ 0.</li>
  <li>Why not <code>Math.abs(h) % m</code>? Because <code>Math.abs(Integer.MIN_VALUE)</code> is still negative. Try it: <code>"polygenelubricants".hashCode()</code> is exactly MIN_VALUE.</li>
</ul>`,
      quiz: { q: 'In Java, what is -7 % 3?', options: ['2', '-1', '1'], answer: 1, why: 'Java’s % keeps the sign of the left operand: -7 = 3·(-2) + (-1). That is why we mask the sign bit first.' },
    },
    {
      id: 'chaining',
      title: 'Separate chaining',
      body: `
<p>Collisions are unavoidable. <strong>Separate chaining</strong> keeps an array of m small linked lists; every key whose hash is i goes into list i.</p>
<div class="figure">${chainsHtml(demo)}</div>
<p class="muted center">8 keys in m = 5 chains. New keys are added at the front.</p>
${code(`
public class SequentialSearchST<Key, Value> {
    private Node first;
    private int n;
    private class Node { Key key; Value val; Node next; /* constructor */ }

    public Value get(Key key) {
        for (Node x = first; x != null; x = x.next)
            if (key.equals(x.key)) return x.val;      // equals(), NOT compareTo
        return null;
    }

    public void put(Key key, Value val) {
        for (Node x = first; x != null; x = x.next)
            if (key.equals(x.key)) { x.val = val; return; }   // update
        first = new Node(key, val, first);                     // insert at front
        n++;
    }
}`, 'One chain: a sequential-search linked list')}
<p>The table itself is then very small. <code>put</code> computes <code>i = hash(key)</code> and delegates to <code>st[i]</code>. It must also track the <b>total number of distinct keys</b>, which increases only when a key is new.</p>`,
      lab: 'hash',
    },
    {
      id: 'generic-arrays',
      title: 'The generic-array trick',
      body: `
<p>Java does not allow <code>new SequentialSearchST&lt;Key, Value&gt;[m]</code> (generic array creation). The standard workaround is to create a raw array and cast it:</p>
${code(`
@SuppressWarnings("unchecked")
public SeparateChainingHashST(int m) {
    this.m = m;
    st = (SequentialSearchST<Key, Value>[]) new SequentialSearchST[m];
    for (int i = 0; i < m; i++) st[i] = new SequentialSearchST<>();   // never leave nulls
}`, 'Creating an array of generic chains')}
<p>The same trick appears for adjacency lists in graphs: <code>(ArrayList&lt;Integer&gt;[]) new ArrayList[V]</code>.</p>`,
    },
    {
      id: 'resize',
      title: 'Load factor and resizing',
      body: `
<p>The average chain length is the <b>load factor</b> N/m. To keep it bounded, double m when it gets too big (for example, when N/m ≥ 8).</p>
<div class="callout warn"><b>You cannot just copy the chains into a bigger array.</b> A key’s index is <code>hash % m</code>, so when m changes, almost every key belongs in a different chain. Resizing means <b>re-inserting every key</b> into a fresh table.</div>
${code(`
void resize(int chains) {
    SeparateChainingHashST<Key, Value> temp = new SeparateChainingHashST<>(chains);
    for (int i = 0; i < m; i++)
        for (Key key : st[i].keys())
            temp.put(key, st[i].get(key));
    this.m = temp.m;  this.n = temp.n;  this.st = temp.st;
}`, 'Resize by re-hashing into a temporary table')}
<p>Doubling makes resizing cost a constant amount per insertion <em>on average</em> (amortized), even though a single resize touches every key. Watch it happen in the lab with a small m.</p>`,
      lab: 'hash',
    },
    {
      id: 'iterate',
      title: 'Iterating and counting',
      body: `
<p>To visit every key, walk the chains one by one: chain 0, then chain 1, and so on. The order looks random, and that is expected.</p>
<p>Counting by category is a classic client pattern. If every category must appear, even with a count of 0, <b>seed the counts first</b>:</p>
${code(`
HashMap<String, Integer> counts = new HashMap<>();
for (String c : categories) counts.put(c, 0);             // every category present
for (String item : items)
    if (counts.containsKey(item)) counts.put(item, counts.get(item) + 1);`, 'Counting with guaranteed zero entries')}`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA4 (separate chaining)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1. hash + put (fixed size)</td><td>masking + mod; chain put (update vs insert); counting distinct keys</td><td><em>Hash functions</em>, <em>Chain: put &amp; get</em>, <em>Separate chaining: core</em></td></tr>
<tr><td>2. resize</td><td>double when N/M ≥ 8, re-hash every key</td><td><em>Separate chaining: resizing</em>, the hash lab</td></tr>
<tr><td>3. get</td><td>null for missing keys; the caller converts that into -1.0</td><td><em>Chain</em> and <em>core</em> problems</td></tr>
<tr><td>4. counts per letter</td><td>getKeys over all chains, then counting into a new table, including zeros</td><td><em>keys</em> variants, <em>countByCategory</em></td></tr></table>
<p><b>Pitfalls:</b> size must count <em>unique</em> keys; resize must respect the <code>resizable</code> flag; read carefully whether the load check happens before or after inserting, and match the skeleton’s expectation.</p>`,
    },
  ],
};
