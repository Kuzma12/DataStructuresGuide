// Imports the browser modules in Node and exercises every generator: drills (at all levels),
// lessons, walkthrough animations, problem templates and difficulty-mode scaffolding.
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const { setCatalog } = await import('../public/js/catalog.js');
const service = await import('../server/problems/service.js');
setCatalog(service.catalog());
const { TOPICS, topicMastery } = await import('../public/js/curriculum.js');
const { DRILLS, setDrillLevel } = await import('../public/js/drills.js');
const { WALKTHROUGHS } = await import('../public/js/anim/walkthroughs.js');
const { TEMPLATES, buildProblem } = await import('../server/problems/index.js');
const { Rng } = await import('../public/js/rng.js');

let n = 0;
for (let lv = 1; lv <= 5; lv++) {
  setDrillLevel(lv);
  for (const d of DRILLS) {
    for (let s = 1; s <= 60; s++) {
      const x = d.generate(new Rng(s * 31 + 7 + lv));
      if (!x.prompt || x.answer === undefined || x.answer === '' || !x.explain) throw new Error(`bad drill ${d.id} seed ${s}`);
      n++;
    }
  }
}

for (const t of TOPICS) {
  if (Number.isNaN(topicMastery(t).score)) throw new Error('nan mastery ' + t.id);
  for (const s of t.lesson.sections) if (!s.body || !s.title) throw new Error('bad section ' + t.id + '/' + s.id);
}

let frames = 0;
for (const w of WALKTHROUGHS) {
  const defaults = Object.fromEntries((w.inputs || []).map((f) => [f.id, f.value]));
  const runs = [defaults];
  for (let k = 0; k < 15; k++) runs.push({ ...defaults, ...(w.random ? w.random() : {}) });
  if (w.id === 'traversal') for (const kind of ['pre', 'in', 'post']) runs.push({ ...defaults, kind });
  for (const input of runs) {
    const fs = w.build(input);
    if (!fs.length) throw new Error(`no frames: ${w.id}`);
    for (const f of fs) {
      if (!f.say || !f.scene || !Array.isArray(f.scene.items)) throw new Error(`bad frame in ${w.id}`);
      const keys = new Set();
      for (const it of f.scene.items) {
        if (keys.has(it.key)) throw new Error(`duplicate key ${it.key} in ${w.id}: ${f.say}`);
        keys.add(it.key);
        for (const v of Object.values(it.a)) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`NaN attr in ${w.id}`);
      }
      const lines = [].concat(f.line ?? []);
      const max = w.code.split('\n').length;
      for (const l of lines) if (l < 1 || l > max) throw new Error(`line ${l} out of range in ${w.id}`);
    }
    frames += fs.length;
  }
}

const progress = { runs: () => 0, solved: () => false, hints: () => 0, peeked: () => false };
let p = 0;
for (const t of TEMPLATES) {
  for (let v = 0; v < (t.variants || 1); v++) {
    const pr = buildProblem(t.id, 1234 + v, v);
    for (const k of ['title', 'story', 'task', 'file', 'harness', 'solution', 'hints', 'approach']) if (!pr[k]) throw new Error(`missing ${k} in ${t.id}`);
    for (const m of service.MODES) {
      const pub = service.publicProblem(t.id, 1234 + v, m.id, progress);
      if (JSON.stringify(pub).includes('TestKit') || 'solution' in pub || 'harness' in pub) throw new Error(`leak in ${t.id}`);
      if (!pub.file.code.includes('TODO') && !pub.file.code.includes('class')) throw new Error(`empty starter ${t.id}`);
    }
    p++;
  }
}
const variants = TEMPLATES.reduce((a, t) => a + (t.variants || 1), 0);
const levels = [1, 2, 3, 4, 5].map((l) => TEMPLATES.filter((t) => t.level === l).length);
console.log(`drills ok: ${n} generated across ${DRILLS.length} types and 5 levels`);
console.log(`topics: ${TOPICS.length}, sections: ${TOPICS.reduce((a, t) => a + t.lesson.sections.length, 0)}`);
console.log(`walkthroughs: ${WALKTHROUGHS.length}, frames built: ${frames}`);
console.log(`problem templates: ${TEMPLATES.length}, variants: ${variants}, per level: ${levels.join('/')}, no leaks in ${service.MODES.length} modes`);
