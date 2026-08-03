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
  renderSidebar();
  renderList();
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const counts = {};
  allResources.forEach((r) => (counts[r.kind] = (counts[r.kind] || 0) + 1));

  sidebar.innerHTML = `
    <div class="sidebar-group">
      <div class="sidebar-group-title">Category</div>
      ${link("all", "All", allResources.length, activeKind === "all")}
      ${KINDS.map((k) => link(k.id, k.label, counts[k.id] || 0, activeKind === k.id)).join("")}
    </div>
  `;

  sidebar.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeKind = btn.dataset.kind;
      renderSidebar();
      renderList();
    });
  });

  function link(id, label, count, isActive) {
    return `<button class="sidebar-link ${isActive ? "active" : ""}" data-kind="${id}">
      <span>${label}</span><span class="count">${count}</span>
    </button>`;
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
          <a class="btn small secondary" href="${escapeAttr(r.url)}" target="_blank" rel="noopener">Open</a>
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
