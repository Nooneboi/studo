/*
  resources.js
  ------------
  A simpler resource shelf: clear category chips, larger visual file/folder
  markers, and labels underneath so learners can quickly spot what to open.
*/

const KINDS = [
  { id: "phrase_bank", label: "Phrase banks", single: "Phrase bank", icon: "folder", accent: "blue" },
  { id: "reading", label: "Reading", single: "Reading", icon: "file", accent: "green" },
  { id: "guide", label: "Guides", single: "Guide", icon: "file", accent: "purple" },
  { id: "book", label: "Books", single: "Book", icon: "book", accent: "gold" },
];

let allResources = [];
let activeKind = "all";

init();

async function init() {
  const listEl = document.getElementById("resource-list");
  try {
    const res = await fetch("data/resources.json");
    allResources = await res.json();
  } catch (e) {
    listEl.innerHTML = `<p>Couldn't load resources. Make sure data/resources.json exists.</p>`;
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
        <div class="filter-group-title">Category</div>
        <div class="filter-chips">
          ${chip("all", "All")}
          ${KINDS.map((k) => chip(k.id, k.label)).join("")}
        </div>
      </div>
    </div>
  `;
  filterBar.querySelectorAll("[data-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeKind = btn.dataset.kind;
      renderFilterBar();
      renderList();
    });
  });

  function chip(id, label) {
    return `<button class="filter-chip ${activeKind === id ? "active" : ""}" data-kind="${id}">${label}</button>`;
  }
}

function renderList() {
  const listEl = document.getElementById("resource-list");
  const filtered = allResources.filter((r) => activeKind === "all" || r.kind === activeKind);

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">Nothing in this category yet.</div>`;
    return;
  }

  listEl.innerHTML = `<div class="resource-shelf">${filtered.map(resourceTile).join("")}</div>`;
}

function resourceTile(resource) {
  const kind = KINDS.find((k) => k.id === resource.kind) || { single: resource.kind, icon: "file", accent: "blue" };
  return `
    <a class="resource-tile ${kind.accent}" href="${escapeAttr(resource.url)}" target="_blank" rel="noopener">
      <div class="resource-tile-icon" aria-hidden="true">${iconSvg(kind.icon)}</div>
      <div class="resource-tile-label">${escapeHtml(kind.single)}</div>
      <strong>${escapeHtml(resource.title)}</strong>
    </a>`;
}

function iconSvg(type) {
  if (type === "folder") {
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c0-3.314 2.686-6 6-6h12l5 5h19c3.314 0 6 2.686 6 6v19c0 3.314-2.686 6-6 6H14c-3.314 0-6-2.686-6-6V20Z" fill="currentColor" opacity=".18"/><path d="M8 22c0-3.314 2.686-6 6-6h12.5l4.5 4H50c3.314 0 6 2.686 6 6v18c0 3.314-2.686 6-6 6H14c-3.314 0-6-2.686-6-6V22Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M8 28h48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  if (type === "book") {
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 13h24c4.418 0 8 3.582 8 8v28H26c-4.418 0-8-3.582-8-8V13Z" fill="currentColor" opacity=".16"/><path d="M18 13h24c4.418 0 8 3.582 8 8v28H26c-4.418 0-8-3.582-8-8V13Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M18 45c0-4.418 3.582-8 8-8h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M26 23h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h20l10 10v34H18c-3.314 0-6-2.686-6-6V16c0-3.314 2.686-6 6-6Z" fill="currentColor" opacity=".14"/><path d="M38 10v10h10" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M18 10h20l10 10v28c0 3.314-2.686 6-6 6H18c-3.314 0-6-2.686-6-6V16c0-3.314 2.686-6 6-6Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M22 31h16M22 39h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
