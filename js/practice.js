/*
  practice.js
  -----------
  Runs the Practice page (practice.html): untimed skill drills.

   1. Reads ?subject= from the URL (falls back to the last chosen
      subject, then "rla"). Only RLA has content right now — other
      subjects show a "coming soon" state.
   2. Loads every RLA module's metadata and groups it into a sidebar
      tree: category (Reading / Writing and Analysis / Language
      Conventions) -> topic, plus a difficulty quick-filter.
   3. Renders the filtered module grid as colored cards linking to
      module.html.
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

  const sidebar = document.getElementById("sidebar");
  const listEl = document.getElementById("quiz-list");

  if (subject !== "rla") {
    sidebar.innerHTML = `<div class="sidebar-group"><div class="sidebar-group-title">Subject</div><p style="font-size:.85rem;color:var(--color-ink-faint)">This subject is coming soon.</p></div>`;
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — check back soon, or switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  try {
    allModules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (e) {
    listEl.innerHTML = `<p>Couldn't load modules. Make sure data/index.json exists.</p>`;
    return;
  }
  renderSidebar();
  renderGrid();
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const difficultyCounts = countBy(allModules, "difficulty");

  const categoryTree = CATEGORIES.map((cat) => {
    const inCategory = allModules.filter((m) => (m.category || "reading") === cat.id);
    const topics = [...new Set(inCategory.map((m) => m.topic || "General"))];
    const isCatActive = activeCategory === cat.id && !activeTopic;

    return `
      <div class="sidebar-tree-group">
        ${link({ label: cat.label, count: inCategory.length, isActive: isCatActive, onCategory: cat.id })}
        <div class="sidebar-tree-children">
          ${topics
            .map((topic) => {
              const count = inCategory.filter((m) => (m.topic || "General") === topic).length;
              const isActive = activeCategory === cat.id && activeTopic === topic;
              return link({ label: topic, count, isActive, onCategory: cat.id, onTopic: topic, sub: true });
            })
            .join("")}
        </div>
      </div>`;
  }).join("");

  sidebar.innerHTML = `
    <div class="sidebar-group">
      <div class="sidebar-group-title">Difficulty</div>
      ${diffLink("all", "All", allModules.length)}
      ${DIFFICULTIES.map((d) => diffLink(d.id, d.label, difficultyCounts[d.id] || 0)).join("")}
    </div>
    <div class="sidebar-group">
      <div class="sidebar-group-title">Skill area</div>
      ${link({ label: "All", count: allModules.length, isActive: activeCategory === "all" })}
      ${categoryTree}
    </div>
  `;

  sidebar.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      activeTopic = btn.dataset.topic || null;
      renderSidebar();
      renderGrid();
    });
  });
  sidebar.querySelectorAll("[data-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeDifficulty = btn.dataset.diff;
      renderSidebar();
      renderGrid();
    });
  });

  function diffLink(id, label, count) {
    return `<button class="sidebar-link ${activeDifficulty === id ? "active" : ""}" data-diff="${id}">
      <span>${label}</span><span class="count">${count}</span>
    </button>`;
  }
  function link({ label, count, isActive, onCategory, onTopic, sub }) {
    const catAttr = onCategory !== undefined ? `data-cat="${onCategory}"` : `data-cat="all"`;
    const topicAttr = onTopic ? `data-topic="${escapeAttr(onTopic)}"` : "";
    return `<button class="sidebar-link ${sub ? "sidebar-subitem" : ""} ${isActive ? "active" : ""}" ${catAttr} ${topicAttr}>
      <span>${escapeHtml(label)}</span><span class="count">${count}</span>
    </button>`;
  }
}

function countBy(modules, field) {
  const counts = {};
  modules.forEach((m) => {
    const key = m[field] || "easy";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
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
