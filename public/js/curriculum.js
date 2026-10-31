// Topic list: ties lessons, drills and problem templates together, in the recommended order.
import method from './lessons/method.js';
import java from './lessons/java.js';
import trees from './lessons/trees.js';
import bst from './lessons/bst.js';
import llrb from './lessons/llrb.js';
import hash from './lessons/hash.js';
import graphs from './lessons/graphs.js';
import digraphs from './lessons/digraphs.js';
import { templatesFor } from './catalog.js';
import { DRILLS } from './drills.js';
import { mastery } from './store.js';
import { SIMPLE } from './lessons/simple.js';

export const TOPICS = [
  { id: 'method', title: 'How to approach problems', short: 'Method', wa: null, lesson: method },
  { id: 'java', title: 'Java foundations', short: 'Foundations', wa: 'All WAs', lesson: java },
  { id: 'trees', title: 'Binary trees', short: 'Binary trees', wa: 'WA1', lesson: trees },
  { id: 'bst', title: 'Binary search trees', short: 'BSTs', wa: 'WA2', lesson: bst },
  { id: 'llrb', title: 'Red-black BSTs', short: 'Red-black', wa: 'WA3', lesson: llrb },
  { id: 'hash', title: 'Hash tables', short: 'Hashing', wa: 'WA4', lesson: hash },
  { id: 'graphs', title: 'Undirected graphs', short: 'Graphs', wa: 'WA5', lesson: graphs },
  { id: 'digraphs', title: 'Digraphs & topological sort', short: 'Digraphs', wa: 'WA6', lesson: digraphs },
];

// Every topic opens with an "In simple words" section, and key sections get an animation.
const EXTRA_WATCH = {
  'java/stacks-queues': 'postfix',
  'trees/traversals': 'level-order',
  'bst/get': 'bst-search',
  'bst/delete': 'bst-delete',
  'llrb/put': 'llrb-insert',
  'graphs/bfs': 'bfs',
  'digraphs/topo': 'topo',
};
for (const t of TOPICS) {
  if (SIMPLE[t.id] && t.lesson.sections[0].id !== 'simple') t.lesson.sections.unshift(SIMPLE[t.id]);
  for (const s of t.lesson.sections) if (EXTRA_WATCH[`${t.id}/${s.id}`]) s.watch = EXTRA_WATCH[`${t.id}/${s.id}`];
}

export const topicById = (id) => TOPICS.find((t) => t.id === id);

export function topicMastery(topic) {
  return mastery(topic.id, {
    sectionIds: topic.lesson.sections.map((s) => s.id),
    templateIds: templatesFor(topic.id).map((t) => t.id),
    hasDrills: DRILLS.some((d) => d.topic === topic.id),
  });
}
