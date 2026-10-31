// Foundations: recursion, ArrayList, stacks, string parsing and Comparable generics.
import { J, harness, stub, choose } from './kit.js';

function solutionClass(imports, methodsCode) {
  return `${imports}public class Solution {\n\n${methodsCode}\n}\n`;
}

/* ------------------------------------------------------------------ recursion */

const RECURSION = [
  {
    name: 'sumDigits',
    sig: 'public static int sumDigits(int n)',
    doc: 'Returns the sum of the decimal digits of n (n >= 0).\nSolve it recursively: no loops.',
    examples: [['sumDigits(4096)', '19'], ['sumDigits(7)', '7']],
    body: J`        if (n < 10) return n;
        return n % 10 + sumDigits(n / 10);`,
    ref: J`    static int refSumDigits(int n) { return n < 10 ? n : n % 10 + refSumDigits(n / 10); }`,
    tests: J`        int[] fixed = {0, 7, 10, 4096, 99999};
        List<Integer> inputs = new ArrayList<>();
        for (int f : fixed) inputs.add(f);
        for (int i = 0; i < 8; i++) inputs.add(rnd.nextInt(1000000000));
        for (int input : inputs) {
            final int n = input;
            test("sumDigits(" + n + ")", () -> eq("sumDigits(" + n + ")", refSumDigits(n), Solution.sumDigits(n)));
        }`,
    hints: [
      'What is the smallest n where you already know the answer without any work? A single digit (n &lt; 10) is its own digit sum.',
      '<code>n % 10</code> gives the last digit. <code>n / 10</code> removes the last digit.',
      'Answer = last digit + sumDigits(the rest).',
    ],
  },
  {
    name: 'power',
    sig: 'public static long power(long base, int exp)',
    doc: 'Returns base raised to exp (exp >= 0). power(x, 0) is 1.\nSolve it recursively: no loops and no Math.pow.',
    examples: [['power(2, 10)', '1024'], ['power(5, 0)', '1']],
    body: J`        if (exp == 0) return 1;
        return base * power(base, exp - 1);`,
    ref: J`    static long refPower(long b, int e) { return e == 0 ? 1 : b * refPower(b, e - 1); }`,
    tests: J`        long[][] fixed = {{2, 10}, {5, 0}, {0, 3}, {-3, 3}, {1, 40}};
        List<long[]> inputs = new ArrayList<>(Arrays.asList(fixed));
        for (int i = 0; i < 8; i++) inputs.add(new long[] {rnd.nextInt(19) - 9, rnd.nextInt(12)});
        for (long[] in : inputs) {
            final long b = in[0];
            final int e = (int) in[1];
            test("power(" + b + ", " + e + ")", () -> eq("power(" + b + ", " + e + ")", refPower(b, e), Solution.power(b, e)));
        }`,
    hints: [
      'Base case: anything to the power 0 is 1.',
      'x<sup>e</sup> = x · x<sup>e−1</sup>. The smaller problem is the same call with exp − 1.',
      'Bonus (faster): if exp is even, x<sup>e</sup> = (x<sup>e/2</sup>)². That halves the work each step.',
    ],
  },
  {
    name: 'countChar',
    sig: 'public static int countChar(String s, char c)',
    doc: 'Returns how many times c appears in s.\nSolve it recursively: no loops.',
    examples: [['countChar("banana", \'a\')', '3'], ['countChar("", \'x\')', '0']],
    body: J`        if (s.isEmpty()) return 0;
        int first = s.charAt(0) == c ? 1 : 0;
        return first + countChar(s.substring(1), c);`,
    ref: J`    static int refCount(String s, char c) { int n = 0; for (char x : s.toCharArray()) if (x == c) n++; return n; }
    static String randomWord(Random r, int len, String alphabet) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(alphabet.charAt(r.nextInt(alphabet.length())));
        return sb.toString();
    }`,
    tests: J`        List<String> words = new ArrayList<>(Arrays.asList("banana", "", "aaaa", "xyz"));
        for (int i = 0; i < 8; i++) words.add(randomWord(rnd, rnd.nextInt(15), "abcab"));
        for (String w : words) {
            final String s = w;
            final char c = "abx".charAt(rnd.nextInt(3));
            test("countChar(\"" + s + "\", '" + c + "')", () -> eq("countChar(\"" + s + "\", '" + c + "')", refCount(s, c), Solution.countChar(s, c)));
        }`,
    hints: [
      'Base case: the empty string contains zero of anything.',
      'Look at the first character only: is it c? Then let recursion handle <code>s.substring(1)</code>.',
      'Return (first char matches ? 1 : 0) + countChar(rest, c).',
    ],
  },
  {
    name: 'isPalindrome',
    sig: 'public static boolean isPalindrome(String s)',
    doc: 'Returns true if s reads the same forwards and backwards.\nSolve it recursively: no loops.',
    examples: [['isPalindrome("racecar")', 'true'], ['isPalindrome("ab")', 'false'], ['isPalindrome("")', 'true']],
    body: J`        if (s.length() <= 1) return true;
        if (s.charAt(0) != s.charAt(s.length() - 1)) return false;
        return isPalindrome(s.substring(1, s.length() - 1));`,
    ref: J`    static boolean refPal(String s) { return new StringBuilder(s).reverse().toString().equals(s); }
    static String randomWord(Random r, int len, String alphabet) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(alphabet.charAt(r.nextInt(alphabet.length())));
        return sb.toString();
    }`,
    tests: J`        List<String> words = new ArrayList<>(Arrays.asList("racecar", "ab", "", "a", "abba", "abca"));
        for (int i = 0; i < 6; i++) {
            String half = randomWord(rnd, rnd.nextInt(6), "abc");
            String mid = rnd.nextBoolean() ? "" : randomWord(rnd, 1, "abc");
            String pal = half + mid + new StringBuilder(half).reverse();
            words.add(rnd.nextInt(3) == 0 && pal.length() > 1 ? pal.substring(1) + "z" : pal);
        }
        for (String w : words) {
            final String s = w;
            test("isPalindrome(\"" + s + "\")", () -> eq("isPalindrome(\"" + s + "\")", refPal(s), Solution.isPalindrome(s)));
        }`,
    hints: [
      'Strings of length 0 or 1 are always palindromes. That is your base case.',
      'If the first and last characters differ, you can return false right away.',
      'Otherwise the answer is whatever the middle part (<code>s.substring(1, s.length() - 1)</code>) says.',
    ],
  },
  {
    name: 'reverse',
    sig: 'public static String reverse(String s)',
    doc: 'Returns s with its characters in reverse order.\nSolve it recursively: no loops and no StringBuilder.reverse().',
    examples: [['reverse("stack")', '"kcats"'], ['reverse("")', '""']],
    body: J`        if (s.isEmpty()) return s;
        return reverse(s.substring(1)) + s.charAt(0);`,
    ref: J`    static String refRev(String s) { return new StringBuilder(s).reverse().toString(); }
    static String randomWord(Random r, int len, String alphabet) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(alphabet.charAt(r.nextInt(alphabet.length())));
        return sb.toString();
    }`,
    tests: J`        List<String> words = new ArrayList<>(Arrays.asList("stack", "", "a", "ab"));
        for (int i = 0; i < 8; i++) words.add(randomWord(rnd, rnd.nextInt(12), "abcdefgh"));
        for (String w : words) {
            final String s = w;
            test("reverse(\"" + s + "\")", () -> eq("reverse(\"" + s + "\")", refRev(s), Solution.reverse(s)));
        }`,
    hints: [
      'Base case: reversing the empty string gives the empty string.',
      'Put the first character at the end: reverse(rest) + first.',
      '<code>return reverse(s.substring(1)) + s.charAt(0);</code> is the whole idea.',
    ],
  },
  {
    name: 'maxFrom',
    sig: 'public static int maxFrom(int[] a, int i)',
    doc: 'Returns the largest value among a[i], a[i+1], ..., a[a.length-1].\nAssume 0 <= i < a.length. Solve it recursively: no loops.\n(This "index parameter" pattern is how recursive helpers walk arrays.)',
    examples: [['maxFrom({3, 9, 2, 7}, 0)', '9'], ['maxFrom({3, 9, 2, 7}, 2)', '7']],
    body: J`        if (i == a.length - 1) return a[i];
        return Math.max(a[i], maxFrom(a, i + 1));`,
    ref: J`    static int refMax(int[] a, int i) { int m = a[i]; for (int k = i; k < a.length; k++) m = Math.max(m, a[k]); return m; }`,
    tests: J`        for (int t = 0; t < 12; t++) {
            int n = 1 + rnd.nextInt(10);
            final int[] a = new int[n];
            for (int k = 0; k < n; k++) a[k] = rnd.nextInt(201) - 100;
            final int i = rnd.nextInt(n);
            test("maxFrom(" + Arrays.toString(a) + ", " + i + ")", () -> eq("maxFrom", refMax(a, i), Solution.maxFrom(a, i)));
        }`,
    hints: [
      'When i is the last index, there is only one value to consider.',
      'Otherwise compare a[i] against the max of everything after it.',
      '<code>Math.max(a[i], maxFrom(a, i + 1))</code>',
    ],
  },
];

