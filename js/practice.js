/*
  practice.js
  -----------
  Runs the Practice page (practice.html):
   1. Loads every quiz/module's metadata (difficulty, skill, source).
   2. Builds a sidebar with difficulty and skill filters, each showing
      a count.
   3. Renders the filtered module grid as colored cards (reused from
      the original design), each linking to module.html.
*/

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];
const SKILLS = [
  { id: "evidence_based", label: "Evidence-based" },
  { id: "grammar_edit", label: "Grammar edit" },
  { id: "extended_response", label: "Extended response" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "mixed", label: "Mixed" },
];
const HUES = ["teal", "amber", "coral", "plum"];

let allModules = [];
let activeDifficulty = "all";
let activeSkill = "all";

init();

async function init() {
  const listEl = document.getElementById("quiz-list");
  try {
    allModules = await Data.loadAllQuizzes();
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
  const skillCounts = countBy(allModules, "skill");

  sidebar.innerHTML = `
    <div class="sidebar-group">
      <div class="sidebar-group-title">Difficulty</div>
      ${sidebarLink("diff", "all", "All", allModules.length, activeDifficulty === "all")}
      ${DIFFICULTIES.map((d) =>
        sidebarLink("diff", d.id, d.label, difficultyCounts[d.id] || 0, activeDifficulty === d.id)
      ).join("")}
    </div>
    <div class="sidebar-group">
      <div class="sidebar-group-title">Skill</div>
      ${sidebarLink("skill", "all", "All", allModules.length, activeSkill === "all")}
      ${SKILLS.map((s) =>
        sidebarLink("skill", s.id, s.label, skillCounts[s.id] || 0, activeSkill === s.id)
      ).join("")}
    </div>
  `;

  sidebar.querySelectorAll(".sidebar-link[data-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeDifficulty = btn.dataset.diff;
      renderSidebar();
      renderGrid();
    });
  });
  sidebar.querySelectorAll(".sidebar-link[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSkill = btn.dataset.skill;
      renderSidebar();
      renderGrid();
    });
  });
}

function sidebarLink(type, value, label, count, isActive) {
  return `<button class="sidebar-link ${isActive ? "active" : ""}" data-${type}="${value}">
    <span>${label}</span><span class="count">${count}</span>
  </button>`;
}

function countBy(modules, field) {
  const counts = {};
  modules.forEach((m) => {
    const key = m[field] || "mixed";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function renderGrid() {
  const listEl = document.getElementById("quiz-list");

  const filtered = allModules.filter((m) => {
    const diffOk = activeDifficulty === "all" || m.difficulty === activeDifficulty;
    const skillOk = activeSkill === "all" || m.skill === activeSkill;
    return diffOk && skillOk;
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
      const skillLabel = SKILLS.find((s) => s.id === m.skill)?.label;

      return `
        <div class="quiz-card hue-${hue}">
          <div class="emblem">&#9670;</div>
          <h3>${escapeHtml(m.title)}</h3>
          <p class="desc">${escapeHtml(m.description || "")}</p>
          <div class="meta-row">
            ${m.difficulty ? `<span class="tag difficulty-pill">${escapeHtml(m.difficulty)}</span>` : ""}
            ${skillLabel ? `<span class="tag">${escapeHtml(skillLabel)}</span>` : ""}
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
