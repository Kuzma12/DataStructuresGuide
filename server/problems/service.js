// Server-side problem service. Hidden test harnesses and reference solutions never leave this
// process: the browser only receives the public parts of a problem, and hints/solutions are
// released one at a time according to the active difficulty mode.
import { TEMPLATES, buildProblem, filesForRun, templateById } from './index.js';
import { stripTags } from './kit.js';

export const MODES = [
  {
    id: 'easy',
    label: 'Easy',
    levels: [1],
    hints: Infinity,
    approach: true,
    examples: Infinity,
    scaffold: 'guided',
    solution: { runs: 1 },
    blurb: 'Tiny steps. The starter code contains a step-by-step plan, every hint is available, and the solution unlocks after one try.',
  },
  {
    id: 'medium',
    label: 'Medium',
    levels: [1, 2],
    hints: Infinity,
    approach: true,
    examples: Infinity,
    scaffold: 'normal',
    solution: { runs: 2, orAllHints: true, orRuns: 4 },
    blurb: 'The standard experience: clear instructions, a hint ladder, and the solution after a real attempt.',
  },
  {
    id: 'hard',
    label: 'Hard',
    levels: [2, 3],
    hints: 2,
    approach: true,
    examples: Infinity,
    scaffold: 'lean',
    solution: { runs: 4 },
    blurb: 'Harder problem types, fewer comments in the starter code, and only 2 hints.',
  },
  {
    id: 'veryhard',
    label: 'Very hard',
    levels: [3, 4],
    hints: 1,
    approach: false,
    examples: 1,
    scaffold: 'bare',
    solution: { solved: true },
    blurb: 'Advanced problem types, bare method signatures, one example, one hint. The solution only appears after you pass.',
  },
  {
    id: 'extreme',
    label: 'Extreme',
    levels: [4, 5],
    hints: 0,
    approach: false,
    examples: 0,
    scaffold: 'bare',
    solution: { solved: true },
    timerMinutes: 30,
    blurb: 'The hardest problem types, no hints, no examples, a 30-minute clock. Interview level.',
  },
];

export const modeById = (id) => MODES.find((m) => m.id === id) || MODES[1];

const publicMode = (m) => ({ ...m, hints: Number.isFinite(m.hints) ? m.hints : null, examples: Number.isFinite(m.examples) ? m.examples : null });

export function catalog() {
  return {
    modes: MODES.map(publicMode),
    templates: TEMPLATES.map((t) => ({ id: t.id, topic: t.topic, level: t.level, title: t.title, skill: t.skill, variants: t.variants || 1 })),
  };
}

/* ------------------------------------------------------------------ scaffolding */

/** Removes extra guidance from TODO comments ("// TODO: do X" -> "// TODO", "(tip: ...)"). */
function lean(code) {
  return code
    .replace(/\/\/ TODO[^\n]*/g, '// TODO')
    .replace(/\s*\((?:tip|Tip)[^)]*\)/g, '')
    .replace(/\n[ \t]*\/\/ {3,}[^\n]*/g, '');
}

/** Lean, and also deletes the doc comment above every method that still has a TODO in it. */
function bare(code) {
  const lines = lean(code).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\/\*\*/.test(lines[i])) {
      const indent = lines[i].match(/^\s*/)[0];
      let end = i;
      while (end < lines.length && !lines[end].includes('*/')) end++;
      // Scan the member under this comment, up to its closing brace at the same indent.
      let hasTodo = false;
      for (let k = end + 1; k < lines.length; k++) {
        if (lines[k].includes('// TODO')) hasTodo = true;
        if (lines[k] === `${indent}}` || /^\s*\/\*\*/.test(lines[k])) break;
      }
      if (hasTodo) {
        i = end;
        continue;
      }
    }
    out.push(lines[i]);
  }
  return out.join('\n');
}

/** Inserts the approach as a numbered plan right above the first TODO. */
function guided(code, problem) {
  const steps = problem.approach.map((s, i) => `// Step ${i + 1}: ${stripTags(s)}`);
  const firstHint = problem.hints[0] ? [`// Hint: ${stripTags(problem.hints[0])}`] : [];
  const plan = ['// ---- PLAN (Easy mode) ----', ...steps, ...firstHint, '// ---------------------------'];
  return code.replace(/([ \t]*)\/\/ TODO[^\n]*/, (line, pad) => `${plan.map((l) => pad + wrap(l, pad)).join('\n')}\n${line}`);
}

