// Compiles the scaffolded starter of every problem variant in every scaffold style
// (guided = Easy, lean = Hard, bare = Very hard / Extreme) to prove the rewrites keep code valid.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { compileAndRun } = require('../server/java.js');
const service = await import('../server/problems/service.js');
const { TEMPLATES } = await import('../server/problems/index.js');

const progress = { runs: () => 0, solved: () => false, hints: () => 0, peeked: () => false };
const modes = ['easy', 'hard', 'veryhard'];
let failures = 0;
let count = 0;
for (const t of TEMPLATES) {
  for (let v = 0; v < (t.variants || 1); v++) {
    // find a seed that selects variant v (variants are chosen by the seeded rng)
    let seed = 1;
    while (service.publicProblem(t.id, seed, 'medium', progress).title !== (await import('../server/problems/index.js')).buildProblem(t.id, 1000 + v, v).title && seed < 400) seed++;
    for (const m of modes) {
      const pub = service.publicProblem(t.id, seed, m, progress);
      const files = service.runFiles(t.id, seed, pub.file.code);
      const r = await compileAndRun(files);
      count++;
      if (!r.ok) {
        failures++;
        console.log(`FAIL ${t.id} v${v} mode=${m}\n${r.raw || r.error}\n----\n${pub.file.code}`);
      }
    }
  }
}
console.log(failures ? `${failures} failures out of ${count}` : `All ${count} scaffolded starters compile.`);
process.exit(failures ? 1 : 0);
