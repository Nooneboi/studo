/*
  category.js
  -----------
  Runs category.html?cat=reading|writing|language_conventions[&topic=...]

  Left sidebar: a real folder tree — Reading / Writing and Analysis /
  Language Conventions, each expandable to its topics, each topic
  expandable to the actual modules inside it. This is meant to keep
  scaling as more topics and modules get added later; nothing here
  assumes a fixed number of either.

  - Clicking a chevron only expands/collapses — it doesn't navigate.
  - Clicking a folder's name navigates to that skill area's page.
  - Clicking a topic's name filters the main list below to just that
    topic (and expands its modules in the tree).
  - Clicking a module jumps straight to it.

  Main area (right): unchanged — a General Practice Test callout,
  then the current skill area's modules grouped Easy -> Medium -> Hard.
*/

const CATEGORY_META = {
  reading: {
    label: "Reading",
    desc: "Where most of the actual test hinges: can you find the main idea, follow an inference, and tell strong evidence from a plausible-sounding distractor.",
  },
  writing: {
    label: "Writing and Analysis",
    desc: "Less about grammar rules and more about whether your argument holds up — does the evidence you picked actually support the point you're making.",
  },
  language_conventions: {
    label: "Language Conventions",
    desc: "The mechanical stuff: agreement, punctuation, sentence structure. Dry to study, but it's worth more points than people expect.",
  },
};
const LEVELS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];
const CHEVRON = '<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l6 5-6 5"/></svg>';
const FOLDER_ICON = '<svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>';
const FILE_ICON = '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M15 2v5h5"/></svg>';

let allModules = [];
let currentCat = null;
let activeTopic = null;
const openCats = new Set();
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
  openCats.add(cat);
  if (activeTopic) openTopics.add(`${cat}::${activeTopic}`);

  renderTree();
  renderMain();
}

function modulesFor(catId) {
  return allModules.filter((m) => (m.category || "reading") === catId);
}

function renderTree() {
  const tree = document.getElementById("tree-nav");
  tree.innerHTML =
    `<div class="tree-nav-title">Skill areas</div>` +
    Object.keys(CATEGORY_META)
      .map((id) => {
        const meta = CATEGORY_META[id];
        const isOpen = openCats.has(id);
        const isCurrent = id === currentCat;
        const mods = modulesFor(id);
        const topics = [...new Set(mods.map((m) => m.topic || "General"))];

        return `
          <div class="tree-folder-row" style="display:flex;align-items:center;">
            <button class="tree-folder ${isOpen ? "open" : ""} ${isCurrent ? "active-path" : ""}" data-toggle-cat="${id}" style="flex:1">
              ${CHEVRON}${FOLDER_ICON}<span>${meta.label}</span>
            </button>
          </div>
          <div class="tree-children ${isOpen ? "" : "collapsed"}">
            ${
              topics.length
                ? topics.map((topic) => renderTopicRow(id, topic, mods)).join("")
                : `<div style="padding:6px 8px; font-size:.78rem; color:var(--color-ink-faint)">Nothing here yet</div>`
            }
          </div>`;
      })
      .join("");

  // Folder name navigates; chevron/name button toggles when it's already the current page's category
  tree.querySelectorAll("[data-toggle-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleCat;
      if (id === currentCat) {
        // Already here — just toggle the folder open/closed
        openCats.has(id) ? openCats.delete(id) : openCats.add(id);
        renderTree();
      } else {
        window.location.href = `category.html?subject=rla&cat=${id}`;
      }
    });
  });

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
      if (catId !== currentCat) {
        window.location.href = `category.html?subject=rla&cat=${catId}&topic=${encodeURIComponent(topic)}`;
        return;
      }
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
        <h3>Not sure where to start? Take the general test.</h3>
        <p>It's a quick mix pulled from across this whole skill area — a fast way to see what you already know before you commit to grinding through the easy stuff.</p>
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
