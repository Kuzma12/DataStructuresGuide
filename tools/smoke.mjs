// Imports the browser modules in Node and exercises the generators.
import { TOPICS, topicMastery } from '../public/js/curriculum.js';
import { DRILLS } from '../public/js/drills.js';
import { TEMPLATES, buildProblem } from '../public/js/problems/index.js';
import { Rng } from '../public/js/rng.js';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let n = 0;
for (const d of DRILLS) {
  for (let s = 1; s <= 200; s++) {
    const x = d.generate(new Rng(s * 31 + 7));
    if (!x.prompt || x.answer === undefined || x.answer === '' || !x.explain) throw new Error(`bad drill ${d.id} seed ${s}`);
    n++;
  }
}
for (const t of TOPICS) {
  const m = topicMastery(t);
  if (Number.isNaN(m.score)) throw new Error('nan mastery ' + t.id);
  for (const s of t.lesson.sections) if (!s.body || !s.title) throw new Error('bad section ' + t.id + '/' + s.id);
}
let p = 0;
for (const t of TEMPLATES) for (let v = 0; v < (t.variants || 1); v++) {
  const pr = buildProblem(t.id, 1234 + v, v);
  for (const k of ['title', 'story', 'task', 'file', 'harness', 'solution', 'hints', 'approach']) if (!pr[k]) throw new Error(`missing ${k} in ${t.id}`);
  p++;
}
const variants = TEMPLATES.reduce((a, t) => a + (t.variants || 1), 0);
console.log(`drills ok: ${n} generated across ${DRILLS.length} types`);
console.log(`topics: ${TOPICS.length}, sections: ${TOPICS.reduce((a, t) => a + t.lesson.sections.length, 0)}`);
console.log(`problem templates: ${TEMPLATES.length}, variants: ${variants}, built: ${p}`);