const recursion = {
  id: 'java-recursion',
  topic: 'java',
  level: 1,
  title: 'Recursion warm-up',
  skill: 'Base case + smaller subproblem',
  variants: RECURSION.length,
  generate(rng, seed, vi) {
    const v = choose(rng, RECURSION, vi);
    return {
      title: `Recursion: ${v.name}`,
      story: 'Every tree and graph algorithm in this course is recursive. These small problems train the reflex: <em>find the base case, shrink the problem, trust the recursive call.</em>',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass('', stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: v.tests, helpers: v.ref }),
      solution: solutionClass('', `    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: [
        'Write down 2–3 tiny inputs and their answers by hand.',
        'Find the input so small the answer is obvious. That is the base case, and it goes first in the method.',
        'Assume the method already works on a smaller input. How do you turn that answer into the answer for the full input?',
        'Check that every recursive call moves toward the base case, or it will never stop.',
      ],
      noLoops: true,
    };
  },
};

/* ------------------------------------------------------------------ ArrayList */

const LISTS = [
  {
    name: 'dedupe',
    sig: 'public static ArrayList<Integer> dedupe(ArrayList<Integer> list)',
    doc: 'Returns a NEW list with duplicates removed, keeping the first occurrence of each value\nand the original order. Do not modify the input list.',
    examples: [['dedupe([4, 1, 4, 2, 1])', '[4, 1, 2]']],
    body: J`        ArrayList<Integer> result = new ArrayList<>();
        HashSet<Integer> seen = new HashSet<>();
        for (int x : list) {
            if (seen.add(x)) result.add(x);
        }
        return result;`,
    ref: J`    static ArrayList<Integer> ref(ArrayList<Integer> list) { return new ArrayList<>(new LinkedHashSet<>(list)); }`,
    tests: J`        for (int t = 0; t < 10; t++) {
            final ArrayList<Integer> in = new ArrayList<>();
            int n = rnd.nextInt(12);
            for (int k = 0; k < n; k++) in.add(rnd.nextInt(8));
            final ArrayList<Integer> before = new ArrayList<>(in);
            test("dedupe(" + in + ")", () -> {
                eq("dedupe(" + before + ")", ref(before), Solution.dedupe(in));
                eq("input list must not change", before, in);
            });
        }`,
    hints: ['Build a fresh <code>ArrayList</code> for the answer.', 'Walk the input once. Add a value only if you have not seen it yet.', 'A <code>HashSet</code> answers "have I seen this?" in constant time (<code>set.add</code> returns false if it was already there).'],
  },
  {
    name: 'runningSum',
    sig: 'public static ArrayList<Integer> runningSum(ArrayList<Integer> list)',
    doc: 'Returns a new list where element i is list[0] + list[1] + ... + list[i].',
    examples: [['runningSum([3, 1, 4, 1])', '[3, 4, 8, 9]'], ['runningSum([])', '[]']],
    body: J`        ArrayList<Integer> result = new ArrayList<>();
        int total = 0;
        for (int x : list) {
            total += x;
            result.add(total);
        }
        return result;`,
    ref: J`    static ArrayList<Integer> ref(ArrayList<Integer> list) { ArrayList<Integer> r = new ArrayList<>(); int s = 0; for (int x : list) { s += x; r.add(s); } return r; }`,
    tests: J`        for (int t = 0; t < 10; t++) {
            final ArrayList<Integer> in = new ArrayList<>();
            int n = rnd.nextInt(10);
            for (int k = 0; k < n; k++) in.add(rnd.nextInt(41) - 20);
            test("runningSum(" + in + ")", () -> eq("runningSum(" + in + ")", ref(in), Solution.runningSum(new ArrayList<>(in))));
        }`,
    hints: ['Keep one variable with the total so far.', 'For each element: add it to the total, then append the total to the result.'],
  },
  {
    name: 'withPrefix',
    sig: 'public static ArrayList<String> withPrefix(ArrayList<String> words, String prefix)',
    doc: 'Returns the words that start with prefix, in their original order.',
    examples: [['withPrefix(["tree", "trie", "heap", "trap"], "tr")', '["tree", "trie", "trap"]']],
    body: J`        ArrayList<String> result = new ArrayList<>();
        for (String w : words) {
            if (w.startsWith(prefix)) result.add(w);
        }
        return result;`,
    ref: J`    static ArrayList<String> ref(ArrayList<String> words, String p) { ArrayList<String> r = new ArrayList<>(); for (String w : words) if (w.startsWith(p)) r.add(w); return r; }`,
    tests: J`        String[] pool = {"tree", "trie", "heap", "trap", "graph", "grid", "hash", "hasty", "stack", "star", "t", ""};
        String[] prefixes = {"tr", "gr", "has", "st", "x", "", "t"};
        for (int t = 0; t < 10; t++) {
            final ArrayList<String> in = new ArrayList<>();
            int n = rnd.nextInt(8);
            for (int k = 0; k < n; k++) in.add(pool[rnd.nextInt(pool.length)]);
            final String p = prefixes[rnd.nextInt(prefixes.length)];
            test("withPrefix(" + show(in) + ", \"" + p + "\")", () -> eq("withPrefix", ref(in, p), Solution.withPrefix(in, p)));
        }`,
    hints: ['<code>String.startsWith(prefix)</code> does the check for you.', 'Loop, test, add. Return the new list.'],
  },
  {
    name: 'mergeSorted',
    sig: 'public static ArrayList<Integer> mergeSorted(ArrayList<Integer> a, ArrayList<Integer> b)',
    doc: 'a and b are each sorted ascending. Returns one sorted list containing all elements of both\n(keep duplicates). Do it in one pass with two indices; do not call sort().',
    examples: [['mergeSorted([1, 4, 9], [2, 4, 10, 11])', '[1, 2, 4, 4, 9, 10, 11]']],
    body: J`        ArrayList<Integer> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            if (a.get(i) <= b.get(j)) result.add(a.get(i++));
            else result.add(b.get(j++));
        }
        while (i < a.size()) result.add(a.get(i++));
        while (j < b.size()) result.add(b.get(j++));
        return result;`,
    ref: J`    static ArrayList<Integer> ref(List<Integer> a, List<Integer> b) { ArrayList<Integer> r = new ArrayList<>(a); r.addAll(b); Collections.sort(r); return r; }
    static ArrayList<Integer> sortedList(Random r) { ArrayList<Integer> l = new ArrayList<>(); int n = r.nextInt(7); for (int k = 0; k < n; k++) l.add(r.nextInt(20)); Collections.sort(l); return l; }`,
    tests: J`        for (int t = 0; t < 10; t++) {
            final ArrayList<Integer> a = sortedList(rnd), b = sortedList(rnd);
            test("mergeSorted(" + a + ", " + b + ")", () -> eq("mergeSorted", ref(a, b), Solution.mergeSorted(new ArrayList<>(a), new ArrayList<>(b))));
        }`,
    hints: ['Keep an index into each list, starting at 0.', 'While both still have elements, take the smaller front element and advance that index.', 'When one list runs out, copy the rest of the other.'],
  },
];

const lists = {
  id: 'java-lists',
  topic: 'java',
  level: 1,
  title: 'ArrayList workout',
  skill: 'Building and returning lists',
  variants: LISTS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, LISTS, vi);
    return {
      title: `ArrayList: ${v.name}`,
      story: 'Almost every assignment returns an <code>ArrayList</code> (traversal results, query results, schedules). Being fluent with create, loop, add and return saves a lot of time.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass('import java.util.*;\n\n', stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: v.tests, helpers: v.ref }),
      solution: solutionClass('import java.util.*;\n\n', `    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Create the result list first: <code>ArrayList&lt;...&gt; result = new ArrayList&lt;&gt;();</code>', 'Decide what to do with ONE element, then wrap that in a loop.', 'Return the result. Check the empty-input case.'],
    };
  },
};

