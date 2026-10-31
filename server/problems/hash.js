// Hashing: hash functions, linked-list chains, separate chaining with resizing, and HashMap client code.
import { J, harness, stub, choose } from './kit.js';

/* ------------------------------------------------------------------ hash functions */

const FUNCTIONS = [
  {
    name: 'index',
    sig: 'public static int index(String key, int m)',
    doc: 'Returns the chain index for key in a table of m chains: take key.hashCode(), clear the\nsign bit with & 0x7fffffff, then take the remainder mod m. The result is always in [0, m).',
    examples: [['index("hash", 7)', '("hash".hashCode() & 0x7fffffff) % 7'], ['index("polygenelubricants", 10)', '8  (its hashCode is Integer.MIN_VALUE!)']],
    body: J`        return (key.hashCode() & 0x7fffffff) % m;`,
    tests: J`        List<String> keys = new ArrayList<>(Arrays.asList("hash", "polygenelubricants", "", "Aa", "BB", "zzzzzzzzzzzz", "separate chaining"));
        for (int i = 0; i < 8; i++) keys.add(randomWord(rnd, 1 + rnd.nextInt(14)));
        for (String k : keys) {
            final String key = k;
            final int m = 1 + rnd.nextInt(97);
            test("index(\"" + key + "\", " + m + ")", () -> eq("index(\"" + key + "\", " + m + ")", (key.hashCode() & 0x7fffffff) % m, Solution.index(key, m)));
        }`,
    hints: ['hashCode() can be negative, and in Java a negative number % m is negative, which is not a valid array index.', 'Why not Math.abs? Because Math.abs(Integer.MIN_VALUE) is still negative. Masking with <code>& 0x7fffffff</code> always gives a non-negative int.'],
  },
  {
    name: 'horner',
    sig: 'public static int horner(String s, int r)',
    doc: 'Computes a string hash with Horner\'s method: start with h = 0 and, for each character c\nfrom left to right, set h = r * h + c. Let int arithmetic overflow naturally. Return h.\n(With r = 31 this is exactly how Java\'s String.hashCode works.)',
    examples: [['horner("ab", 31)', "31 * 'a' + 'b' = 3105"], ['horner("", 37)', '0']],
    body: J`        int h = 0;
        for (int i = 0; i < s.length(); i++) {
            h = r * h + s.charAt(i);
        }
        return h;`,
    tests: J`        int[] radixes = {31, 37, 131, 256, 7};
        for (int t = 0; t < 12; t++) {
            final String s = t == 0 ? "" : randomWord(rnd, 1 + rnd.nextInt(16));
            final int r = radixes[rnd.nextInt(radixes.length)];
            int h = 0; for (char c : s.toCharArray()) h = r * h + c;
            final int expected = h;
            test("horner(\"" + s + "\", " + r + ")", () -> eq("horner(\"" + s + "\", " + r + ")", expected, Solution.horner(s, r)));
        }`,
    hints: ['One loop over the characters. A <code>char</code> used in arithmetic becomes its numeric code automatically.', 'Do not use long or Math functions. Overflow wrapping around is expected and matches the reference.'],
  },
  {
    name: 'combine',
    sig: 'public static int combine(String airline, int flightNumber, String date)',
    doc: 'Hashes a flight record built from three fields. Start with h = 17, then for each field in order:\nh = 31 * h + (field\'s hash), where a String field uses .hashCode() and the int field uses its value.\nReturn h (let it overflow).',
    examples: [['combine("AA", 100, "2024-05-01")', '31*(31*(31*17 + "AA".hashCode()) + 100) + "2024-05-01".hashCode()']],
    body: J`        int h = 17;
        h = 31 * h + airline.hashCode();
        h = 31 * h + flightNumber;
        h = 31 * h + date.hashCode();
        return h;`,
    tests: J`        String[] airlines = {"AA", "UA", "DL", "LATAM", "BoA"};
        for (int t = 0; t < 12; t++) {
            final String a = airlines[rnd.nextInt(airlines.length)];
            final int num = rnd.nextInt(10000) - (t == 3 ? 20000 : 0);
            final String d = String.format("2024-%02d-%02d", 1 + rnd.nextInt(12), 1 + rnd.nextInt(28));
            int h = 17; h = 31 * h + a.hashCode(); h = 31 * h + num; h = 31 * h + d.hashCode();
            final int expected = h;
            test("combine(\"" + a + "\", " + num + ", \"" + d + "\")", () -> eq("combine", expected, Solution.combine(a, num, d)));
        }`,
    hints: ['Three lines of the same shape: <code>h = 31 * h + ...;</code>', 'This is how you write <code>hashCode()</code> for your own classes: mix every field that <code>equals()</code> compares.'],
  },
];

