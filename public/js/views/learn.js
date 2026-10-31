import { TOPICS, topicById, topicMastery } from '../curriculum.js';
import { store } from '../store.js';
import { esc, ring } from '../ui.js';
import { LABS } from '../labs.js';
import { templatesFor } from '../catalog.js';
import { DRILLS } from '../drills.js';
import { mountPlayer } from '../anim/player.js';
import { walkthroughById } from '../anim/walkthroughs.js';
import { GLOSSARY } from '../lessons/simple.js';

/** Wraps the first use of each glossary word in a section with a hover/tap definition. */
function addGlossary(root) {
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const used = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('code, pre, a, .term, h1, h4, dt, .quiz, .lab, .player, svg, table') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    for (const term of terms) {
      if (used.has(term)) continue;
      const re = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
      const m = node.nodeValue.match(re);
      if (!m) continue;
      used.add(term);
      const after = node.splitText(m.index);
      after.nodeValue = after.nodeValue.slice(m[0].length);
      const span = document.createElement('span');
      span.className = 'term';
      span.tabIndex = 0;
      span.textContent = m[0];
      const tip = document.createElement('span');
      tip.className = 'term-tip';
      tip.setAttribute('role', 'tooltip');
      tip.innerHTML = GLOSSARY[term];
      span.appendChild(tip);
      node.parentNode.insertBefore(span, after);
      break;
    }
  }
}

function quizHtml(quiz) {
  return `
    <div class="quiz">
      <p class="quiz-q"><span class="pill">Check</span> ${quiz.q}</p>
      <div class="quiz-options">${quiz.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
      <div class="quiz-why" hidden></div>
    </div>`;
}

export default {
  render(el, topicId, sectionId) {
    const topic = topicById(topicId);
    if (!topic) {
      location.hash = '#/';
      return;
    }
    const sections = topic.lesson.sections;
    let index = Math.max(0, sections.findIndex((s) => s.id === sectionId));
    if (!sectionId) {
      const firstUnread = sections.findIndex((s) => !store.sectionDone(topic.id, s.id));
      index = firstUnread === -1 ? 0 : firstUnread;
    }
    const section = sections[index];
    const topicIdx = TOPICS.indexOf(topic);
    const nextTopic = TOPICS[topicIdx + 1];
    const m = topicMastery(topic);
    const hasDrills = DRILLS.some((d) => d.topic === topic.id);
    const hasProblems = templatesFor(topic.id).length > 0;

    const toc = sections
      .map((s, i) => `<a class="toc-item${i === index ? ' active' : ''}${store.sectionDone(topic.id, s.id) ? ' done' : ''}" href="#/learn/${topic.id}/${s.id}"><span class="toc-n">${i + 1}</span>${esc(s.title)}</a>`)
      .join('');

    const isLast = index === sections.length - 1;
    const nextHref = isLast ? (hasDrills ? `#/drills/${topic.id}` : nextTopic ? `#/learn/${nextTopic.id}` : '#/practice') : `#/learn/${topic.id}/${sections[index + 1].id}`;
    const nextLabel = isLast ? (hasDrills ? 'Finish: go to drills' : nextTopic ? `Next topic: ${nextTopic.title}` : 'Go practice') : `Next: ${sections[index + 1].title}`;

    el.innerHTML = `
      <div class="lesson">
        <aside class="lesson-toc">
          <div class="toc-head">${ring(m.score, 36)}<div><b>${esc(topic.title)}</b><span class="muted">${topic.wa || ''}</span></div></div>
          <p class="muted small">${esc(topic.lesson.intro)}</p>
          <nav>${toc}</nav>
          <div class="toc-actions">
            ${hasDrills ? `<a class="btn sm ghost" href="#/drills/${topic.id}">Drills</a>` : ''}
            ${hasProblems ? `<a class="btn sm ghost" href="#/practice/${topic.id}">Problems</a>` : ''}
          </div>
        </aside>
        <article class="lesson-body">
          <p class="eyebrow">${esc(topic.title)} · ${index + 1} of ${sections.length}</p>
          <div class="lesson-title"><h1>${esc(section.title)}</h1><button class="btn sm ghost" data-read title="Read this section out loud">🔈 Read to me</button></div>
          <div class="prose">${section.body}</div>
          ${section.watch ? `<div class="watch-embed"><div class="lab-title"><b>▶ ${esc(walkthroughById(section.watch).title)}</b><span class="muted">Press play, or step with the arrows.</span><a class="small" href="#/watch/${section.watch}">Open full screen →</a></div><div data-watch></div></div>` : ''}
          ${section.lab ? `<div class="lab-embed"><div class="lab-title"><b>${LABS[section.lab].title}</b><span class="muted">${LABS[section.lab].blurb}</span></div><div data-lab></div></div>` : ''}
          ${section.quiz ? quizHtml(section.quiz) : ''}
          <div class="lesson-nav">
            ${index > 0 ? `<a class="btn ghost" href="#/learn/${topic.id}/${sections[index - 1].id}">← Back</a>` : '<span></span>'}
            <a class="btn primary" data-next href="${nextHref}">${esc(nextLabel)} →</a>
          </div>
        </article>
      </div>`;

    if (section.lab) LABS[section.lab].mount(el.querySelector('[data-lab]'));
    const player = section.watch ? mountPlayer(el.querySelector('[data-watch]'), walkthroughById(section.watch), { compact: true }) : null;
    addGlossary(el.querySelector('.prose'));

    const readBtn = el.querySelector('[data-read]');
    if (!window.speechSynthesis) readBtn.remove();
    else
      readBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          readBtn.textContent = '🔈 Read to me';
          return;
        }
        const clone = el.querySelector('.prose').cloneNode(true);
        clone.querySelectorAll('pre, figure, .figure, .term-tip').forEach((n) => n.remove());
        const u = new SpeechSynthesisUtterance(`${section.title}. ${clone.textContent.replace(/\s+/g, ' ')}`);
        u.onend = () => (readBtn.textContent = '🔈 Read to me');
        readBtn.textContent = '■ Stop reading';
        speechSynthesis.speak(u);
      });

    const quiz = el.querySelector('.quiz');
    if (quiz) {
      quiz.querySelectorAll('.quiz-opt').forEach((b) =>
        b.addEventListener('click', () => {
          const i = Number(b.dataset.i);
          const right = i === section.quiz.answer;
          quiz.querySelectorAll('.quiz-opt').forEach((x) => {
            x.disabled = true;
            if (Number(x.dataset.i) === section.quiz.answer) x.classList.add('right');
          });
          if (!right) b.classList.add('wrong');
          const why = quiz.querySelector('.quiz-why');
          why.hidden = false;
          why.innerHTML = `<b>${right ? 'Correct.' : 'Not quite.'}</b> ${section.quiz.why}`;
          if (right) store.markQuiz(topic.id, section.id);
        }),
      );
    }

    el.querySelector('[data-next]').addEventListener('click', () => {
      store.markSection(topic.id, section.id);
      document.dispatchEvent(new Event('progress-changed'));
    });

    return () => {
      player?.destroy();
      if (window.speechSynthesis) speechSynthesis.cancel();
    };
  },
};
