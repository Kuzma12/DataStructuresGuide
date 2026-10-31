// Registry of every problem template, plus the logic that turns a template + seed into a problem.
import { Rng } from '../rng.js';
import { TESTKIT } from './kit.js';
import java from './java.js';
import trees from './trees.js';
import bst from './bst.js';
import llrb from './llrb.js';
import hash from './hash.js';
import graphs from './graphs.js';
import digraphs from './digraphs.js';

export const TEMPLATES = [...java, ...trees, ...bst, ...llrb, ...hash, ...graphs, ...digraphs];

export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id);
}

export function templatesFor(topic) {
  return TEMPLATES.filter((t) => t.topic === topic);
}

/** Rebuilds the same problem every time for a given template id and seed. */
export function buildProblem(templateId, seed, variant) {
  const template = templateById(templateId);
  if (!template) return null;
  const problem = template.generate(new Rng(seed), seed, variant);
  return { ...problem, templateId, seed, topic: template.topic, level: template.level, skill: template.skill };
}

/** Files sent to the compiler: the learner's file, provided files, hidden harness and TestKit. */
export function filesForRun(problem, code) {
  const files = { [problem.file.name]: code, 'Main.java': problem.harness, 'TestKit.java': TESTKIT };
  for (const p of problem.provided) files[p.name] = p.code;
  return files;
}
