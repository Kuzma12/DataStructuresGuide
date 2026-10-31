import { buildProblem, filesForRun, templateById } from '../problems/index.js';
import { topicById } from '../curriculum.js';
import { store } from '../store.js';
import { esc, code, levelDots, toast, debounce } from '../ui.js';
import { createEditor } from '../editor.js';
import { runJava } from '../api.js';
import { pickTemplate, problemHref } from './practice.js';

const STATUS_LABEL = { PASS: 'Passed', FAIL: 'Wrong answer', ERROR: 'Crashed', TIMEOUT: 'Timed out' };

function resultsHtml(res, fileName) {
  if (res.phase === 'setup') {
    if (res.error === 'NO_JDK') return `<div class="res-banner bad"><b>No Java compiler found.</b> Install a JDK or set JAVA_HOME, then restart the server.</div>`;
    if (res.error === 'OFFLINE') return `<div class="res-banner bad"><b>Cannot reach the local server.</b> Start it with <code>start.bat</code> or <code>npm start</code>.</div>`;
    return `<div class="res-banner bad">${esc(res.error)}</div>`;
  }
  if (res.phase === 'compile') {
    const items = res.errors.length
      ? res.errors
          .map(
            (e) => `<li class="cerr" ${e.file === fileName ? `data-line="${e.line}"` : ''}>
              <div><b>${esc(e.file)}:${e.line}</b> ${esc(e.message)}</div>
              ${e.detail ? `<pre>${esc(e.detail)}</pre>` : ''}</li>`,
          )
          .join('')
      : `<li class="cerr"><pre>${esc(res.raw)}</pre></li>`;
    return `<div class="res-banner bad"><b>Does not compile</b> · ${res.errors.length || 1} error${res.errors.length === 1 ? '' : 's'}. Fix these first (click one to jump to its line).</div><ul class="cerrs">${items}</ul>`;
  }
  const tests = res.tests || [];
  const passed = tests.filter((t) => t.status === 'PASS').length;
  const total = tests.length;
  const all = total > 0 && passed === total && !res.aborted && res.summary;
  let html = `<div class="res-banner ${all ? 'good' : 'bad'}">
      <div class="res-count"><b>${passed} / ${total}</b> tests passed${res.aborted ? ' · stopped early (timeout)' : ''}<span class="muted"> · ${res.ms} ms</span></div>
      <div class="res-bar"><span style="width:${total ? (100 * passed) / total : 0}%"></span></div>
    </div>`;
  if (!res.summary && !res.aborted) {
    html += `<div class="res-banner bad">The test program ended unexpectedly.${res.stderr ? `<pre>${esc(res.stderr.slice(0, 3000))}</pre>` : ''}</div>`;
  }
  html += '<ul class="tests">';
  let shownFail = 0;
  for (const t of tests) {
    const ok = t.status === 'PASS';
    const open = !ok && shownFail++ < 3;
    html += `<li class="test ${ok ? 'pass' : 'fail'}"><details ${open ? 'open' : ''}><summary><span class="dot ${ok ? 'ok' : 'bad'}"></span><span class="test-name">${esc(t.name)}</span><span class="test-status">${STATUS_LABEL[t.status] || t.status}</span></summary>${t.message ? `<pre>${esc(t.message)}</pre>` : ''}</details></li>`;
  }
  html += '</ul>';
  if (res.stdout && res.stdout.trim()) {
    html += `<details class="stdout"><summary>Your System.out output</summary><pre>${esc(res.stdout.slice(0, 20000))}</pre></details>`;
  }
  return html;
}

