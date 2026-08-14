/*
  category.js
  -----------
  Runs category.html?cat=reading|writing|language_conventions[&topic=...]

  Left sidebar: scoped to just the current skill area — on the
  Reading page you only see Reading's topics, nothing from Writing
  or Language Conventions cluttering it up. Each topic expands to
  the actual modules inside it, and keeps scaling as more get added
  later; nothing here assumes a fixed number of topics or modules.
  Use "All skill areas" (top of the main content) to switch pages.

  - Clicking a chevron only expands/collapses — it doesn't navigate.
  - Clicking a topic's name filters the main list below to just that
    topic (and expands its modules in the tree).
  - Clicking a module jumps straight to it.

  Main area (right): unchanged — a General Practice Test callout,
  then the current skill area's modules grouped Easy -> Medium -> Hard.
*/

const CATEGORY_META = {
  reading: {
    label: "Reading",
    desc: "Practice what a passage says, what it implies, and which details support the best answer.",
  },
  writing: {
    label: "Writing and Analysis",
    desc: "Practice claims, evidence, reasoning, tone, and revision.",
  },
  language_conventions: {
    label: "Language Conventions",
    desc: "Practice grammar, punctuation, sentence boundaries, and clear word choice in context.",
  },
};
const LEVELS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];
const CHEVRON = '<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l6 5-6 5"/></svg>';
const FILE_ICON = '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M15 2v5h5"/></svg>';

let allModules = [];
let currentCat = null;
let activeTopic = null;
const openTopics = new Set(); // keys like "reading::Main Idea"

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const cat = params.get("cat");
  const topicParam = params.get("topic");
  const view = document.getElementById("category-view");
  const meta = CATEGORY_META[cat];

  if (!meta) {
    view.innerHTML = `<div class="empty-state">That skill area doesn't exist yet. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }
  if (subject !== "rla") {
    view.innerHTML = `<div class="empty-state">This subject isn't built out yet. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  try {
    allModules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (e) {
    view.innerHTML = `<div class="empty-state">Couldn't load this skill area — try refreshing. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  currentCat = cat;
  activeTopic = topicParam || null;
  if (activeTopic) openTopics.add(`${cat}::${activeTopic}`);

  renderTree();
  renderMain();
  initSidebarCollapse();
}

function initSidebarCollapse() {
  const btn = document.getElementById("sidebar-collapse-btn");
  if (!btn) return;
  const collapsed = localStorage.getItem("sq:sidebarCollapsed") === "1";
  document.body.classList.toggle("tree-collapsed", collapsed);
  btn.title = collapsed ? "Show sidebar" : "Collapse sidebar";
  btn.addEventListener("click", () => {
    const isNowCollapsed = document.body.classList.toggle("tree-collapsed");
    localStorage.setItem("sq:sidebarCollapsed", isNowCollapsed ? "1" : "0");
    btn.title = isNowCollapsed ? "Show sidebar" : "Collapse sidebar";
  });
}

function modulesFor(catId) {
  return allModules.filter((m) => (m.category || "reading") === catId);
}

function renderTree() {
  const tree = document.getElementById("tree-nav");
  const meta = CATEGORY_META[currentCat];
  const mods = modulesFor(currentCat);
  const topics = [...new Set(mods.map((m) => m.topic || "General"))];

  tree.innerHTML =
    `<div class="tree-nav-title">${escapeHtml(meta.label)}</div>` +
    (topics.length
      ? topics.map((topic) => renderTopicRow(currentCat, topic, mods)).join("")
      : `<div style="padding:6px 8px; font-size:.78rem; color:var(--color-ink-faint)">Nothing here yet</div>`);

  tree.querySelectorAll("[data-toggle-topic]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.toggleTopic;
      openTopics.has(key) ? openTopics.delete(key) : openTopics.add(key);
      renderTree();
    });
  });

  tree.querySelectorAll("[data-select-topic]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [catId, topic] = btn.dataset.selectTopic.split("::");
      activeTopic = activeTopic === topic ? null : topic;
      const key = `${catId}::${topic}`;
      if (activeTopic) openTopics.add(key);
      renderTree();
      renderMain();
    });
  });
}

function renderTopicRow(catId, topic, mods) {
  const key = `${catId}::${topic}`;
  const isOpen = openTopics.has(key);
  const isActive = catId === currentCat && activeTopic === topic;
  const inTopic = mods.filter((m) => (m.topic || "General") === topic);

  return `
    <div style="display:flex; align-items:center;">
      <button class="tree-topic ${isActive ? "active" : ""} ${isOpen ? "open" : ""}" data-select-topic="${catId}::${escapeAttr(topic)}" style="flex:1">
        <span class="chev-wrap" data-toggle-topic="${key}" style="display:inline-flex">${CHEVRON}</span>
        <span>${escapeHtml(topic)}</span>
      </button>
    </div>
    <div class="tree-children ${isOpen ? "" : "collapsed"}" style="margin-left:8px">
      ${inTopic
        .map(
          (m) =>
            `<a class="tree-leaf" href="module.html?quiz=${encodeURIComponent(m.file)}&cat=${catId}">${FILE_ICON}<span>${escapeHtml(m.title)}</span></a>`
        )
        .join("")}
    </div>`;
}

function renderMain() {
  const view = document.getElementById("category-view");
  const meta = CATEGORY_META[currentCat];
  const currentModules = modulesFor(currentCat);
  const modules = activeTopic ? currentModules.filter((m) => (m.topic || "General") === activeTopic) : currentModules;

  const questionCount = currentModules.reduce((sum, m) => sum + (m.questions?.length || 0), 0);
  const totalSeconds = currentModules.reduce(
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
          ${inLevel.map((m) => renderItem(m, currentCat)).join("")}
        </ul>
      </div>`;
  }).join("");

  view.innerHTML = `
    <a href="practice.html" class="btn ghost small" style="margin-bottom:var(--space-4)">&larr; All skill areas</a>
    <div class="eyebrow" style="font-family:var(--font-mono); font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; color:var(--color-primary-dark); margin-bottom:8px;">Details</div>
    <h1>${meta.label}${activeTopic ? ` &middot; ${escapeHtml(activeTopic)}` : ""}</h1>
    <p class="lede">${meta.desc}</p>

    <div class="diagnostic-box">
      <div>
        <h3>Want a quick check first?</h3>
        <p>Take a mixed test from this area before choosing a practice set.</p>
        <div class="meta" style="margin-top:6px">${questionCount} questions &middot; ~${minutes} min &middot; timed</div>
      </div>
      <a class="btn" href="test.html?subject=rla&category=${currentCat}">Start test</a>
    </div>

    ${levelSections || `<div class="empty-state">Nothing here yet${activeTopic ? " for this topic" : ""} — check back soon.</div>`}
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
      <span class="meta">${hasProgress ? '<span class="progress-note">Picking back up</span> &middot; ' : ""}${questionCount} q &middot; ~${minutes} min</span>
    </li>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
