// Progress, drafts and mastery, persisted in localStorage (falls back to memory if storage is blocked).

const KEY = 'dsguide.v1';

const blank = () => ({
  sections: {},     // "topic/section" -> true
  quizzes: {},      // "topic/section" -> true (answered correctly)
  drills: {},       // topic -> { attempts, correct, recent: [1,0,...] }
  problems: {},     // templateId -> { attempts, runs, solved, clean, seeds: [] }
  drafts: {},       // "templateId:seed" -> code
  hints: {},        // "templateId:seed" -> hints revealed
  peeked: {},       // "templateId:seed" -> true once the solution was shown
  runs: {},         // "templateId:seed" -> number of test runs
  activity: {},     // "YYYY-MM-DD" -> count
  set: null,        // { items: [{templateId, seed}], index }
  recent: [],       // last problems opened
  theme: null,
  mode: 'medium',   // difficulty mode id
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    return blank();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lasts for this session only */
  }
}

const today = () => new Date().toISOString().slice(0, 10);

function bump() {
  state.activity[today()] = (state.activity[today()] || 0) + 1;
}

export const store = {
  get state() {
    return state;
  },

  markSection(topic, id) {
    const k = `${topic}/${id}`;
    if (!state.sections[k]) {
      state.sections[k] = true;
      bump();
      save();
    }
  },
  sectionDone: (topic, id) => !!state.sections[`${topic}/${id}`],

  markQuiz(topic, id) {
    state.quizzes[`${topic}/${id}`] = true;
    save();
  },

  recordDrill(topic, correct) {
    const d = (state.drills[topic] ||= { attempts: 0, correct: 0, recent: [] });
    d.attempts++;
    if (correct) d.correct++;
    d.recent = [...d.recent, correct ? 1 : 0].slice(-10);
    bump();
    save();
  },

  setMode(mode) {
    state.mode = mode;
    save();
  },

  recordRun(templateId, seed, { allPassed, clean }) {
    const p = (state.problems[templateId] ||= { attempts: 0, runs: 0, solved: 0, clean: 0, seeds: [] });
    p.runs++;
    if (!p.seeds.includes(seed)) {
      p.seeds.push(seed);
      p.attempts++;
    }
    let firstSolve = false;
    if (allPassed) {
      const solvedKey = `${templateId}:${seed}`;
      p.solvedSeeds ||= [];
      if (!p.solvedSeeds.includes(seed)) {
        p.solvedSeeds.push(seed);
        p.solved++;
        if (clean ?? (!state.peeked[solvedKey] && (state.hints[solvedKey] || 0) < 3)) p.clean++;
        firstSolve = true;
      }
    }
    bump();
    save();
    return firstSolve;
  },
  problem: (templateId) => state.problems[templateId] || { attempts: 0, runs: 0, solved: 0, clean: 0, seeds: [] },
  isSolved: (templateId, seed) => !!state.problems[templateId]?.solvedSeeds?.includes(seed),

  saveDraft(key, code) {
    state.drafts[key] = code;
    save();
  },
  draft: (key) => state.drafts[key],
  clearDraft(key) {
    delete state.drafts[key];
    save();
  },

  hintsShown: (key) => state.hints[key] || 0,
  showHint(key) {
    state.hints[key] = (state.hints[key] || 0) + 1;
    save();
  },
  runsFor: (key) => state.runs[key] || 0,
  bumpRuns(key) {
    state.runs[key] = (state.runs[key] || 0) + 1;
    save();
  },
  peek(key) {
    state.peeked[key] = true;
    save();
  },
  peeked: (key) => !!state.peeked[key],

  pushRecent(entry) {
    state.recent = [entry, ...state.recent.filter((r) => !(r.templateId === entry.templateId && r.seed === entry.seed))].slice(0, 12);
    save();
  },

  setQueue(items) {
    state.set = items ? { items, index: 0 } : null;
    save();
  },
  advanceQueue() {
    if (state.set) {
      state.set.index++;
      if (state.set.index >= state.set.items.length) state.set = null;
      save();
    }
  },

  setTheme(t) {
    state.theme = t;
    save();
  },

  streak() {
    let n = 0;
    const d = new Date();
    for (;;) {
      const k = d.toISOString().slice(0, 10);
      if (state.activity[k]) n++;
      else if (n > 0 || k !== today()) break;
      d.setDate(d.getDate() - 1);
      if (n > 3650) break;
    }
    return n;
  },

  reset() {
    state = blank();
    save();
  },

  export: () => JSON.stringify(state, null, 2),
  import(json) {
    state = { ...blank(), ...JSON.parse(json) };
    save();
  },
};

/**
 * Mastery for a topic, 0..100.
 *   reading  (20%): lesson sections completed
 *   drills   (30%): accuracy over the last 10 drills, scaled by how many you have done
 *   coding   (50%): each problem type counts fully after 2 different variants solved cleanly
 * Parts that do not exist for a topic are left out and the rest re-weighted.
 */
export function mastery(topic, { sectionIds = [], templateIds = [], hasDrills = false }) {
  const parts = [];
  if (sectionIds.length) {
    const done = sectionIds.filter((id) => store.sectionDone(topic, id)).length;
    parts.push({ key: 'reading', weight: 20, value: done / sectionIds.length });
  }
  if (hasDrills) {
    const d = state.drills[topic];
    const value = d && d.recent.length ? (d.recent.reduce((a, b) => a + b, 0) / d.recent.length) * Math.min(1, d.attempts / 10) : 0;
    parts.push({ key: 'drills', weight: 30, value });
  }
  if (templateIds.length) {
    const per = templateIds.map((id) => {
      const p = store.problem(id);
      return Math.min(1, (p.clean + 0.5 * (p.solved - p.clean)) / 2);
    });
    parts.push({ key: 'coding', weight: 50, value: per.reduce((a, b) => a + b, 0) / per.length });
  }
  const total = parts.reduce((a, p) => a + p.weight, 0) || 1;
  const score = (100 * parts.reduce((a, p) => a + p.weight * p.value, 0)) / total;
  return { score, parts };
}

export function masteryLabel(score) {
  if (score >= 90) return 'Mastered';
  if (score >= 70) return 'Proficient';
  if (score >= 40) return 'Practicing';
  if (score > 0) return 'Learning';
  return 'Not started';
}