/* ------------------------------------------------------------------ stacks */

const STACKS = [
  {
    name: 'isBalanced',
    sig: 'public static boolean isBalanced(String s)',
    doc: 'Returns true if every bracket in s is closed by the matching bracket in the right order.\nBrackets are ( ) [ ] { }. Ignore every other character. Use a Stack.',
    examples: [['isBalanced("a(b[c]{d})")', 'true'], ['isBalanced("(]")', 'false'], ['isBalanced("((")', 'false']],
    body: J`        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
            }
        }
        return stack.isEmpty();`,
    ref: J`    static boolean ref(String s) {
        Deque<Character> st = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if ("([{".indexOf(c) >= 0) st.push(c);
            else if (")]}".indexOf(c) >= 0) {
                if (st.isEmpty() || "([{".indexOf(st.pop()) != ")]}".indexOf(c)) return false;
            }
        }
        return st.isEmpty();
    }
    static String gen(Random r, int depth) {
        if (depth == 0 || r.nextInt(3) == 0) return r.nextBoolean() ? "x" : "";
        String[] pairs = {"()", "[]", "{}"};
        String p = pairs[r.nextInt(3)];
        return p.charAt(0) + gen(r, depth - 1) + p.charAt(1) + gen(r, depth - 1);
    }`,
    tests: J`        List<String> cases = new ArrayList<>(Arrays.asList("a(b[c]{d})", "(]", "((", "", ")(", "{[()()]}", "no brackets"));
        for (int t = 0; t < 8; t++) {
            String s = gen(rnd, 4);
            if (rnd.nextBoolean() && s.length() > 0) {
                char[] cs = s.toCharArray();
                int i = rnd.nextInt(cs.length);
                cs[i] = "()[]{}".charAt(rnd.nextInt(6));
                s = new String(cs);
            }
            cases.add(s);
        }
        for (String c : cases) {
            final String s = c;
            test("isBalanced(\"" + s + "\")", () -> eq("isBalanced(\"" + s + "\")", ref(s), Solution.isBalanced(s)));
        }`,
    hints: ['Opening brackets get pushed onto the stack.', 'A closing bracket must match the most recent unmatched opener, which is the top of the stack. If the stack is empty, or the top is the wrong kind, return false.', 'At the end, any openers left on the stack were never closed.'],
  },
  {
    name: 'evalPostfix',
    sig: 'public static int evalPostfix(String expr)',
    doc: 'expr is a postfix expression with tokens separated by single spaces, e.g. "3 4 + 2 *".\nOperands are non-negative integers (possibly multi-digit). Operators are + - *.\nReturn its value using a Stack. Careful: for "a b -" the answer is a - b.',
    examples: [['evalPostfix("3 4 + 2 *")', '14'], ['evalPostfix("10 3 -")', '7']],
    body: J`        Stack<Integer> stack = new Stack<>();
        for (String token : expr.split(" ")) {
            if (token.equals("+") || token.equals("-") || token.equals("*")) {
                int right = stack.pop();
                int left = stack.pop();
                if (token.equals("+")) stack.push(left + right);
                else if (token.equals("-")) stack.push(left - right);
                else stack.push(left * right);
            } else {
                stack.push(Integer.parseInt(token));
            }
        }
        return stack.pop();`,
    ref: J`    static int[] genValue = new int[1];
    static String gen(Random r, int depth) {
        if (depth == 0 || r.nextInt(3) == 0) { int v = r.nextInt(15); genValue[0] = v; return String.valueOf(v); }
        String a = gen(r, depth - 1); int va = genValue[0];
        String b = gen(r, depth - 1); int vb = genValue[0];
        char op = "+-*".charAt(r.nextInt(3));
        genValue[0] = op == '+' ? va + vb : op == '-' ? va - vb : va * vb;
        return a + " " + b + " " + op;
    }`,
    tests: J`        String[] fixed = {"3 4 + 2 *", "10 3 -", "7", "2 3 4 * -", "12 2 - 3 -"};
        int[] fixedAns = {14, 7, 7, -10, 7};
        for (int i = 0; i < fixed.length; i++) {
            final String e = fixed[i];
            final int ans = fixedAns[i];
            test("evalPostfix(\"" + e + "\")", () -> eq("evalPostfix(\"" + e + "\")", ans, Solution.evalPostfix(e)));
        }
        for (int t = 0; t < 7; t++) {
            final String e = gen(rnd, 3);
            final int ans = genValue[0];
            test("evalPostfix(\"" + e + "\")", () -> eq("evalPostfix(\"" + e + "\")", ans, Solution.evalPostfix(e)));
        }`,
    hints: ['Split into tokens: <code>expr.split(" ")</code>.', 'A number gets pushed. An operator pops two values. The FIRST pop is the RIGHT operand.', 'Push the result back. At the end the stack holds exactly one value: the answer.'],
  },
  {
    name: 'reverseWords',
    sig: 'public static String reverseWords(String sentence)',
    doc: 'Words in sentence are separated by single spaces. Return the words in reverse order,\njoined by single spaces, using a Stack. reverseWords("") is "".',
    examples: [['reverseWords("push pop peek")', '"peek pop push"']],
    body: J`        if (sentence.isEmpty()) return "";
        Stack<String> stack = new Stack<>();
        for (String w : sentence.split(" ")) stack.push(w);
        StringBuilder sb = new StringBuilder();
        while (!stack.isEmpty()) {
            sb.append(stack.pop());
            if (!stack.isEmpty()) sb.append(' ');
        }
        return sb.toString();`,
    ref: J`    static String ref(String s) { if (s.isEmpty()) return ""; List<String> w = new ArrayList<>(Arrays.asList(s.split(" "))); Collections.reverse(w); return String.join(" ", w); }`,
    tests: J`        String[] pool = {"push", "pop", "peek", "stack", "queue", "lifo", "fifo", "node"};
        List<String> cases = new ArrayList<>(Arrays.asList("push pop peek", "", "single"));
        for (int t = 0; t < 8; t++) {
            int n = 1 + rnd.nextInt(6);
            List<String> w = new ArrayList<>();
            for (int k = 0; k < n; k++) w.add(pool[rnd.nextInt(pool.length)]);
            cases.add(String.join(" ", w));
        }
        for (String c : cases) {
            final String s = c;
            test("reverseWords(\"" + s + "\")", () -> eq("reverseWords(\"" + s + "\")", ref(s), Solution.reverseWords(s)));
        }`,
    hints: ['Push every word. A stack hands them back last-in-first-out, which is reversed.', 'Pop into a StringBuilder, adding a space between words but not after the last one.'],
  },
];

