/*
  category.js
  -----------
  Runs category.html?cat=reading|writing|language_conventions.

  Layout:
   1. A "General Practice Test" callout — links into the existing
      timed Quiz system (test.html) for that category, acting as a
      placement/diagnostic test.
   2. Plain classified lists, grouped Easy -> Medium -> Hard, each
      item a text link to module.html. No color-coding, no card
      grid — just typographic hierarchy, on purpose (reduces the
      number of visual decisions a learner has to make to find their
      next step).
*/

const CATEGORY_META = {
  reading: { label: "Reading", desc: "Main idea, inference, evidence, and comparing texts across passages." },
  writing: { label: "Writing and Analysis", desc: "Organizing ideas, using evidence, and building a short argument." },
  language_conventions: { label: "Language Conventions", desc: "Grammar, punctuation, and sentence structure edits." },
};
const LEVELS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const cat = params.get("cat");
  const view = document.getElementById("category-view");
  const meta = CATEGORY_META[cat];

  if (!meta) {
    view.innerHTML = `<div class="empty-state">Unknown skill area. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }
  if (subject !== "rla") {
    view.innerHTML = `<div class="empty-state">This subject isn't built out yet. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  let modules;
  try {
    modules = (await Data.loadAllQuizzes()).filter(
      (m) => (m.subject || "rla") === "rla" && (m.category || "reading") === cat
    );
  } catch (e) {
    view.innerHTML = `<div class="empty-state">Couldn't load this skill area. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  const questionCount = modules.reduce((sum, m) => sum + (m.questions?.length || 0), 0);
  const totalSeconds = modules.reduce(
    (sum, m) => sum + (m.questions || []).reduce((s, q) => s + (q.time || 30), 0),
    0
  );
  const minutes = Math.max(1, Math.round(totalSeconds / 60));

  const levelSections = LEVELS.map((level) => {
    const inLevel = modules.filter((m) => (m.difficulty || "easy") === level.id);
    if (!inLevel.length) return "";
    return `
      <div class="level-group">
        <div class="level-title">${level.label}</div>
        <ul class="practice-link-list">
          ${inLevel.map((m) => renderItem(m, cat)).join("")}
        </ul>
      </div>`;
  }).join("");

  view.innerHTML = `
    <a href="practice.html" class="btn ghost small" style="margin-bottom:var(--space-4)">&larr; All skill areas</a>
    <div class="eyebrow" style="font-family:var(--font-mono); font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; color:var(--color-primary-dark); margin-bottom:8px;">Details</div>
    <h1>${meta.label}</h1>
    <p class="lede">${meta.desc}</p>

    <div class="diagnostic-box">
      <div>
        <h3>General Practice Test</h3>
        <p>Start here if you're not sure where to begin — it covers a mix of questions from this skill area.</p>
        <div class="meta" style="margin-top:6px">${questionCount} questions &middot; ~${minutes} min &middot; timed</div>
      </div>
      <a class="btn" href="test.html?subject=rla&category=${cat}">Start test</a>
    </div>

    ${levelSections || `<div class="empty-state">No modules in this skill area yet.</div>`}
  `;
}

function renderItem(m, cat) {
  const questionCount = m.questions?.length ?? "?";
  const totalSeconds = (m.questions || []).reduce((sum, q) => sum + (q.time || 30), 0);
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  const quizId = m.file.replace(/\.json$/, "");
  const hasProgress = Object.keys(Store.getAnswers(quizId)).length > 0;

  return `
    <li class="practice-link-item">
      <a class="title-link" href="module.html?quiz=${encodeURIComponent(m.file)}&cat=${cat}">${escapeHtml(m.title)}</a>
      <span class="meta">${hasProgress ? '<span class="progress-note">In progress</span> &middot; ' : ""}${questionCount} q &middot; ~${minutes} min</span>
    </li>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
