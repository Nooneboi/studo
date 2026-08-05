/*
  quiz.js
  -------
  Runs the Quiz picker page (quiz.html). Groups RLA modules by
  category and offers a "Start test" card per category, plus a
  combined Full RLA Test. Clicking a card assembles every question
  from that category's modules into a single timed run (test.html).
*/

const CATEGORIES = [
  { id: "reading", label: "Reading" },
  { id: "writing", label: "Writing and Analysis" },
  { id: "language_conventions", label: "Language Conventions" },
];

let allModules = [];
let activeCategory = "all";

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";

  const filterBar = document.getElementById("filter-bar");
  const listEl = document.getElementById("test-list");

  if (subject !== "rla") {
    filterBar.innerHTML = "";
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — check back soon, or switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  try {
    allModules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (e) {
    listEl.innerHTML = `<p>Couldn't load modules.</p>`;
    return;
  }
  renderFilterBar();
  renderList();
}

function renderFilterBar() {
  const filterBar = document.getElementById("filter-bar");
  filterBar.innerHTML = `
    <div class="filter-bar">
      <div class="filter-group">
        <div class="filter-group-title">Test type</div>
        <div class="filter-chips">
          ${chip("all", "Full RLA Test")}
          ${CATEGORIES.map((c) => chip(c.id, c.label)).join("")}
        </div>
      </div>
    </div>
  `;
  filterBar.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilterBar();
      renderList();
    });
  });

  function chip(id, label) {
    return `<button class="filter-chip ${activeCategory === id ? "active" : ""}" data-cat="${id}">${escapeHtml(label)}</button>`;
  }
}

function renderList() {
  const listEl = document.getElementById("test-list");
  const groups =
    activeCategory === "all"
      ? [{ id: "all", label: "Full RLA Test", modules: allModules }]
      : CATEGORIES.filter((c) => c.id === activeCategory).map((c) => ({
          id: c.id,
          label: c.label,
          modules: allModules.filter((m) => (m.category || "reading") === c.id),
        }));

  const cards = groups
    .filter((g) => g.modules.length)
    .map((g) => {
      const questionCount = g.modules.reduce((sum, m) => sum + (m.questions?.length || 0), 0);
      const totalSeconds = g.modules.reduce(
        (sum, m) => sum + (m.questions || []).reduce((s, q) => s + (q.time || 30), 0),
        0
      );
      const minutes = Math.max(1, Math.round(totalSeconds / 60));

      return `
        <div class="test-card">
          <h3>${escapeHtml(g.label)} Test</h3>
          <p class="desc">A timed simulation pulling every question from this ${
            g.id === "all" ? "subject" : "skill area"
          }.</p>
          <div class="meta-row">
            <span class="tag">${questionCount} questions</span>
            <span class="tag">~${minutes} min</span>
          </div>
          <div class="cta-row">
            <a class="btn small" href="test.html?subject=rla&category=${g.id}">Start test</a>
          </div>
        </div>`;
    });

  listEl.innerHTML = cards.length
    ? cards.join("")
    : `<div class="empty-state">No questions available for this test yet.</div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