const functions = {
  id: 'hash-functions',
  topic: 'hash',
  level: 1,
  title: 'Hash functions',
  skill: 'hashCode, masking, modular hashing',
  variants: FUNCTIONS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, FUNCTIONS, vi);
    return {
      title: `Hashing: ${v.name}`,
      story: 'A hash table turns a key into an array index in two steps. First <code>hashCode()</code> gives any int; then a modular step squeezes it into [0, m). Small mistakes here (like negative indices) crash real programs.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `public class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [],
      harness: harness({
        seed,
        body: v.tests,
        helpers: J`    static String randomWord(Random r, int len) { StringBuilder sb = new StringBuilder(); for (int i = 0; i < len; i++) sb.append((char) ('a' + r.nextInt(26))); return sb.toString(); }`,
      }),
      solution: `public class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Work the first example by hand with small numbers.', 'Think about int overflow and negative values.', 'Write it in as few lines as possible. Hash functions are short.'],
    };
  },
};

/* ------------------------------------------------------------------ linked chain */

const CHAIN_HEAD = J`import java.util.*;

/** An unordered symbol table backed by a singly linked list (one "chain" of a hash table). */
public class SequentialSearchST<Key, Value> {
    Node first;
    int n;

    class Node {
        Key key;
        Value val;
        Node next;

        Node(Key key, Value val, Node next) {
            this.key = key;
            this.val = val;
            this.next = next;
        }
    }

    public int size() {
        return n;
    }
`;

const CHAIN = {
  get: J`    public Value get(Key key) {
        for (Node x = first; x != null; x = x.next) {
            if (key.equals(x.key)) return x.val;
        }
        return null;
    }`,
  put: J`    public void put(Key key, Value val) {
        for (Node x = first; x != null; x = x.next) {
            if (key.equals(x.key)) {
                x.val = val;
                return;
            }
        }
        first = new Node(key, val, first);
        n++;
    }`,
  delete: J`    public void delete(Key key) {
        if (first == null) return;
        if (key.equals(first.key)) {
            first = first.next;
            n--;
            return;
        }
        for (Node x = first; x.next != null; x = x.next) {
            if (key.equals(x.next.key)) {
                x.next = x.next.next;
                n--;
                return;
            }
        }
    }`,
  keys: J`    public ArrayList<Key> keys() {
        ArrayList<Key> out = new ArrayList<>();
        for (Node x = first; x != null; x = x.next) out.add(x.key);
        return out;
    }`,
  contains: J`    public boolean contains(Key key) {
        return get(key) != null;
    }`,
};

const CHAIN_STUB = {
  get: J`    /** Returns the value paired with key, or null if key is not in the list. Compare keys with equals(). */
    public Value get(Key key) {
        // TODO
        return null;
    }`,
  put: J`    /**
     * If key is already in the list, replace its value. Otherwise add a new node at the FRONT
     * of the list and increase n.
     */
    public void put(Key key, Value val) {
        // TODO
    }`,
  delete: J`    /** Removes key and its value from the list if present (and decreases n). */
    public void delete(Key key) {
        // TODO
    }`,
  keys: J`    /** Returns the keys in list order, from first to last. */
    public ArrayList<Key> keys() {
        // TODO
        return new ArrayList<>();
    }`,
};

const chainClass = (...parts) => `${CHAIN_HEAD}\n${parts.join('\n\n')}\n}\n`;

const CHAINS = [
  { key: 'putget', title: 'put & get', parts: ['get', 'put'], ops: 'put' },
  { key: 'delete', title: 'delete', parts: ['delete'], ops: 'delete' },
  { key: 'keys', title: 'keys', parts: ['keys'], ops: 'keys' },
];

const chain = {
  id: 'hash-chain',
  topic: 'hash',
  level: 1,
  title: 'Linked-list chain',
  skill: 'Sequential search on linked nodes',
  variants: CHAINS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, CHAINS, vi);
    const userParts = ['get', 'put', 'delete', 'keys'].filter((p) => v.parts.includes(p) || ['get', 'put'].includes(p) || p === v.key);
    const starterParts = userParts.map((p) => (v.parts.includes(p) ? CHAIN_STUB[p] : CHAIN[p]));
    const solutionParts = userParts.map((p) => CHAIN[p]);
    const tests = J`        String[] pool = {"ant", "bee", "cat", "dog", "eel", "fox", "gnu", "hen"};
        for (int t = 0; t < 8; t++) {
            final List<String> log = new ArrayList<>();
            final List<String[]> ops = new ArrayList<>();
            int n = t == 0 ? 0 : 1 + rnd.nextInt(12);
            for (int i = 0; i < n; i++) {
                String k = pool[rnd.nextInt(pool.length)];
                boolean del = ${v.ops === 'delete' ? 'rnd.nextInt(3) == 0' : 'false'};
                ops.add(new String[] {del ? "del" : "put", k, "v" + i});
                log.add(del ? "delete(" + k + ")" : "put(" + k + ", v" + i + ")");
            }
            test(log.isEmpty() ? "empty list" : String.join(", ", log), () -> {
                SequentialSearchST<String, String> st = new SequentialSearchST<>();
                LinkedList<String> order = new LinkedList<>();
                Map<String, String> vals = new HashMap<>();
                for (String[] op : ops) {
                    if (op[0].equals("put")) {
                        st.put(op[1], op[2]);
                        if (!vals.containsKey(op[1])) order.addFirst(op[1]);
                        vals.put(op[1], op[2]);
                    }${v.ops === 'delete' ? ` else {
                        st.delete(op[1]);
                        order.remove(op[1]);
                        vals.remove(op[1]);
                    }` : ''}
                }
                eq("size()", vals.size(), st.size());
                List<String> actual = new ArrayList<>();
                int guard = 0;
                for (SequentialSearchST<String, String>.Node x = st.first; x != null && guard++ < 100; x = x.next) actual.add(x.key);
                eq("keys in list order (new keys go at the FRONT)", new ArrayList<>(order), actual);
                for (String k : pool) eq("get(\"" + k + "\")", vals.get(k), st.get(k));
                ${v.key === 'keys' ? 'eq("keys()", new ArrayList<>(order), st.keys());' : ''}
            });
        }`;
    return {
      title: `Chain: ${v.title}`,
      story: 'Each bucket of a separate-chaining hash table is a tiny linked list. You search it from the front, one node at a time, comparing with <code>equals()</code> because hash tables have no ordering.',
      task: `Implement ${v.parts.map((p) => `<code>${p}</code>`).join(' and ')} in <code>SequentialSearchST.java</code>${v.key === 'putget' ? '' : ' (put and get are provided)'}. New keys are inserted at the <strong>front</strong> of the list; existing keys keep their position and just get a new value.`,
      examples: [['put(a,1); put(b,2); put(a,9)', 'list: b -> a, get(a) = 9, size = 2'], ['delete(b) afterwards', 'list: a, size = 1']],
      file: { name: 'SequentialSearchST.java', code: chainClass(...starterParts) },
      provided: [],
      harness: harness({ seed, body: tests }),
      solution: chainClass(...solutionParts),
      hints: [
        'Walk the list with <code>for (Node x = first; x != null; x = x.next)</code>.',
        'Insert at the front in one line: <code>first = new Node(key, val, first);</code>',
        'To delete, you need the node BEFORE the one being removed, so that you can set <code>prev.next = prev.next.next</code>. Deleting the first node is a special case.',
      ],
      approach: ['Draw boxes and arrows for a 3-node list.', 'For each operation, mark which arrow changes.', 'Remember that n counts distinct keys, so update it only when the set of keys changes.'],
    };
  },
};

/* ------------------------------------------------------------------ separate chaining */

const SEP = {
  hash: J`    int hash(Key key) {
        return (key.hashCode() & 0x7fffffff) % m;
    }`,
  put: J`    public void put(Key key, Value val) {
        int i = hash(key);
        if (!st[i].contains(key)) n++;
        st[i].put(key, val);
        if (resizable && n >= MAX_LOAD * m) resize(2 * m);
    }`,
  get: J`    public Value get(Key key) {
        return st[hash(key)].get(key);
    }`,
  resize: J`    void resize(int chains) {
        SeparateChainingHashST<Key, Value> temp = new SeparateChainingHashST<>(chains, resizable);
        for (int i = 0; i < m; i++) {
            for (Key key : st[i].keys()) temp.put(key, st[i].get(key));
        }
        this.m = temp.m;
        this.n = temp.n;
        this.st = temp.st;
    }`,
  keys: J`    public ArrayList<Key> keys() {
        ArrayList<Key> out = new ArrayList<>();
        for (int i = 0; i < m; i++) out.addAll(st[i].keys());
        return out;
    }`,
};

const SEP_STUB = {
  hash: J`    /** Maps key to a chain index in [0, m): hashCode, clear the sign bit, mod m. */
    int hash(Key key) {
        // TODO
        return 0;
    }`,
  put: J`    /**
     * Puts key/val into chain st[hash(key)]. If the key is NEW, increase n.
     * Then, if resizable and n >= MAX_LOAD * m, double the number of chains with resize(2 * m).
     */
    public void put(Key key, Value val) {
        // TODO
    }`,
  get: J`    /** Returns the value for key, or null if it is not in the table. Only one chain needs searching. */
    public Value get(Key key) {
        // TODO
        return null;
    }`,
  resize: J`    /**
     * Rebuilds the table with the given number of chains. Every key must be re-hashed, because
     * hash(key) depends on m. Afterwards m, n and st must describe the new table.
     * (Tip: build a temporary SeparateChainingHashST with the new size, put every key into it,
     * then copy its m, n and st fields into this object.)
     */
    void resize(int chains) {
        // TODO
    }`,
  keys: J`    /** Returns every key: all keys of chain 0 (in that chain's order), then chain 1, and so on. */
    public ArrayList<Key> keys() {
        // TODO
        return new ArrayList<>();
    }`,
};

function sepClass(maxLoad, parts) {
  return J`import java.util.*;

public class SeparateChainingHashST<Key, Value> {
    static final int MAX_LOAD = ${String(maxLoad)};  // average keys per chain that triggers doubling

    int n;                               // number of distinct keys
    int m;                               // number of chains
    SequentialSearchST<Key, Value>[] st; // the chains
    final boolean resizable;

    @SuppressWarnings("unchecked")
    public SeparateChainingHashST(int m, boolean resizable) {
        this.m = m;
        this.resizable = resizable;
        st = (SequentialSearchST<Key, Value>[]) new SequentialSearchST[m];
        for (int i = 0; i < m; i++) st[i] = new SequentialSearchST<>();
    }

    public int size() {
        return n;
    }

${parts.join('\n\n')}
}
`;
}

const SEPS = [
  { key: 'core', title: 'hash, put & get (fixed size)', todo: ['hash', 'put', 'get'], resizable: false },
  { key: 'resize', title: 'resizing', todo: ['resize'], resizable: true },
  { key: 'keys', title: 'iterating all keys', todo: ['keys'], resizable: true },
];

const sepchain = {
  id: 'hash-sepchain',
  topic: 'hash',
  level: 2,
  title: 'Separate chaining table',
  skill: 'Chains array, size tracking, resize',
  variants: SEPS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, SEPS, vi);
    const maxLoad = rng.int(2, 8);
    const initial = rng.pick([1, 2, 3, 4, 5, 7]);
    const order = ['hash', 'put', 'get', 'resize', 'keys'];
    const starter = sepClass(maxLoad, order.map((p) => (v.todo.includes(p) ? SEP_STUB[p] : SEP[p])));
    const solution = sepClass(maxLoad, order.map((p) => SEP[p]));
    const provided = chainClass(CHAIN.get, CHAIN.put, CHAIN.delete, CHAIN.keys, CHAIN.contains).replace(
      '/** An unordered',
      '/** Provided. Do not change this file.\n *  An unordered',
    );
    const tests = J`        for (int t = 0; t < 7; t++) {
            final boolean strings = rnd.nextBoolean();
            final List<Object> ks = new ArrayList<>();
            int n = t == 0 ? 0 : 1 + rnd.nextInt(t < 3 ? 12 : 120);
            for (int i = 0; i < n; i++) ks.add(strings ? (Object) word(rnd) : (Object) (rnd.nextInt(400) - 100));
            final boolean resizable = ${v.resizable ? 'true' : 'false'};
            test("new table(m=${String(initial)}" + (resizable ? ", resizable" : ", fixed size") + ") then put " + n + " " + (strings ? "String" : "Integer") + " keys " + (n <= 12 ? show(ks) : "(" + show(ks.subList(0, 12)) + " ...)"), () -> {
                SeparateChainingHashST<Object, Integer> table = new SeparateChainingHashST<>(${String(initial)}, resizable);
                Map<Object, Integer> vals = new LinkedHashMap<>();
                int expectedM = ${String(initial)};
                for (int i = 0; i < ks.size(); i++) {
                    table.put(ks.get(i), i);
                    vals.put(ks.get(i), i);
                    if (resizable && vals.size() >= SeparateChainingHashST.MAX_LOAD * expectedM) expectedM *= 2;
                }
                eq("size() (number of distinct keys)", vals.size(), table.size());
                eq("m (number of chains)", expectedM, table.m);
                eq("st.length", expectedM, table.st.length);
                for (int i = 0; i < table.m; i++) {
                    for (SequentialSearchST<Object, Integer>.Node x = table.st[i].first; x != null; x = x.next) {
                        int h = (x.key.hashCode() & 0x7fffffff) % table.m;
                        check(h == i, "key " + show(x.key) + " is stored in chain " + i + " but hashes to chain " + h + " for m = " + table.m
                            + (resizable ? ". Did resize re-hash every key with the NEW m?" : ""));
                    }
                }
                for (Map.Entry<Object, Integer> e : vals.entrySet()) eq("get(" + show(e.getKey()) + ")", e.getValue(), table.get(e.getKey()));
                eq("get(missing key)", null, table.get(strings ? (Object) "not-a-key!" : (Object) 99999));
                ${v.key === 'keys' ? `List<Object> expectedKeys = new ArrayList<>();
                for (int i = 0; i < table.m; i++) for (SequentialSearchST<Object, Integer>.Node x = table.st[i].first; x != null; x = x.next) expectedKeys.add(x.key);
                eq("keys()", expectedKeys, table.keys());` : ''}
            });
        }`;
    return {
      title: `Separate chaining: ${v.title}`,
      story: `A table of <code>m</code> chains. Each key goes to chain <code>hash(key)</code>, so a lookup only searches that one short list. In this table, once the average chain length reaches <code>MAX_LOAD = ${maxLoad}</code>, the table doubles. That keeps the chains short, and operations stay fast on average.`,
      task: `Implement ${v.todo.map((p) => `<code>${p}</code>`).join(', ')} in <code>SeparateChainingHashST.java</code>. The chains use the provided, working <code>SequentialSearchST</code>. The tests start with <code>m = ${initial}</code>${v.resizable ? ` and expect the table to double whenever <code>n &gt;= ${maxLoad} * m</code> after inserting a new key` : ' and resizing turned off'}.`,
      examples: [[`m = 4: put "a", "b", "a"`, 'n = 2 (the second "a" only replaces a value)'], [`MAX_LOAD = ${maxLoad}, m = 1: after ${maxLoad} distinct keys`, 'm = 2, and every key re-hashed']],
      file: { name: 'SeparateChainingHashST.java', code: starter },
      provided: [{ name: 'SequentialSearchST.java', code: provided }],
      harness: harness({
        seed,
        body: tests,
        helpers: J`    static String word(Random r) { StringBuilder sb = new StringBuilder(); int len = 1 + r.nextInt(6); for (int i = 0; i < len; i++) sb.append((char) ('a' + r.nextInt(26))); return sb.toString(); }`,
      }),
      solution,
      hints: {
        core: [
          '<code>hash</code>: <code>(key.hashCode() &amp; 0x7fffffff) % m</code>',
          '<code>put</code>: find the chain with <code>st[hash(key)]</code>. If that chain does not <code>contains(key)</code> yet, the key is new, so <code>n++</code>. Then put into the chain.',
          '<code>get</code>: one line, since only the key’s own chain can hold it.',
        ],
        resize: [
          'You cannot just make the array bigger: a key’s chain index depends on m, so every key must move.',
          'Create <code>new SeparateChainingHashST&lt;&gt;(chains, resizable)</code>, loop over every old chain and every key in it (<code>st[i].keys()</code>), and put each key/value into the temporary table.',
          'Finally copy <code>temp.m</code>, <code>temp.n</code> and <code>temp.st</code> into this table’s fields.',
        ],
        keys: ['Loop i from 0 to m − 1 and add all of <code>st[i].keys()</code>.', 'Do not sort. The order is chain by chain.'],
      }[v.key],
      approach: ['Draw an array of m boxes, each pointing to a short linked list.', 'Trace one put: compute the hash, find the chain, decide whether n changes.', 'For resize, trace what happens to 4 keys when m goes from 2 to 4.'],
    };
  },
};

/* ------------------------------------------------------------------ HashMap client code */

const CLIENTS = [
  {
    name: 'countByCategory',
    sig: 'public static HashMap<String, Integer> countByCategory(List<String> items, String[] categories)',
    doc: 'Returns a map from EVERY category to how many items equal it. Categories that never appear\nmap to 0. Items that are not one of the categories are ignored.',
    examples: [['countByCategory(["A","C","A","Z"], {"A","B","C"})', '{A=2, B=0, C=1}']],
    body: J`        HashMap<String, Integer> counts = new HashMap<>();
        for (String c : categories) counts.put(c, 0);
        for (String item : items) {
            if (counts.containsKey(item)) counts.put(item, counts.get(item) + 1);
        }
        return counts;`,
    tests: J`        String[] all = {"A", "B", "C", "D", "F", "W"};
        for (int t = 0; t < 8; t++) {
            final String[] cats = Arrays.copyOf(all, 2 + rnd.nextInt(4));
            final List<String> items = new ArrayList<>();
            int n = rnd.nextInt(15);
            for (int i = 0; i < n; i++) items.add(all[rnd.nextInt(all.length)]);
            final Map<String, Integer> expected = new HashMap<>();
            for (String c : cats) expected.put(c, 0);
            for (String it : items) if (expected.containsKey(it)) expected.put(it, expected.get(it) + 1);
            test("countByCategory(" + show(items) + ", " + show(cats) + ")", () -> eq("counts", expected, Solution.countByCategory(items, cats)));
        }`,
    hints: ['Seed the map with every category mapped to 0 first. That handles the "never appears" case.', 'Then loop over items and increment only keys that are already in the map.'],
  },
  {
    name: 'firstRepeated',
    sig: 'public static String firstRepeated(List<String> words)',
    doc: 'Scanning left to right, returns the first word that has already been seen earlier in the list,\nor null if every word is unique.',
    examples: [['firstRepeated(["red", "blue", "green", "blue", "red"])', '"blue"'], ['firstRepeated(["x", "y"])', 'null']],
    body: J`        HashSet<String> seen = new HashSet<>();
        for (String w : words) {
            if (!seen.add(w)) return w;
        }
        return null;`,
    tests: J`        String[] pool = {"red", "blue", "green", "teal", "gold", "pink", "navy", "plum"};
        for (int t = 0; t < 10; t++) {
            final List<String> words = new ArrayList<>();
            int n = rnd.nextInt(8);
            for (int i = 0; i < n; i++) words.add(pool[rnd.nextInt(pool.length)]);
            String e = null; Set<String> s = new HashSet<>();
            for (String w : words) if (!s.add(w)) { e = w; break; }
            final String expected = e;
            test("firstRepeated(" + show(words) + ")", () -> eq("firstRepeated", expected, Solution.firstRepeated(words)));
        }`,
    hints: ['Keep a <code>HashSet</code> of words seen so far.', '<code>set.add(w)</code> returns false if w was already there, and that is your answer.'],
  },
  {
    name: 'groupByLength',
    sig: 'public static HashMap<Integer, ArrayList<String>> groupByLength(List<String> words)',
    doc: 'Groups words by their length. Each list keeps the original order (duplicates included).',
    examples: [['groupByLength(["hi", "hash", "ok", "tree"])', '{2=[hi, ok], 4=[hash, tree]}']],
    body: J`        HashMap<Integer, ArrayList<String>> groups = new HashMap<>();
        for (String w : words) {
            ArrayList<String> list = groups.get(w.length());
            if (list == null) {
                list = new ArrayList<>();
                groups.put(w.length(), list);
            }
            list.add(w);
        }
        return groups;`,
    tests: J`        String[] pool = {"hi", "ok", "hash", "tree", "graph", "node", "edge", "a", "queue", "stack"};
        for (int t = 0; t < 8; t++) {
            final List<String> words = new ArrayList<>();
            int n = rnd.nextInt(10);
            for (int i = 0; i < n; i++) words.add(pool[rnd.nextInt(pool.length)]);
            final Map<Integer, List<String>> expected = new HashMap<>();
            for (String w : words) expected.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
            test("groupByLength(" + show(words) + ")", () -> eq("groups", expected, Solution.groupByLength(words)));
        }`,
    hints: ['Same "get, create if missing, then add" pattern as grouping in a BST.', 'The key is <code>w.length()</code>, which autoboxes to an Integer.'],
  },
  {
    name: 'pairCount',
    sig: 'public static int pairCount(int[] a, int target)',
    doc: 'Returns how many index pairs i < j satisfy a[i] + a[j] == target.\nAim for one pass with a HashMap of counts (no nested loops).',
    examples: [['pairCount({1, 5, 3, 3, 7}, 6)', '2  (1+5 and 3+3)']],
    body: J`        HashMap<Integer, Integer> seen = new HashMap<>();
        int pairs = 0;
        for (int x : a) {
            pairs += seen.getOrDefault(target - x, 0);
            seen.put(x, seen.getOrDefault(x, 0) + 1);
        }
        return pairs;`,
    tests: J`        for (int t = 0; t < 10; t++) {
            final int[] a = new int[rnd.nextInt(12)];
            for (int i = 0; i < a.length; i++) a[i] = rnd.nextInt(10);
            final int target = rnd.nextInt(15);
            int e = 0;
            for (int i = 0; i < a.length; i++) for (int j = i + 1; j < a.length; j++) if (a[i] + a[j] == target) e++;
            final int expected = e;
            test("pairCount(" + Arrays.toString(a) + ", " + target + ")", () -> eq("pairCount", expected, Solution.pairCount(a, target)));
        }`,
    hints: ['Walk left to right. For each x, every earlier value equal to target − x forms a pair with it.', 'Keep a map: value → how many times it has appeared so far. <code>getOrDefault</code> is handy.'],
  },
];

const client = {
  id: 'hash-client',
  topic: 'hash',
  level: 1,
  title: 'HashMap client code',
  skill: 'Counting and grouping with hash tables',
  variants: CLIENTS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, CLIENTS, vi);
    return {
      title: `Hash client: ${v.name}`,
      story: 'Most real uses of hash tables are client code: count things, group things, remember what you have seen. Each lookup takes constant time on average.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code> using <code>java.util.HashMap</code> / <code>HashSet</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: `import java.util.*;\n\npublic class Solution {\n\n${stub(v.sig, v.doc)}\n}\n` },
      provided: [],
      harness: harness({ seed, body: v.tests }),
      solution: `import java.util.*;\n\npublic class Solution {\n\n    ${v.sig} {\n${v.body}\n    }\n}\n`,
      hints: v.hints,
      approach: ['Decide what the keys are and what the values are.', 'Process one input element at a time: read the map, then update it.', 'Check the empty input and the "never seen" case.'],
    };
  },
};

export default [functions, chain, sepchain, client];