export default {
  wide: true,
  async render(el, templateId, seedStr) {
    const seed = Number(seedStr);
    const template = templateById(templateId);
    if (!template) {
      location.hash = '#/practice';
      return;
    }
    const problem = buildProblem(templateId, seed);
    const topic = topicById(problem.topic);
    const key = `${templateId}:${seed}`;
    store.pushRecent({ templateId, seed, title: problem.title });
    const set = store.state.set;
    const inSet = set && set.items[set.index]?.templateId === templateId && set.items[set.index]?.seed === seed;

    let tab = 'task';
    el.innerHTML = `
      <div class="workspace">
        <section class="ws-left">
          <nav class="crumbs"><a href="#/practice">Practice</a><span>/</span><a href="#/practice/${topic.id}">${esc(topic.short)}</a>${inSet ? `<span>/</span><span>Set ${set.index + 1} of ${set.items.length}</span>` : ''}</nav>
          <h1 class="ws-title">${esc(problem.title)}</h1>
          <div class="ws-meta">${levelDots(problem.level)}<span>${esc(problem.skill)}</span>${store.isSolved(templateId, seed) ? '<span class="status ok">solved</span>' : ''}</div>
          <div class="tabs" role="tablist">
            <button data-tab="task" class="on">Task</button>
            <button data-tab="approach">Approach</button>
            <button data-tab="hints">Hints <span data-k="hintcount"></span></button>
            <button data-tab="solution">Solution</button>
          </div>
          <div class="tab-body" data-k="tab"></div>
        </section>
        <section class="ws-right">
          <div class="ws-toolbar">
            <span class="file-tab">${esc(problem.file.name)}</span>
            <span class="spacer"></span>
            <button class="btn ghost sm" data-a="reset" title="Restore the starter code">Reset</button>
            <button class="btn ghost sm" data-a="variant" title="Same kind of problem, new variant and data">New variant</button>
            <button class="btn ghost sm" data-a="next" title="${inSet ? 'Next problem in the set' : 'A different problem type'}">${inSet ? 'Next in set' : 'Next problem'}</button>
            <button class="btn primary" data-a="run" title="Ctrl+Enter">Run tests</button>
          </div>
          <div class="editor-host" data-k="editor"><div class="editor-loading">Loading editor…</div></div>
          <div class="results" data-k="results"><p class="muted">Write your code, then press <b>Run tests</b> (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>). Your code compiles with a real JDK and runs against a hidden test file generated for this problem.</p></div>
        </section>
      </div>`;

    const $ = (k) => el.querySelector(`[data-k="${k}"]`);

    const renderTab = () => {
      el.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      const shown = store.hintsShown(key);
      $('hintcount').textContent = `${Math.min(shown, problem.hints.length)}/${problem.hints.length}`;
      let html = '';
      if (tab === 'task') {
        html = `
          <p class="story">${problem.story}</p>
          <h3>Your task</h3>
          <p>${problem.task}</p>
          ${problem.examples?.length ? `<h3>Examples</h3><table class="examples">${problem.examples.map(([c, r]) => `<tr><td><code>${esc(c)}</code></td><td>→</td><td><code>${esc(r)}</code></td></tr>`).join('')}</table>` : ''}
          ${problem.noLoops ? '<p class="callout">This one is recursion practice: solve it without <code>for</code> or <code>while</code> loops.</p>' : ''}
          <h3>Files</h3>
          <p class="muted small">You edit <code>${esc(problem.file.name)}</code>. ${problem.provided.length ? 'These files are provided and already working:' : ''}</p>
          ${problem.provided.map((p) => `<details class="provided"><summary>${esc(p.name)}</summary>${code(p.code)}</details>`).join('')}`;
      } else if (tab === 'approach') {
        html = `<p class="muted">How to think about it before typing. This is the method from the first lesson, applied to this problem.</p><ol class="steps">${problem.approach.map((a) => `<li>${a}</li>`).join('')}</ol><p class="muted small">Stuck after trying? Open one hint at a time.</p>`;
      } else if (tab === 'hints') {
        const visible = problem.hints.slice(0, shown);
        html = visible.length ? `<ol class="hints">${visible.map((h) => `<li>${h}</li>`).join('')}</ol>` : '<p class="muted">Hints go from a nudge to almost-code. Try first, then open them one at a time.</p>';
        if (shown < problem.hints.length) html += `<button class="btn" data-a="hint">Show hint ${shown + 1} of ${problem.hints.length}</button>`;
        else html += '<p class="muted small">That is every hint. If you are still stuck, re-read the lesson section for this topic or use the lab.</p>';
        if (shown >= 3) html += '<p class="muted small">Using all 3 hints means this solve will not count as clean.</p>';
      } else if (tab === 'solution') {
        const runs = store.runsFor(key);
        const canReveal = store.peeked(key) || (runs >= 2 && (shown >= problem.hints.length || runs >= 4));
        if (store.peeked(key)) {
          html = `<p class="muted">Study it, close it, then solve a <b>new variant</b> from scratch. That is what turns reading into knowing.</p>${code(problem.solution, `Reference ${problem.file.name}`)}`;
        } else if (canReveal) {
          html = `<p>The reference solution is available. Viewing it means this problem will not count as a clean solve.</p><button class="btn" data-a="reveal">Show the reference solution</button>`;
        } else {
          html = `<p class="muted">The solution unlocks after a real attempt: run your code at least <b>2</b> times, and either open all hints or run it <b>4</b> times. (Runs so far: ${runs}.)</p><p class="muted small">Why? Struggling a little first is what makes the solution stick when you finally see it.</p>`;
        }
      }
      $('tab').innerHTML = html;
      $('tab').querySelector('[data-a="hint"]')?.addEventListener('click', () => {
        store.showHint(key);
        renderTab();
      });
      $('tab').querySelector('[data-a="reveal"]')?.addEventListener('click', () => {
        store.peek(key);
        renderTab();
      });
    };
    el.querySelectorAll('[data-tab]').forEach((b) =>
      b.addEventListener('click', () => {
        tab = b.dataset.tab;
        renderTab();
      }),
    );
    renderTab();

    let running = false;
    const saveDraft = debounce((v) => store.saveDraft(key, v), 400);
    const editor = await createEditor($('editor'), {
      value: store.draft(key) ?? problem.file.code,
      onChange: saveDraft,
      onRun: () => run(),
    });

    const run = async () => {
      if (running) return;
      running = true;
      const btn = el.querySelector('[data-a="run"]');
      btn.disabled = true;
      btn.textContent = 'Running…';
      editor.clearMarks();
      const userCode = editor.getValue();
      store.saveDraft(key, userCode);
      $('results').innerHTML = '<div class="running"><span class="spinner"></span> Compiling and running the tests…</div>';
      const res = await runJava(filesForRun(problem, userCode));
      running = false;
      btn.disabled = false;
      btn.textContent = 'Run tests';
      let html = '';
      if (problem.noLoops && /\b(for|while)\s*\(/.test(userCode.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ''))) {
        html += '<div class="res-banner warn">Heads up: this problem is recursion practice, but your code contains a loop. The tests can still pass. Try it again without the loop.</div>';
      }
      html += resultsHtml(res, problem.file.name);
      $('results').innerHTML = html;
      if (res.phase === 'compile') {
        const lines = res.errors.filter((e) => e.file === problem.file.name).map((e) => e.line);
        editor.markErrors(lines);
        $('results').querySelectorAll('[data-line]').forEach((li) => li.addEventListener('click', () => editor.gotoLine(Number(li.dataset.line))));
      }
      if (res.phase === 'compile' || res.phase === 'run') store.bumpRuns(key);
      if (res.phase === 'run') {
        const all = res.tests.length > 0 && res.tests.every((t) => t.status === 'PASS') && res.summary && !res.aborted;
        const first = store.recordRun(templateId, seed, { allPassed: all });
        if (all) {
          const clean = !store.peeked(key) && store.hintsShown(key) < 3;
          const solvedCount = store.problem(templateId).solved;
          $('results').insertAdjacentHTML(
            'afterbegin',
            `<div class="success"><b>All tests pass.</b> ${first ? (clean ? 'Clean solve: it counts toward mastery.' : 'Solved with help. Try a new variant on your own to make it count.') : 'Already solved before.'}
              <div class="success-actions"><a class="btn primary sm" href="${problemHref(templateId)}">Solve a new variant →</a>${solvedCount >= 2 ? '<button class="btn sm" data-a="next2">Different problem type</button>' : ''}</div></div>`,
          );
          $('results').querySelector('[data-a="next2"]')?.addEventListener('click', next);
          if (first) toast(clean ? 'Solved cleanly ✓' : 'Solved ✓', 'good');
        }
        document.dispatchEvent(new Event('progress-changed'));
      }
      renderTab();
    };

    const next = () => {
      const s = store.state.set;
      if (inSet && s) {
        store.advanceQueue();
        const n = store.state.set;
        if (n) {
          location.hash = `#/problem/${n.items[n.index].templateId}/${n.items[n.index].seed}`;
          return;
        }
        toast('Set complete', 'good');
        location.hash = '#/practice';
        return;
      }
      let tp = pickTemplate([problem.topic], 'auto');
      if (tp.id === templateId) tp = pickTemplate([problem.topic], 'auto');
      location.hash = problemHref(tp.id);
    };

    el.querySelector('[data-a="run"]').addEventListener('click', run);
    el.querySelector('[data-a="next"]').addEventListener('click', next);
    el.querySelector('[data-a="variant"]').addEventListener('click', () => (location.hash = problemHref(templateId)));
    el.querySelector('[data-a="reset"]').addEventListener('click', () => {
      if (!confirm('Replace your code with the starter code?')) return;
      editor.setValue(problem.file.code);
      store.clearDraft(key);
    });
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  },
};
