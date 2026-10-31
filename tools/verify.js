'use strict';
// Checks every problem template: reference solutions must pass all tests and starters must compile.
// Usage: node tools/verify.js [templateIdFilter] [seedsPerTemplate]

const path = require('path');
const { pathToFileURL } = require('url');
const { compileAndRun, findJava } = require('../server/java');

async function main() {
  const filter = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2] : '';
  const seeds = Number(process.argv[3]) || 4;
  if (!findJava()) {
    console.error('No JDK found.');
    process.exit(1);
  }
  const mod = await import(pathToFileURL(path.join(__dirname, '..', 'public', 'js', 'problems', 'index.js')).href);
  let failures = 0;
  for (const t of mod.TEMPLATES) {
    if (filter && !t.id.includes(filter)) continue;
    const runs = [];
    for (let v = 0; v < (t.variants || 1); v++) for (let s = 1; s <= seeds; s++) runs.push([v, s * 7919 + 13 * v]);
    for (const [variant, seed] of runs) {
      const problem = mod.buildProblem(t.id, seed, variant);
      const label = `${t.id} v${variant} seed=${seed} "${problem.title}"`;

      const solved = await compileAndRun(mod.filesForRun(problem, problem.solution));
      const bad = solved.ok ? solved.tests.filter((x) => x.status !== 'PASS') : [];
      if (!solved.ok || bad.length || !solved.summary || solved.tests.length === 0) {
        failures++;
        console.log(`FAIL solution  ${label}`);
        if (!solved.ok) console.log(solved.raw || solved.error);
        for (const b of bad.slice(0, 3)) console.log(`   ${b.status} ${b.name}\n   ${b.message}`);
        if (solved.stderr) console.log(solved.stderr.slice(0, 800));
        continue;
      }

      const starter = await compileAndRun(mod.filesForRun(problem, problem.file.code));
      if (!starter.ok) {
        failures++;
        console.log(`FAIL starter   ${label}`);
        console.log(starter.raw || starter.error);
        continue;
      }
      const starterPasses = starter.tests.filter((x) => x.status === 'PASS').length;
      console.log(`ok   ${label}  (${solved.tests.length} tests; starter passes ${starterPasses})`);
    }
  }
  console.log(failures ? `\n${failures} problem(s) failed.` : '\nAll problems verified.');
  process.exit(failures ? 1 : 0);
}

main();