const stacks = {
  id: 'java-stacks',
  topic: 'java',
  level: 2,
  title: 'Stack problems',
  skill: 'LIFO thinking, operand order',
  variants: STACKS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, STACKS, vi);
    return {
      title: `Stack: ${v.name}`,
      story: 'Stacks are the tool behind expression evaluation, undo history and recursion itself. Watch the <strong>order</strong> things come back out.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc.split('\n').join(' ')}`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass('import java.util.*;\n\n', stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: v.tests, helpers: v.ref }),
      solution: solutionClass('import java.util.*;\n\n', `    ${v.sig} {\n${v.body}\n    }`),
      hints: v.hints,
      approach: ['Trace a tiny example on paper and draw the stack after each step.', 'Decide what happens for each kind of token or character.', 'Ask what the stack should look like at the very end, and what an invalid state looks like.'],
    };
  },
};

/* ------------------------------------------------------------------ parsing */

const PARSE = [
  {
    cls: 'Product',
    format: '"name | quantity | price"',
    sample: '"Desk Lamp | 4 | 19.99"',
    provided: J`/** Provided. Do not change this file. */
public class Product {
    final String name;
    final int quantity;
    final double price;

    public Product(String name, int quantity, double price) {
        this.name = name;
        this.quantity = quantity;
        this.price = price;
    }

    @Override
    public String toString() {
        return "Product(" + name + ", " + quantity + ", " + String.format("%.2f", price) + ")";
    }
}
`,
    sig: 'public static ArrayList<Product> parse(List<String> lines)',
    doc: 'Each line looks like "name | quantity | price", e.g. "Desk Lamp | 4 | 19.99".\nThere may be extra spaces around each field. Return one Product per line, in order.',
    body: J`        ArrayList<Product> result = new ArrayList<>();
        for (String line : lines) {
            String[] parts = line.split("\\|");
            String name = parts[0].trim();
            int quantity = Integer.parseInt(parts[1].trim());
            double price = Double.parseDouble(parts[2].trim());
            result.add(new Product(name, quantity, price));
        }
        return result;`,
    gen: J`    static String[] NAMES = {"Desk Lamp", "Cable", "Mouse Pad", "Monitor Arm", "Pen", "USB Hub"};
    static String sp(Random r) { return " ".repeat(r.nextInt(3)); }
    static Object[] make(Random r) {
        String n = NAMES[r.nextInt(NAMES.length)];
        int q = r.nextInt(50);
        double p = r.nextInt(10000) / 100.0;
        String line = sp(r) + n + sp(r) + "|" + sp(r) + q + sp(r) + "|" + sp(r) + String.format(java.util.Locale.ROOT, "%.2f", p) + sp(r);
        return new Object[] {line, new Product(n, q, p).toString()};
    }`,
    hint: 'The separator <code>|</code> is special in regular expressions, so split with <code>line.split("\\\\|")</code>. Then <code>trim()</code> every part.',
  },
  {
    cls: 'City',
    format: '"City Name (population) - Country"',
    sample: '"Lima (9750000) - Peru"',
    provided: J`/** Provided. Do not change this file. */
public class City {
    final String name;
    final long population;
    final String country;

    public City(String name, long population, String country) {
        this.name = name;
        this.population = population;
        this.country = country;
    }

    @Override
    public String toString() {
        return "City(" + name + ", " + population + ", " + country + ")";
    }
}
`,
    sig: 'public static ArrayList<City> parse(List<String> lines)',
    doc: 'Each line looks like "City Name (population) - Country", e.g. "Lima (9750000) - Peru".\nCity names may contain spaces. Return one City per line, in order.',
    body: J`        ArrayList<City> result = new ArrayList<>();
        for (String line : lines) {
            int open = line.indexOf('(');
            int close = line.indexOf(')');
            String name = line.substring(0, open).trim();
            long population = Long.parseLong(line.substring(open + 1, close).trim());
            String country = line.substring(line.indexOf('-', close) + 1).trim();
            result.add(new City(name, population, country));
        }
        return result;`,
    gen: J`    static String[][] DATA = {{"Lima", "Peru"}, {"La Paz", "Bolivia"}, {"New York", "USA"}, {"Rio de Janeiro", "Brazil"}, {"Chicago", "USA"}, {"Kyoto", "Japan"}};
    static Object[] make(Random r) {
        String[] d = DATA[r.nextInt(DATA.length)];
        long pop = 1000 + r.nextInt(20000000);
        String line = d[0] + " (" + pop + ") - " + d[1];
        return new Object[] {line, new City(d[0], pop, d[1]).toString()};
    }`,
    hint: 'Find the positions of <code>(</code> and <code>)</code> with <code>indexOf</code>. The name is everything before <code>(</code>, the number is between them, and the country comes after the <code>-</code>.',
  },
  {
    cls: 'Team',
    format: '"CODE: Team Name; Players: p1, p2, p3."',
    sample: '"T07: Night Owls; Players: Ana, Bo, Cy."  or  "T02: Solo; Players: None."',
    provided: J`import java.util.ArrayList;

/** Provided. Do not change this file. */
public class Team {
    final String code;
    final String name;
    final ArrayList<String> players;

    public Team(String code, String name, ArrayList<String> players) {
        this.code = code;
        this.name = name;
        this.players = players;
    }

    @Override
    public String toString() {
        return "Team(" + code + ", " + name + ", " + players + ")";
    }
}
`,
    sig: 'public static ArrayList<Team> parse(List<String> lines)',
    doc: 'Each line looks like "CODE: Team Name; Players: p1, p2, p3." (note the final period).\nIf the team has no players the line ends with "Players: None." and the list must be empty.\nReturn one Team per line, in order.',
    body: J`        ArrayList<Team> result = new ArrayList<>();
        for (String line : lines) {
            String[] halves = line.split(";");
            String[] head = halves[0].split(":");
            String code = head[0].trim();
            String name = head[1].trim();
            String rest = halves[1].trim();
            rest = rest.substring(rest.indexOf(':') + 1, rest.lastIndexOf('.')).trim();
            ArrayList<String> players = new ArrayList<>();
            if (!rest.equals("None")) {
                for (String p : rest.split(",")) players.add(p.trim());
            }
            result.add(new Team(code, name, players));
        }
        return result;`,
    gen: J`    static String[] NAMES = {"Night Owls", "Red Pandas", "Solo", "Graph Walkers", "Root Nodes"};
    static String[] PEOPLE = {"Ana", "Bo", "Cy", "Dee", "Eli", "Fay"};
    static Object[] make(Random r) {
        String code = "T" + String.format("%02d", r.nextInt(100));
        String name = NAMES[r.nextInt(NAMES.length)];
        ArrayList<String> ps = new ArrayList<>();
        int n = r.nextInt(4);
        for (int i = 0; i < n; i++) ps.add(PEOPLE[r.nextInt(PEOPLE.length)]);
        String line = code + ": " + name + "; Players: " + (n == 0 ? "None" : String.join(", ", ps)) + ".";
        return new Object[] {line, new Team(code, name, ps).toString()};
    }`,
    hint: 'Split on <code>;</code> first to separate the header from the player list. Then split the header on <code>:</code>. For players, cut the text between <code>:</code> and the final <code>.</code>, check for <code>"None"</code>, otherwise split on <code>,</code> and trim each one.',
  },
];

