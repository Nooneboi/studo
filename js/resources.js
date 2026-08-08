/*
  resources.js
  ------------
  Loads data/resources.json and renders it as a filterable list with
  a sidebar of categories. To add a resource, edit data/resources.json
  directly (pencil-icon edit on GitHub) — no code changes needed.
*/

const KINDS = [
  { id: "phrase_bank", label: "Phrase banks" },
  { id: "reading", label: "Reading" },
  { id: "guide", label: "Guides" },
  { id: "book", label: "Books" },
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

  listEl.innerHTML = filtered
    .map((r) => {
      const kindLabel = KINDS.find((k) => k.id === r.kind)?.label.replace(/s$/, "") || r.kind;
      return `
        <div class="resource-item">
          <div>
            <div class="kind">${escapeHtml(kindLabel)}</div>
            <div><strong>${escapeHtml(r.title)}</strong></div>
          </div>
          <a class="icon-btn" href="${escapeAttr(r.url)}" target="_blank" rel="noopener" aria-label="Open ${escapeAttr(r.title)}" title="Open">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 7a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.41.59L12 7h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill="currentColor"/>
            </svg>
          </a>
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
