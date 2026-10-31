// Sends realistic learner mistakes through the running server and prints what the UI would show.
import { buildProblem, filesForRun } from '../public/js/problems/index.js';

const run = async (files) => (await fetch('http://127.0.0.1:4317/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) })).json();
const p = buildProblem('trees-metrics', 42, 1); // height
const show = (label, r) => {
  console.log(`\n== ${label}: phase=${r.phase}`);
  if (r.phase === 'compile') for (const e of r.errors) console.log(`  ${e.file}:${e.line} ${e.message}`);
  if (r.phase === 'run') {
    const pass = r.tests.filter((t) => t.status === 'PASS').length;
    console.log(`  ${pass}/${r.tests.length} passed, aborted=${r.aborted}, ms=${r.ms}`);
    const f = r.tests.find((t) => t.status !== 'PASS');
    if (f) console.log(`  first issue: [${f.status}] ${f.name}\n    ${f.message.replace(/\n/g, '\n    ')}`);
    if (r.stdout.trim()) console.log(`  stdout: ${r.stdout.trim().slice(0, 80)}`);
  }
};
const body = (s) => p.file.code.replace('        // TODO: write your code here\n        return 0;', s);
show('compile error', await run(filesForRun(p, body('        return 1 +;'))));
show('off-by-one', await run(filesForRun(p, body('        if (root == null) return 0;\n        return 1 + Math.max(height(root.left), height(root.right));'))));
show('NPE', await run(filesForRun(p, body('        return 1 + Math.max(height(root.left), height(root.right));'))));
show('infinite loop', await run(filesForRun(p, body('        while (true) { }'))));
show('println + correct', await run(filesForRun(p, body('        System.out.println("debug " + (root == null));\n        if (root == null) return -1;\n        return 1 + Math.max(height(root.left), height(root.right));'))));
