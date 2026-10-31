import { code } from '../ui.js';

export default {
  id: 'method',
  intro: 'Before any data structure: a repeatable way to attack a problem you have never seen. Every later lesson uses this method.',
  sections: [
    {
      id: 'mindset',
      title: 'You do not need to “know the code”',
      body: `
<p>Nobody who is good at this has memorized the code. What they have is a <strong>process</strong>, plus a handful of patterns that keep coming back. This site teaches both, slowly, in that order.</p>
<p>When you face something like <em>“implement put for a red-black tree”</em>, the feeling of “I don’t know where to start” is normal. That feeling just means you have not broken the problem down yet. Breaking it down is a skill you can learn.</p>
<div class="callout"><b>The promise of this guide.</b> If you follow the method below on every problem, including the easy ones, you will be able to write all six weekly assignments yourself. The easy ones are where you build the habit.</div>`,
    },
    {
      id: 'loop',
      title: 'The six-step loop',
      body: `
<ol class="steps">
  <li><b>Restate.</b> In one sentence of your own: what goes in, what comes out? Write down the method signature.</li>
  <li><b>Example by hand.</b> Take the smallest interesting input and solve it on paper. Then do a second one. No code yet.</li>
  <li><b>Name the pattern.</b> Is this a traversal? A “handle null, then combine left and right” recursion? A “get, then put”? A queue-based search? Most problems in this course are one of about eight patterns.</li>
  <li><b>Skeleton first.</b> Write the signature, the base case and the return. Make it <em>compile</em>. (The assignments give 0 points to code that does not compile.)</li>
  <li><b>Fill in one piece at a time.</b> Run the tests after each piece. Small steps make bugs easy to find.</li>
  <li><b>Read the failure.</b> A failing test tells you the input, what was expected and what you returned. Re-trace that exact input by hand and find the first place your code disagrees with you.</li>
</ol>
<p>You will see these steps as an <em>Approach</em> tab on every practice problem.</p>`,
      quiz: {
        q: 'You wrote half of a method and it does not compile yet. What should you do?',
        options: ['Keep writing the rest, then fix all the errors at the end', 'Get it compiling now (even with a placeholder return), then continue', 'Delete it and start over'],
        answer: 1,
        why: 'Small compiling steps keep errors local. A pile of errors at the end is much harder to untangle, and the assignments give 0 for code that does not compile.',
      },
    },
    {
      id: 'recursion-faith',
      title: 'Thinking recursively: the leap of faith',
      body: `
<p>Trees and graphs are recursive structures: a tree is a node plus two smaller trees. So most methods on them are recursive too. The trick is to <strong>stop tracing the whole recursion in your head</strong>.</p>
<ol class="steps">
  <li><b>Base case:</b> the input so small you know the answer (usually <code>null</code>, an empty tree).</li>
  <li><b>Leap of faith:</b> <em>assume</em> the method already works for the smaller pieces (<code>x.left</code>, <code>x.right</code>).</li>
  <li><b>Combine:</b> using those answers, compute the answer for <code>x</code>.</li>
</ol>
${code(`
int size(Node x) {
    if (x == null) return 0;                 // 1. base case
    int left = size(x.left);                 // 2. trust it works
    int right = size(x.right);               //    on smaller trees
    return 1 + left + right;                 // 3. combine
}`, 'Counting nodes: the shape of most tree methods')}
<p>If you ever catch yourself tracing ten levels deep, stop and ask only: <em>“If the recursive calls give correct answers, is my combine step right?”</em></p>`,
      quiz: {
        q: 'For height(null) we return −1 so that a single leaf has height 1 + max(−1, −1) = 0. What is this reasoning an example of?',
        options: ['Choosing the base case so that the combine formula works', 'An off-by-one bug', 'Tail recursion'],
        answer: 0,
        why: 'Pick the base-case value that makes the general formula produce the right answer for the smallest real input.',
      },
    },
    {
      id: 'specs',
      title: 'Reading an assignment like an engineer',
      body: `
<p>Your weekly assignments share a structure, and each part tells you something:</p>
<ul>
  <li><b>The story</b> (mailroom, game engine, grades…) tells you what the <em>keys</em> and <em>values</em> are. Find them first.</li>
  <li><b>The steps</b> build on each other. Step 1 (often parsing or building the structure) must work before Step 3 can be tested.</li>
  <li><b>“You must follow this approach”</b> is a grading rule. If the PDF says “use a stack” or “use Hibbard deletion”, a different correct method can still lose points.</li>
  <li><b>The skeleton’s comments</b> say exactly where each piece goes. Read every TODO before writing anything.</li>
  <li><b>Hidden tests</b> exist. Passing the visible tests is necessary but not enough. Think about edge cases: empty structure, missing key, duplicates, one element.</li>
</ul>
<div class="callout warn"><b>Academic integrity.</b> Your course forbids AI-generated code in submissions. Use this site to <em>learn</em>: practice the patterns on these different problems until you can write the assignment code yourself. Do not paste answers from here into your assignments.</div>`,
    },
    {
      id: 'debugging',
      title: 'Debugging with tests',
      body: `
<p>Every practice problem here comes with a hidden test file that compiles and runs your Java with the same JDK IntelliJ uses. A result looks like this:</p>
<div class="fake-test fail"><b>FAIL</b> height([5, 3, null, 1])<pre>height([5, 3, null, 1])
  expected: 2
  but got:  1</pre></div>
<p>To use it:</p>
<ol class="steps">
  <li>Draw that exact input. <code>[5, 3, null, 1]</code> is level order: 5 is the root, 3 is its left child, 5 has no right child, and 1 is 3’s left child.</li>
  <li>Compute the expected answer yourself to confirm you understand the task.</li>
  <li>Trace <em>your</em> code on it. Where does it first differ?</li>
  <li>Still stuck? Add <code>System.out.println(...)</code> lines. Their output appears under the test results.</li>
</ol>
<p><b>Errors vs failures.</b> A <em>failure</em> is a wrong answer. An <em>error</em> is a crash (like NullPointerException), and the result tells you the line in your file where it happened.</p>`,
    },
    {
      id: 'using-site',
      title: 'How to use this guide',
      body: `
<p>For each topic, go in this order, and do not rush:</p>
<ol class="steps">
  <li><b>Learn.</b> Read the lesson sections and answer the check questions. Play with the lab inside the lesson.</li>
  <li><b>Drill.</b> Tracing drills ask you to predict what an algorithm does on a random input (a traversal order, the tree after a deletion, the DFS order…). If you cannot trace it, you cannot code it.</li>
  <li><b>Code.</b> The generator gives you a new problem every time. Start at difficulty ●○○.</li>
  <li><b>Master.</b> A problem type counts as mastered when you have solved <b>two different variants cleanly</b> (without the solution, and with fewer than 3 hints). Your mastery ring per topic tracks this.</li>
</ol>
<p>When you get stuck: open one hint, try again, then open the next. Use the solution only after a real attempt. Then generate a <em>new variant</em> and solve it from scratch. That last step is where most of the learning happens.</p>`,
    },
  ],
};
