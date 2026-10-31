'use strict';
// Server-side record of runs, passes, hints and peeks per problem. The server decides when hints
// and solutions may be released, so this lives here rather than in the browser.

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'progress.json');

let state = { runs: {}, solved: {}, hints: {}, peeked: {} };
try {
  state = { ...state, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch {
  /* first run: start empty */
}

let timer = null;
function persist() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(state));
    } catch (err) {
      console.error('Could not save progress:', err.message);
    }
  }, 200);
}

const bump = (map, key) => {
  map[key] = (map[key] || 0) + 1;
  persist();
};

module.exports = {
  runs: (key) => state.runs[key] || 0,
  solved: (key) => !!state.solved[key],
  hints: (key) => state.hints[key] || 0,
  peeked: (key) => !!state.peeked[key],
  addRun: (key) => bump(state.runs, key),
  addHint: (key) => bump(state.hints, key),
  markSolved(key) {
    state.solved[key] = true;
    persist();
  },
  peek(key) {
    state.peeked[key] = true;
    persist();
  },
  reset() {
    state = { runs: {}, solved: {}, hints: {}, peeked: {} };
    persist();
  },
};
