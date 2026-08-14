/*
  practice.js — Practice hub
  --------------------------
  The hub should feel useful on repeat visits, not like a static directory.
  It shows one next-step cue, then three calm study-area panels.
*/

const CATEGORIES = [
  {
    id: "reading",
    label: "Reading",
    summary: "Understand what a passage says, what it implies, and which details actually support an answer.",
    topics: ["Main idea", "Inference", "Evidence", "Author's purpose"],
    accent: "blue",
  },
  {
    id: "writing",
    label: "Writing and Analysis",
    summary: "Work with claims, evidence, reasoning, tone, and revision.",
    topics: ["Claims", "Evidence", "Reasoning", "Revision"],
    accent: "violet",
  },
  {
    id: "language_conventions",
    label: "Language Conventions",
    summary: "Edit grammar, punctuation, sentence boundaries, and word choice in context.",
    topics: ["Grammar", "Punctuation", "Sentence structure", "Word choice"],
    accent: "teal",
  },
];

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const listEl = document.getElementById("category-list");

  if (subject !== "rla") {
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  let modules = [];
  try {
    modules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (_) {}

  renderNextStep(modules);

  listEl.innerHTML = CATEGORIES.map((category, index) => {
    const inCategory = modules.filter((m) => (m.category || "reading") === category.id);
    const questionCount = inCategory.reduce((sum, m) => sum + (m.questions?.length || 0), 0);
    const moduleCount = inCategory.length;
    const topicMarkup = category.topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("");

    return `
      <a class="practice-area-card practice-area-${category.accent}" href="category.html?subject=rla&cat=${category.id}">
        <div class="practice-area-topline">
          <span class="practice-area-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="practice-area-count">${moduleCount} set${moduleCount === 1 ? "" : "s"} · ${questionCount} q</span>
        </div>
        <div>
          <h3>${escapeHtml(category.label)}</h3>
          <p>${escapeHtml(category.summary)}</p>
        </div>
        <div class="practice-area-topics" aria-label="Example skills">${topicMarkup}</div>
        <div class="practice-area-open">Explore area <span aria-hidden="true">→</span></div>
      </a>`;
  }).join("");
}

function renderNextStep(modules) {
  const mount = document.getElementById("practice-next-mount");
  if (!mount) return;

  let summary = null;
  try {
    summary = typeof Learning !== "undefined" ? Learning.getSummary() : null;
  } catch (_) {}

  if (summary?.attempts) {
    const nextSkill = summary.weakestSkills?.[0] || summary.skills?.[0];
    const due = summary.dueReviews || summary.activeMistakes || 0;
    const headline = nextSkill ? nextSkill.label : "Keep your skills moving";
    const note = due
      ? `${due} review${due === 1 ? " is" : "s are"} waiting. Studo can mix those with fresh practice.`
      : "Your recent work is saved. A short mixed session is ready when you are.";

    mount.innerHTML = `
      <aside class="practice-next-card">
        <div class="practice-next-label">Suggested next</div>
        <h2>${escapeHtml(headline)}</h2>
        <p>${escapeHtml(note)}</p>
        <div class="practice-next-actions">
          <a class="btn" href="train.html">Start focused session</a>
          <a class="text-link" href="progress.html">Why this? →</a>
        </div>
      </aside>`;
    return;
  }

  mount.innerHTML = `
    <aside class="practice-next-card is-new">
      <div class="practice-next-label">New here?</div>
      <h2>Start with a short baseline.</h2>
      <p>Studo will use your first few answers to decide what deserves more practice later.</p>
      <div class="practice-next-actions">
        <a class="btn" href="train.html">Build baseline</a>
        <a class="text-link" href="category.html?subject=rla&cat=reading">Browse Reading →</a>
      </div>
    </aside>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
