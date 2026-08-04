/*
  practice.js
  -----------
  Runs the Practice page (practice.html): untimed skill drills.

   1. Reads ?subject= from the URL. Only RLA has content right now.
   2. Loads every RLA module's metadata.
   3. Renders a horizontal filter bar (Difficulty on the left, Skill
      area on the right — with topics as a second row once a skill
      area is picked), then the filtered module grid below it.
*/

const CATEGORIES = [
  { id: "reading", label: "Reading" },
  { id: "writing", label: "Writing and Analysis" },
  { id: "language_conventions", label: "Language Conventions" },
];
const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];
const HUES = ["teal", "amber", "coral", "plum"];

let allModules = [];
let activeDifficulty = "all";
let activeCategory = "all";
let activeTopic = null;

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";

  const filterBar = document.getElementById("filter-bar");
  const listEl = document.getElementById("quiz-list");

  if (subject !== "rla") {
    filterBar.innerHTML = "";
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — check back soon, or switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  try {
    allModules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (e) {
    listEl.innerHTML = `<p>Couldn't load modules. Make sure data/index.json exists.</p>`;
    return;
  }
  renderFilterBar();
  renderGrid();
}

function renderFilterBar() {
  const filterBar = document.getElementById("filter-bar");
  const topicsForActiveCategory =
    activeCategory !== "all"
      ? [...new Set(allModules.filter((m) => (m.category || "reading") === activeCategory).map((m) => m.topic || "General"))]
      : [];

  filterBar.innerHTML = `
    <div class="filter-bar">
      <div class="filter-group">
        <div class="filter-group-title">Difficulty</div>
        <div class="filter-chips">
          ${chip("diff", "all", "All", activeDifficulty === "all")}
          ${DIFFICULTIES.map((d) => chip("diff", d.id, d.label, activeDifficulty === d.id)).join("")}
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Skill area</div>
        <div class="filter-chips">
          ${chip("cat", "all", "All", activeCategory === "all")}
          ${CATEGORIES.map((c) => chip("cat", c.id, c.label, activeCategory === c.id)).join("")}
        </div>
        ${
          topicsForActiveCategory.length
            ? `<div class="filter-chips sub-row">
                ${topicsForActiveCategory
                  .map((t) => `<button class="filter-chip sub ${activeTopic === t ? "active" : ""}" data-topic="${escapeAttr(t)}">${escapeHtml(t)}</button>`)
                  .join("")}
              </div>`
            : ""
        }
      </div>
    </div>
  `;

  filterBar.querySelectorAll("[data-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeDifficulty = btn.dataset.diff;
      renderFilterBar();
      renderGrid();
    });
  });
  filterBar.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      activeTopic = null;
      renderFilterBar();
      renderGrid();
    });
  });
  filterBar.querySelectorAll("[data-topic]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTopic = activeTopic === btn.dataset.topic ? null : btn.dataset.topic;
      renderFilterBar();
      renderGrid();
    });
  });

  function chip(type, value, label, isActive) {
    return `<button class="filter-chip ${isActive ? "active" : ""}" data-${type}="${value}">${escapeHtml(label)}</button>`;
  }
}

function renderGrid() {
  const listEl = document.getElementById("quiz-list");

  const filtered = allModules.filter((m) => {
    const diffOk = activeDifficulty === "all" || m.difficulty === activeDifficulty;
    const catOk = activeCategory === "all" || (m.category || "reading") === activeCategory;
    const topicOk = !activeTopic || (m.topic || "General") === activeTopic;
    return diffOk && catOk && topicOk;
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">No modules match this filter yet.</div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map((m, i) => {
      const questionCount = m.questions?.length ?? "?";
      const totalSeconds = (m.questions || []).reduce((sum, q) => sum + (q.time || 30), 0);
      const minutes = Math.max(1, Math.round(totalSeconds / 60));
      const quizId = m.file.replace(/\.json$/, "");
      const hasProgress = Object.keys(Store.getAnswers(quizId)).length > 0;
      const hue = HUES[i % HUES.length];
      const catLabel = CATEGORIES.find((c) => c.id === m.category)?.label;

      return `
        <div class="quiz-card hue-${hue}">
          <div class="emblem">&#9670;</div>
          <h3>${escapeHtml(m.title)}</h3>
          <p class="desc">${escapeHtml(m.description || "")}</p>
          <div class="meta-row">
            ${m.difficulty ? `<span class="tag difficulty-pill">${escapeHtml(m.difficulty)}</span>` : ""}
            ${catLabel ? `<span class="tag">${escapeHtml(catLabel)}</span>` : ""}
            <span class="tag">${questionCount} q &middot; ~${minutes} min</span>
            ${hasProgress ? `<span class="tag">In progress</span>` : ""}
          </div>
          <div class="cta-row">
            <a class="btn small" href="module.html?quiz=${encodeURIComponent(m.file)}">${hasProgress ? "Continue" : "Start"}</a>
          </div>
        </div>`;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