const parsing = {
  id: 'java-parse',
  topic: 'java',
  level: 2,
  title: 'Parse text into objects',
  skill: 'split, trim, parseInt, indexOf',
  variants: PARSE.length,
  generate(rng, seed, vi) {
    const v = choose(rng, PARSE, vi);
    const tests = J`        for (int t = 0; t < 6; t++) {
            final List<String> lines = new ArrayList<>();
            final List<String> expected = new ArrayList<>();
            int n = 1 + rnd.nextInt(4);
            for (int k = 0; k < n; k++) {
                Object[] pair = make(rnd);
                lines.add((String) pair[0]);
                expected.add((String) pair[1]);
            }
            test("parse(" + show(lines) + ")", () -> {
                List<String> got = new ArrayList<>();
                for (Object o : Solution.parse(lines)) got.add(String.valueOf(o));
                eq("parsed objects", expected, got);
            });
        }
        test("parse(empty list)", () -> eq("size", 0, Solution.parse(new ArrayList<>()).size()));`;
    return {
      title: `Parsing: ${v.cls} records`,
      story: 'Assignments usually start by loading records from text. You need to cut each line into fields reliably, and that is a skill you can practice on its own.',
      task: `Lines use the format <code>${v.format}</code>, for example <code>${v.sample}</code>. Implement <code>parse</code> so it returns one <code>${v.cls}</code> per line, in order.`,
      examples: [[`parse(List.of(${v.sample.split('  or  ')[0]}))`, `[${v.cls}(...)]`]],
      file: { name: 'Solution.java', code: solutionClass('import java.util.*;\n\n', stub(v.sig, v.doc)) },
      provided: [{ name: `${v.cls}.java`, code: v.provided }],
      harness: harness({ seed, body: tests, helpers: v.gen }),
      solution: solutionClass('import java.util.*;\n\n', `    ${v.sig} {\n${v.body}\n    }`),
      hints: [v.hint, '<code>Integer.parseInt</code>, <code>Long.parseLong</code> and <code>Double.parseDouble</code> convert text to numbers, but only after you trim the spaces.', 'Print one parsed line with <code>System.out.println</code> while debugging. Your output shows up below the test results.'],
      approach: ['Write the sample line out and mark where each field starts and ends.', 'Pick the separators: split for repeated separators, indexOf/substring for one-off markers.', 'Trim every field before converting it.', 'Handle the special case (empty list, "None") explicitly.'],
    };
  },
};

