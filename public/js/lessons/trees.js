import { code } from '../ui.js';
import { BST, parseExpr, tokenize } from '../ds.js';
import { treeSvg } from '../viz.js';

const sample = new BST([5, 3, 8, 1, 4, 9]).root;
const expr = parseExpr(tokenize('(2+(4*5))'));

export default {
  id: 'trees',
  intro: 'Nodes, links and recursion. This is the foundation for every tree in the course, and the topic of Weekly Assignment 1 (expression trees).',
  sections: [
    {
      id: 'vocab',
      title: 'Tree vocabulary',
      body: `
<div class="figure">${treeSvg(sample)}</div>
<ul class="defs">
  <li><b>Root</b>: the top node (5). <b>Leaf</b>: a node with no children (1, 4, 9).</li>
  <li><b>Binary</b>: each node has at most two children, <code>left</code> and <code>right</code>.</li>
  <li><b>Depth</b> of a node: edges from the root down to it (5 is depth 0; 1, 4 and 9 are depth 2).</li>
  <li><b>Height</b> of a tree: depth of its deepest node (here 2). Empty tree: −1, single node: 0.</li>
  <li><b>Subtree</b>: any node together with everything below it. That is itself a tree, which is why recursion fits.</li>
</ul>
<p>In tests on this site, trees are written in <b>level order</b> with <code>null</code> for missing children: the tree above is <code>[5, 3, 8, 1, 4, null, 9]</code>.</p>`,
      quiz: { q: 'In the tree above, how many nodes have exactly one child?', options: ['0', '1', '2'], answer: 1, why: 'Only 8 has a single child (9). Node 3 has two children, and the leaves have none.' },
    },
    {
      id: 'pattern',
      title: 'The universal tree recursion',
      body: `
<p>Almost every tree method is this template. Only the base value and the combine line change:</p>
${code(`
static RESULT f(TreeNode x) {
    if (x == null) return BASE;          // empty tree
    RESULT left = f(x.left);
    RESULT right = f(x.right);
    return COMBINE(x.val, left, right);
}

static int size(TreeNode x)   { return x == null ? 0  : 1 + size(x.left) + size(x.right); }
static int height(TreeNode x) { return x == null ? -1 : 1 + Math.max(height(x.left), height(x.right)); }
static int sum(TreeNode x)    { return x == null ? 0  : x.val + sum(x.left) + sum(x.right); }`, 'One shape, many methods')}
<p>Sometimes a node needs to answer differently, like a leaf in <code>countLeaves</code>. Add that check right after the null check.</p>
<p><b>Practice now:</b> the <em>Tree metrics</em> problems drill exactly this template with eight variations.</p>`,
    },
    {
      id: 'traversals',
      title: 'Traversals: pre, in, post and level order',
      body: `
<p>A traversal visits every node once. In the three recursive orders, the only difference is <em>when</em> you record the node:</p>
${code(`
void pre(Node x)  { if (x == null) return; visit(x); pre(x.left);  pre(x.right); }
void in(Node x)   { if (x == null) return; in(x.left);  visit(x);  in(x.right);  }
void post(Node x) { if (x == null) return; post(x.left); post(x.right); visit(x); }`, 'Move one line, get a different order')}
<div class="figure">${treeSvg(sample)}</div>
<table class="mini"><tr><th>Preorder</th><td>5 3 1 4 8 9</td></tr><tr><th>Inorder</th><td>1 3 4 5 8 9 <span class="muted">(sorted, because this is a BST)</span></td></tr><tr><th>Postorder</th><td>1 4 3 9 8 5</td></tr><tr><th>Level order</th><td>5 3 8 1 4 9</td></tr></table>
<p><b>Level order</b> is different: it uses a <strong>queue</strong>, not recursion. Enqueue the root. Then repeat: dequeue a node, visit it, and enqueue its non-null children. The tracing drills will train all four until they are automatic.</p>`,
      quiz: { q: 'Which traversal of a tree visits a node only after both of its subtrees?', options: ['Preorder', 'Inorder', 'Postorder'], answer: 2, why: 'Post = after. Left subtree, right subtree, then the node.' },
    },
    {
      id: 'expression-trees',
      title: 'Expression trees',
      body: `
<p>An arithmetic expression is naturally a tree: <strong>operators are internal nodes, operands are leaves</strong>. The tree for <code>(2+(4*5))</code>:</p>
<div class="figure">${treeSvg(expr)}</div>
<p>The shape <em>is</em> the order of operations: <code>*</code> sits deeper, so it must be computed first. No parentheses are needed inside the tree.</p>
<ul>
  <li><b>Inorder</b> with parentheses around each operator gives back infix: <code>(2+(4*5))</code>.</li>
  <li><b>Preorder</b> gives prefix (Polish) notation: <code>+ 2 * 4 5</code>.</li>
  <li><b>Postorder</b> gives postfix (Reverse Polish) notation: <code>2 4 5 * +</code>. Postfix needs no parentheses, and a stack can evaluate it.</li>
</ul>`,
      lab: 'expr',
    },
    {
      id: 'tokens',
      title: 'From text to tokens',
      body: `
<p>A string like <code>"(2 + (4*5))"</code> is awkward to work with. First cut it into <strong>tokens</strong>: operands, operators and parentheses. Skip spaces and tabs.</p>
${code(`
for (int i = 0; i < expr.length(); i++) {
    char c = expr.charAt(i);
    if (c == ' ' || c == '\\t') continue;            // ignore whitespace
    if (Character.isDigit(c)) { /* operand token */ }
    else if (c == '+' || c == '-' || c == '*' || c == '/') { /* operator token */ }
    else if (c == '(') { /* left paren */ }
    else if (c == ')') { /* right paren */ }
}`, 'Character-by-character scanning (single-digit operands)')}
<p>When numbers are single digits, each digit character is one operand, so you don’t need regular expressions. Each kind of token should carry its <em>type</em>; in your assignment that is the provided <code>TokenType</code> enum.</p>`,
    },
    {
      id: 'recursive-parsing',
      title: 'Building a tree by recursion, one token at a time',
      body: `
<p>Fully parenthesized expressions have a very regular grammar:</p>
<pre class="grammar">expression  :=  digit   |   "(" expression operator expression ")"</pre>
<p>A grammar like that turns straight into a recursive method. Each call reads exactly one expression and returns its tree. All calls share <strong>one position</strong> in the token list, which moves forward as tokens are consumed.</p>
<p>Here is the same idea on the simpler <em>prefix</em> form (<code>+ 2 * 4 5</code>), which is also a practice problem:</p>
${code(`
// pos is shared by every call (an int[] of length 1, or a field)
ExprNode build(List<String> tokens, int[] pos) {
    String t = tokens.get(pos[0]++);              // consume one token
    ExprNode node = new ExprNode(t);
    if (node.isOperator()) {                      // an operator needs two sub-expressions:
        node.left = build(tokens, pos);           //   read the whole left one
        node.right = build(tokens, pos);          //   then the whole right one
    }
    return node;                                  // a digit is a leaf: done
}`, 'Recursive descent for prefix notation')}
<p>For the parenthesized form, the steps per call become: consume <code>(</code> → build left → read the operator → build right → consume <code>)</code>. Figure 1 in your WA1 PDF traces exactly this. Work through it with a pencil after trying the <em>fromPrefix</em> problem.</p>
<div class="callout"><b>Why a shared position?</b> When a recursive call returns, the caller must continue from wherever the callee stopped. A local int would be copied, so the caller would never see the progress.</div>`,
      quiz: {
        q: 'While building the tree for (2+(4*5)), right after the call that builds "2" returns, which token comes next?',
        options: ['(', '+', '4'],
        answer: 1,
        why: 'The outer call consumed "(", then built the left operand "2". Next it reads the operator "+", and after that it builds the right operand.',
      },
    },
    {
      id: 'postfix-eval',
      title: 'Evaluating postfix with a stack',
      body: `
<p>Once you have postfix (from a postorder traversal), a stack computes the value. For <code>2 4 5 * +</code>:</p>
<table class="mini trace"><tr><th>token</th><th>action</th><th>stack (bottom → top)</th></tr>
<tr><td>2</td><td>push</td><td>2</td></tr><tr><td>4</td><td>push</td><td>2 4</td></tr><tr><td>5</td><td>push</td><td>2 4 5</td></tr>
<tr><td>*</td><td>pop 5 (right), pop 4 (left), push 4×5</td><td>2 20</td></tr><tr><td>+</td><td>pop 20 (right), pop 2 (left), push 2+20</td><td>22</td></tr></table>
<p>For a valid expression, the stack ends with exactly one value. If it runs out early, or ends with more than one, either the expression or your code is wrong.</p>
<p>Use <code>double</code> values so that <code>/</code> works like real division (7/2 = 3.5).</p>`,
    },
    {
      id: 'assignment',
      title: 'Assignment map: WA1 (binary trees calculator)',
      body: `
<table class="mini map"><tr><th>Step</th><th>Skill</th><th>Practice here</th></tr>
<tr><td>1. Tokenize</td><td>char scanning, Token objects, enum types, skip whitespace</td><td>Parsing problems, “From text to tokens”</td></tr>
<tr><td>2. Build tree</td><td>recursive descent with a shared position</td><td><em>fromPrefix</em>, the expression lab</td></tr>
<tr><td>3. Post-order</td><td>traversal into a list</td><td>Traversal problems</td></tr>
<tr><td>4. Evaluate</td><td>stack algorithm, operand order</td><td>Stack: <em>evalPostfix</em>, postfix drills</td></tr></table>
<p><b>Pitfalls the PDF calls out:</b> operand order for − and /; Step 4 must use the stack algorithm, not direct tree evaluation; assume valid input, so a broken stack state means a bug in your code.</p>`,
    },
  ],
};
