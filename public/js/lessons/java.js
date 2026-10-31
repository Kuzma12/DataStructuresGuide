import { code } from '../ui.js';

export default {
  id: 'java',
  intro: 'The Java you need for every assignment: objects and null, generics with compareTo, ArrayList, recursion, stacks and queues, and parsing text.',
  sections: [
    {
      id: 'objects',
      title: 'Objects, references and null',
      body: `
<p>Every data structure in this course is made of small objects that point to each other. A tree node:</p>
${code(`
class Node {
    int val;
    Node left, right;     // references to other Node objects (or null)

    Node(int val) {
        this.val = val;   // left and right start as null
    }
}

Node root = new Node(5);
root.left = new Node(3);  // 5's left child is now 3
root.left.right = null;   // still null: "no child here"`, 'A node holds data plus links')}
<p>A variable like <code>root</code> does not <em>contain</em> the object. It holds a <strong>reference</strong> to it, like an arrow. <code>null</code> means “points to nothing”.</p>
<p>The most common crash in this course is <code>NullPointerException</code>: reading <code>x.left</code> when <code>x</code> is null. The cure is a habit: <strong>before you use x.something, ask “can x be null here?”</strong></p>`,
      quiz: {
        q: 'Node a = new Node(1); Node b = a; b.val = 9; What is a.val?',
        options: ['1', '9', 'It does not compile'],
        answer: 1,
        why: 'a and b are two references (arrows) to the SAME object. Changing it through b is visible through a.',
      },
    },
    {
      id: 'generics',
      title: 'Generics and compareTo',
      body: `
<p>A symbol table should work for any key type: Strings, Integers, dates. Java expresses that with <strong>type parameters</strong>:</p>
${code(`
public class BST<Key extends Comparable<Key>, Value> {
    // Key   : any type that knows how to compare itself to another Key
    // Value : any type at all
}

BST<String, Integer> counts = new BST<>();
BST<Integer, ArrayList<String>> groups = new BST<>();`, 'Generic class header used in Sedgewick-style code')}
<p>You cannot write <code>a &lt; b</code> on generic keys. Instead every <code>Comparable</code> has <code>compareTo</code>:</p>
${code(`
int cmp = key.compareTo(x.key);
if      (cmp < 0) { /* key is smaller  → go left  */ }
else if (cmp > 0) { /* key is larger   → go right */ }
else              { /* equal: found it            */ }`, 'Only the sign of cmp matters')}
<p>Compute <code>cmp</code> once, then branch on its sign. Never compare it to <code>-1</code> or <code>1</code>; any negative or positive number is allowed. For Strings the order is lexicographic, and uppercase sorts before lowercase.</p>`,
      quiz: {
        q: '"apple".compareTo("banana") returns...',
        options: ['a negative number', 'zero', 'a positive number'],
        answer: 0,
        why: '"apple" comes before "banana" alphabetically, so the result is negative. Its exact value does not matter.',
      },
    },
    {
      id: 'arraylist',
      title: 'ArrayList: create, add, loop, return',
      body: `
<p>Traversals, query results and schedules are all returned as <code>ArrayList</code>s. The moves you need:</p>
${code(`
ArrayList<Integer> list = new ArrayList<>();   // empty list
list.add(7);                                   // append at the end
list.add(0, 3);                                // insert at index 0
int first = list.get(0);                       // read by index
int n = list.size();                           // how many
for (int x : list) { System.out.println(x); }  // loop over items
list.contains(7);                              // linear search (slow for big lists)
Collections.reverse(list);                     // reverse in place
Collections.sort(list);                        // sort in place`, 'The ArrayList toolkit')}
<p><b>Lists of lists</b> show up when you group things by level or by node: <code>ArrayList&lt;ArrayList&lt;String&gt;&gt;</code>. Build the inner list, fill it, then add it to the outer one.</p>
<p><b>A trap:</b> <code>list.remove(3)</code> on an <code>ArrayList&lt;Integer&gt;</code> removes the element at <em>index</em> 3. To remove the <em>value</em> 3, write <code>list.remove(Integer.valueOf(3))</code>.</p>`,
    },
    {
      id: 'recursion',
      title: 'Recursion and the call stack',
      body: `
<p>A recursive method calls itself on a smaller input. Each call gets its own copy of the local variables, stacked on top of each other: the <strong>call stack</strong>.</p>
${code(`
static int sumDigits(int n) {
    if (n < 10) return n;                 // base case: one digit
    return n % 10 + sumDigits(n / 10);    // last digit + sum of the rest
}
// sumDigits(472)
//   = 2 + sumDigits(47)
//   = 2 + (7 + sumDigits(4))
//   = 2 + (7 + 4) = 13`, 'Each call waits for the one it started')}
<p>Two rules that prevent infinite recursion:</p>
<ul><li>There is a base case that returns without recursing.</li><li>Every recursive call moves <em>toward</em> the base case (n gets smaller, the tree gets smaller).</li></ul>
<p><b>Helper methods.</b> Often the public method has the wrong parameters for recursion. The fix is a private helper that carries extra state, such as the current node or a result list:</p>
${code(`
public ArrayList<Integer> inorder() {
    ArrayList<Integer> out = new ArrayList<>();
    inorder(root, out);                   // helper does the work
    return out;
}

private void inorder(Node x, ArrayList<Integer> out) {
    if (x == null) return;
    inorder(x.left, out);
    out.add(x.val);
    inorder(x.right, out);
}`, 'Public wrapper + private recursive helper')}`,
      quiz: {
        q: 'A recursive method with no base case will usually end with...',
        options: ['The correct answer, just slowly', 'A StackOverflowError', 'A compile error'],
        answer: 1,
        why: 'Every call adds a frame to the call stack. Without a base case the stack grows until Java runs out of stack space.',
      },
    },
    {
      id: 'stacks-queues',
      title: 'Stacks and queues',
      body: `
<p><b>Stack</b>: last in, first out (LIFO), like a pile of plates. <b>Queue</b>: first in, first out (FIFO), like a line at a store.</p>
${code(`
Stack<Integer> stack = new Stack<>();
stack.push(1); stack.push(2);
stack.pop();        // 2  (the most recent)
stack.peek();       // 1  (look without removing)
stack.isEmpty();

Queue<Integer> queue = new LinkedList<>();
queue.add(1); queue.add(2);
queue.remove();     // 1  (the oldest)
queue.isEmpty();`, 'Java’s Stack and Queue')}
<p><b>Postfix evaluation</b> is the classic stack algorithm. Read the tokens left to right. Push numbers. For an operator, pop two values, apply the operator, and push the result.</p>
<div class="callout"><b>Order matters.</b> For <code>5 2 -</code>, the first pop gives <b>2</b> (the right operand) and the second gives <b>5</b> (the left). Compute <code>left − right = 3</code>. Mixing these up breaks − and / but not + and *, so tests with only + and * can hide the bug.</div>
<p><b>Where you will use them:</b> stacks for expression evaluation and (implicitly) recursion; queues for level-order traversal and breadth-first search.</p>`,
      lab: 'expr',
    },
    {
      id: 'parsing',
      title: 'Parsing text into objects',
      body: `
<p>Most assignments start by turning lines of text into objects. The toolkit:</p>
${code(`
String line = " Lamp | 4 | 19.99 ";
String[] parts = line.split("\\\\|");          // "|" is special in regex → escape it
String name = parts[0].trim();                 // "Lamp"
int qty = Integer.parseInt(parts[1].trim());   // 4
double price = Double.parseDouble(parts[2].trim());

String s = "Lima (9750000) - Peru";
int open = s.indexOf('(');                     // position of a marker
String city = s.substring(0, open).trim();     // "Lima"`, 'split, trim, parse, indexOf, substring')}
<ul>
  <li><code>split</code> takes a <em>regular expression</em>. The characters <code>| . * + ? ( ) [ ]</code> are special and need <code>\\\\</code> in front. Commas, colons and semicolons are safe as they are.</li>
  <li>Always <code>trim()</code> before parsing numbers: <code>Integer.parseInt(" 4")</code> throws.</li>
  <li>Handle special words explicitly (like <code>"None"</code> meaning an empty list).</li>
  <li>While developing, print one parsed object to check that every field is right.</li>
</ul>`,
      quiz: {
        q: 'What does "a.b.c".split(".") return?',
        options: ['["a", "b", "c"]', 'An empty array, because "." matches every character', '["a.b.c"]'],
        answer: 1,
        why: 'In a regex "." means "any character", so every character is a separator and nothing is left. Use split("\\\\.").',
      },
    },
    {
      id: 'assignment',
      title: 'Assignment map: rules that apply to every WA',
      body: `
<ul>
  <li>Use the provided IntelliJ project. Do not rename files, and keep it compiling after every step.</li>
  <li>Implement inside the skeleton where the comments say. Ignoring the skeleton can mean an automatic 0.</li>
  <li>Use the approach the PDF names (stack evaluation in WA1, Hibbard deletion in WA2, rotations and flips in WA3, and so on).</li>
  <li>Step 5 is a feedback message <em>in your own words</em>. Generic or AI-written text gets no points.</li>
  <li>Submit a <code>.zip</code> named <code>Last, First.zip</code> exactly as your name appears in D2L.</li>
</ul>
<p>Every later topic ends with a section like this one, listing the skills its assignment needs and the pitfalls its PDF warns about.</p>`,
    },
  ],
};