/* ------------------------------------------------------------------ generics */

const GENERICS = [
  {
    name: 'maxOf',
    sig: 'public static <T extends Comparable<T>> T maxOf(List<T> list)',
    doc: 'Returns the largest element according to compareTo. Returns null for an empty list.',
    examples: [['maxOf([3, 9, 2])', '9'], ['maxOf(["pear", "apple"])', '"pear"']],
    body: J`        T best = null;
        for (T x : list) {
            if (best == null || x.compareTo(best) > 0) best = x;
        }
        return best;`,
    test: J`            test("maxOf(" + show(ints) + ")", () -> eq("maxOf", ints.isEmpty() ? null : Collections.max(ints), Solution.maxOf(ints)));
            test("maxOf(" + show(strs) + ")", () -> eq("maxOf", strs.isEmpty() ? null : Collections.max(strs), Solution.maxOf(strs)));`,
  },
  {
    name: 'countLess',
    sig: 'public static <T extends Comparable<T>> int countLess(List<T> list, T key)',
    doc: 'Returns how many elements are strictly less than key (use compareTo).',
    examples: [['countLess([5, 1, 7, 3], 5)', '2']],
    body: J`        int count = 0;
        for (T x : list) {
            if (x.compareTo(key) < 0) count++;
        }
        return count;`,
    test: J`            final int ik = rnd.nextInt(10);
            final String sk = WORDS[rnd.nextInt(WORDS.length)];
            int ie = 0; for (int x : ints) if (x < ik) ie++;
            int se = 0; for (String x : strs) if (x.compareTo(sk) < 0) se++;
            final int iexp = ie, sexp = se;
            test("countLess(" + show(ints) + ", " + ik + ")", () -> eq("countLess", iexp, Solution.countLess(ints, ik)));
            test("countLess(" + show(strs) + ", \"" + sk + "\")", () -> eq("countLess", sexp, Solution.countLess(strs, sk)));`,
  },
  {
    name: 'isSorted',
    sig: 'public static <T extends Comparable<T>> boolean isSorted(List<T> list)',
    doc: 'Returns true if every element is <= the next one (ascending; duplicates allowed).',
    examples: [['isSorted([1, 2, 2, 5])', 'true'], ['isSorted(["b", "a"])', 'false']],
    body: J`        for (int i = 1; i < list.size(); i++) {
            if (list.get(i - 1).compareTo(list.get(i)) > 0) return false;
        }
        return true;`,
    test: J`            if (rnd.nextBoolean()) { Collections.sort(ints); Collections.sort(strs); }
            final List<Integer> si = new ArrayList<>(ints); Collections.sort(si);
            final List<String> ss = new ArrayList<>(strs); Collections.sort(ss);
            test("isSorted(" + show(ints) + ")", () -> eq("isSorted", si.equals(ints), Solution.isSorted(ints)));
            test("isSorted(" + show(strs) + ")", () -> eq("isSorted", ss.equals(strs), Solution.isSorted(strs)));`,
  },
];

