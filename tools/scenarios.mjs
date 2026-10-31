// Sends realistic learner mistakes through the running server (npm start) and prints what the UI shows.
const base = 'http://127.0.0.1:4317';
const problem = await (await fetch(`${base}/api/problem?t=trees-metrics&s=5&m=medium`)).json();
const run = async (code) =>
  (await fetch(`${base}/api/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: 'trees-metrics', seed: 5, mode: 'medium', code }) })).json();
const body = (s) => problem.file.code.replace(/        \/\/ TODO[^\n]*\n        return 0;/, s);
const show = (label, r) => {
  console.log(`\n== ${label}: phase=${r.phase}`);
  if (r.phase === 'compile') for (const e of r.errors) console.log(`  ${e.file}:${e.line} ${e.message}`);
  if (r.phase === 'run') {
    const pass = r.tests.filter((t) => t.status === 'PASS').length;
    console.log(`  ${pass}/${r.tests.length} passed, allPassed=${r.allPassed}, solutionAvailable=${r.solutionAvailable}`);
    const f = r.tests.find((t) => t.status !== 'PASS');
    if (f) console.log(`  first issue: [${f.status}] ${f.name}\n    ${f.message.replace(/\n/g, '\n    ')}`);
  }
};
console.log(`problem: ${problem.title}`);
show('compile error', await run(body('        return 1 +;')));
show('null pointer', await run(body('        return 1 + countAtDepth(root.left, k - 1);')));
show('infinite loop', await run(body('        while (true) { }')));
show('correct', await run(body('        if (root == null) return 0;\n        if (k == 0) return 1;\n        return countAtDepth(root.left, k - 1) + countAtDepth(root.right, k - 1);')));