function wrap(line, pad) {
  const max = 96 - pad.length;
  if (line.length <= max) return line;
  const words = line.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur);
      cur = `//   ${w}`;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  lines.push(cur);
  return lines.join(`\n${pad}`);
}

function scaffold(problem, mode) {
  const code = problem.file.code;
  if (mode.scaffold === 'guided') return guided(code, problem);
  if (mode.scaffold === 'lean') return lean(code);
  if (mode.scaffold === 'bare') return bare(code);
  return code;
}

/* ------------------------------------------------------------------ public API */

export function exists(templateId) {
  return !!templateById(templateId);
}

export function publicProblem(templateId, seed, modeId, progress) {
  const problem = buildProblem(templateId, seed);
  if (!problem) return null;
  const mode = modeById(modeId);
  const key = `${templateId}:${seed}`;
  const examples = Number.isFinite(mode.examples) ? problem.examples.slice(0, mode.examples) : problem.examples;
  return {
    templateId,
    seed,
    key,
    mode: mode.id,
    title: problem.title,
    topic: problem.topic,
    level: problem.level,
    skill: problem.skill,
    story: problem.story,
    task: problem.task,
    examples,
    noLoops: !!problem.noLoops,
    file: { name: problem.file.name, code: scaffold(problem, mode) },
    provided: problem.provided,
    approach: mode.approach ? problem.approach : null,
    hintTotal: problem.hints.length,
    hintLimit: Math.min(problem.hints.length, mode.hints),
    hintsShown: hintsFor(problem, mode, progress.hints(key)),
    timerMinutes: mode.timerMinutes || null,
    ...solutionStatus(problem, mode, key, progress),
  };
}

function hintsFor(problem, mode, shown) {
  return problem.hints.slice(0, Math.min(shown, mode.hints));
}

export function revealHint(templateId, seed, modeId, progress) {
  const problem = buildProblem(templateId, seed);
  const mode = modeById(modeId);
  const key = `${templateId}:${seed}`;
  const shown = progress.hints(key);
  const limit = Math.min(problem.hints.length, mode.hints);
  if (shown >= limit) return { ok: false, reason: mode.hints === 0 ? `No hints in ${mode.label} mode.` : 'No more hints in this mode.', hints: hintsFor(problem, mode, shown) };
  progress.addHint(key);
  return { ok: true, hints: hintsFor(problem, mode, shown + 1), ...solutionStatus(problem, mode, key, progress) };
}

function solutionStatus(problem, mode, key, progress) {
  const runs = progress.runs(key);
  const solved = progress.solved(key);
  const allHints = progress.hints(key) >= Math.min(problem.hints.length, mode.hints);
  const rule = mode.solution;
  let available;
  let requirement;
  if (rule.solved) {
    available = solved;
    requirement = `In ${mode.label} mode the solution unlocks only after all tests pass.`;
  } else if (rule.orAllHints) {
    available = solved || (runs >= rule.runs && (allHints || runs >= rule.orRuns));
    requirement = `Run your code at least ${rule.runs} times, and either open all hints or run it ${rule.orRuns} times.`;
  } else {
    available = solved || runs >= rule.runs;
    requirement = `Run your code at least ${rule.runs} time${rule.runs === 1 ? '' : 's'}.`;
  }
  return { runs, solved, peeked: progress.peeked(key), solutionAvailable: available, solutionRule: requirement };
}

export function revealSolution(templateId, seed, modeId, progress) {
  const problem = buildProblem(templateId, seed);
  const mode = modeById(modeId);
  const key = `${templateId}:${seed}`;
  const status = solutionStatus(problem, mode, key, progress);
  if (!status.solutionAvailable) return { ok: false, reason: status.solutionRule };
  progress.peek(key);
  return { ok: true, solution: problem.solution, fileName: problem.file.name };
}

export function runFiles(templateId, seed, code) {
  const problem = buildProblem(templateId, seed);
  return filesForRun(problem, code);
}