const generics = {
  id: 'java-generics',
  topic: 'java',
  level: 2,
  title: 'Generics & compareTo',
  skill: 'Key extends Comparable<Key>',
  variants: GENERICS.length,
  generate(rng, seed, vi) {
    const v = choose(rng, GENERICS, vi);
    const tests = J`        for (int t = 0; t < 6; t++) {
            final List<Integer> ints = new ArrayList<>();
            final List<String> strs = new ArrayList<>();
            int n = rnd.nextInt(7);
            for (int k = 0; k < n; k++) { ints.add(rnd.nextInt(10)); strs.add(WORDS[rnd.nextInt(WORDS.length)]); }
${v.test}
        }`;
    return {
      title: `Generics: ${v.name}`,
      story: 'Search trees store <em>any</em> key type that can be compared. That is what <code>Key extends Comparable&lt;Key&gt;</code> means. You never use &lt; on keys, only <code>compareTo</code>.',
      task: `Implement <code>${v.sig.replace('public static ', '')}</code>. ${v.doc} It must work for Integers and Strings alike.`,
      examples: v.examples,
      file: { name: 'Solution.java', code: solutionClass('import java.util.*;\n\n', stub(v.sig, v.doc)) },
      provided: [],
      harness: harness({ seed, body: tests, helpers: J`    static final String[] WORDS = {"apple", "pear", "fig", "kiwi", "banana", "date", "Zebra"};` }),
      solution: solutionClass('import java.util.*;\n\n', `    ${v.sig} {\n${v.body}\n    }`),
      hints: ['<code>a.compareTo(b)</code> is negative if a &lt; b, zero if they are equal, and positive if a &gt; b.', 'Only the sign of the result matters. Never compare it to -1 or 1.', 'Note that "Zebra" &lt; "apple", because uppercase letters sort first.'],
      approach: ['Write the logic as if the items were ints.', 'Replace every <code>a &lt; b</code> with <code>a.compareTo(b) &lt; 0</code>.', 'Think about the empty list.'],
    };
  },
};

export default [recursion, lists, stacks, parsing, generics];
