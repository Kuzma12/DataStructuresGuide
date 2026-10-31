# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-10-31

A major upgrade focused on visual teaching, difficulty modes and protecting hidden files.

### Security
- **Hidden files stay on the server.** Problem generators, hidden test harnesses and reference solutions moved from `public/` to `server/problems/`. The browser now only receives the public parts of a problem (story, task, starter code, provided files).
- **Tests run server-side from the server's own copy.** `/api/run` accepts only the learner's code. The harness is rebuilt on the server, so tests cannot be read or tampered with from the browser.
- **Server-enforced hints and solutions.** Hints and solutions are released one at a time by `/api/hint` and `/api/solution` according to the active mode and a server-side progress record (`data/progress.json`).
- **Static file allow-list.** Only `.html/.js/.css/.svg/.png/.ico` under `public/` are served. Dotfiles and `package.json` are blocked, and path traversal returns 404.
- **Hardened HTTP.** Added a Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Cross-Origin-Opener-Policy`. Host-header validation blocks DNS rebinding, and cross-origin POSTs are rejected. Request bodies are capped at 256 KB and code at 100 KB.
- Removed the inline event handler from `index.html` so the strict CSP applies.

### Added
- **Five difficulty modes:** Easy, Medium, Hard, Very hard and Extreme. Each mode controls which problem levels are generated, how much scaffolding the starter code contains (a step-by-step plan, normal, lean, or bare signatures), how many hints are allowed, how many examples are shown, and when the solution unlocks. Extreme adds a 30-minute clock. The mode is selectable on the Practice page and shown in the sidebar and on the home page.
- **8 new advanced problem types** (15 variants) at levels 4 and 5: infix evaluation and shunting-yard, rebuilding a tree from traversals, serialize/deserialize, max path sum, balanced BST rebuild, the AVL balance check, BFS on grid mazes, flood-fill room counting, linear-probing put/get and delete, red-black `deleteMin`/`deleteMax`, and Kosaraju-Sharir strong components.
- **Animated walkthrough engine** (`public/js/anim/`): a keyed SVG renderer with tweening, so nodes slide during rotations, deletions and resizes. A player highlights each Java line as it runs, explains every step in plain words, shows live variables, and has play/step/scrub/speed controls, keyboard shortcuts and **read-aloud** narration.
- **12 animated walkthroughs:** recursion and the call stack, postfix evaluation, pre/in/post-order traversal, level order, BST search, BST insert, Hibbard deletion, red-black insertion, hash table with chaining and resizing, DFS, BFS, and topological sort. Every input is editable, with a Random button.
- **Watch page** (`#/watch`) with a gallery and a full-screen player. Steps can be deep-linked (`#/watch/<id>/<step>`).
- **"In simple words" section** at the start of every topic, written at a 6th-grade reading level, with everyday comparisons, a "Big idea" box, a "Words to know" list and an embedded animation.
- **Glossary tooltips:** key terms in lessons explain themselves on hover or tap.
- **"Read to me"** button on every lesson section (browser speech synthesis).
- Animations embedded in key lesson sections (stacks, traversals, BST search/delete, red-black insertion, BFS, topological sort).
- Problem pages link to the matching animation.
- A learning-path strip on the home page (Watch → Learn → Trace → Code).
- `tools/verify-modes.mjs` compiles every scaffolded starter in every scaffold style.

### Changed
- Drills scale with the mode: Easy uses smaller trees and graphs, and Extreme uses larger ones.
- Drill graphs are now always connected (a random spanning tree plus extra edges), so traces are never trivial.
- Difficulty badges now show 5 levels, color-coded by mode.
- The Practice page is rebuilt around the mode picker, and problem types in the current mode's range are highlighted.
- Running the server while it is already running now opens the browser instead of crashing.
- `tools/smoke.mjs` now also builds every walkthrough frame, checks drills at all 5 levels, and asserts that no harness or solution leaks into public problem payloads in any mode.

### Fixed
- Code-font ligatures (for example `==` drawn as one glyph) are disabled everywhere code is shown.
- Mobile layout overflow in lessons, the workspace and the labs.
- Null-pointer messages now show real parameter names (compiled with `-g`).

## [1.0.0] - 2026-10-30

### Added
- First release: 8 topics of lessons, 6 interactive labs, 15 tracing drill types, and 30 auto-graded Java problem types (97 variants) compiled with the local JDK, with mastery tracking, light/dark themes and a zero-dependency Node server.
