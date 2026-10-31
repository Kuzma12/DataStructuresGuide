import { TOPICS, topicById, topicMastery } from '../curriculum.js';
import { store } from '../store.js';
import { esc, ring } from '../ui.js';
import { LABS } from '../labs.js';
import { templatesFor } from '../problems/index.js';
import { DRILLS } from '../drills.js';

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
          <h1>${esc(section.title)}</h1>
          <div class="prose">${section.body}</div>
          ${section.lab ? `<div class="lab-embed"><div class="lab-title"><b>${LABS[section.lab].title}</b><span class="muted">${LABS[section.lab].blurb}</span></div><div data-lab></div></div>` : ''}
          ${section.quiz ? quizHtml(section.quiz) : ''}
          <div class="lesson-nav">
            ${index > 0 ? `<a class="btn ghost" href="#/learn/${topic.id}/${sections[index - 1].id}">← Back</a>` : '<span></span>'}
            <a class="btn primary" data-next href="${nextHref}">${esc(nextLabel)} →</a>
          </div>
        </article>
      </div>`;

    if (section.lab) LABS[section.lab].mount(el.querySelector('[data-lab]'));

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
  },
};
