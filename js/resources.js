/* resources.js — generated curriculum resources first, legacy fallback second */
const KINDS = [
  { id: "pdf", label: "PDFs", single: "PDF", icon: "file", accent: "blue" },
  { id: "worksheet", label: "Worksheets", single: "Worksheet", icon: "file", accent: "green" },
  { id: "study_guide", label: "Guides", single: "Study guide", icon: "file", accent: "purple" },
  { id: "notes", label: "Notes", single: "Notes", icon: "file", accent: "blue" },
  { id: "reference", label: "References", single: "Reference", icon: "book", accent: "gold" },
  { id: "docx", label: "DOCX", single: "DOCX", icon: "file", accent: "blue" },
  { id: "link", label: "Links", single: "Link", icon: "link", accent: "green" },
];

let allResources = [];
let activeKind = "all";
init();

async function init() {
  const listEl = document.getElementById("resource-list");
  try {
    allResources = await loadCurriculumResources();
    if (!allResources.length) allResources = await loadLegacyResources();
  } catch (e) {
    listEl.innerHTML = `<p>Couldn't load resources.</p>`;
    return;
  }
  renderFilterBar();
  renderList();
}

async function loadCurriculumResources() {
  const res = await fetch("data/generated/curriculum.json", { cache: "no-store" });
  if (!res.ok) return [];
  const curriculum = await res.json();
  const seen = new Map();
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      for (const resource of domain.topicResources || domain.resources || []) {
        if (!resource?.id) continue;
        if (!seen.has(resource.id)) seen.set(resource.id, {
          ...resource,
          domainLabel: domain.label,
          trackLabel: track.label,
          placement: 'topic',
        });
      }
      for (const skill of domain.skills || []) {
        for (const resource of skill.studyResources || skill.resources || []) {
          if (!resource?.id) continue;
          if (!seen.has(resource.id)) seen.set(resource.id, {
            ...resource,
            skillLabel: skill.label,
            domainLabel: domain.label,
            trackLabel: track.label,
            placement: 'skill',
          });
        }
      }
    }
  }
  return [...seen.values()];
}

async function loadLegacyResources() {
  const res = await fetch("data/resources.json", { cache: "no-store" });
  if (!res.ok) return [];
  const legacy = await res.json();
  return (legacy || []).map((r, index) => ({
    id: `legacy-${index}`,
    title: r.title,
    type: ({ phrase_bank: "notes", reading: "link", guide: "study_guide", book: "reference" })[r.kind] || "reference",
    href: r.url,
  }));
}

function renderFilterBar() {
  const present = new Set(allResources.map((r) => r.type));
  const visibleKinds = KINDS.filter((k) => present.has(k.id));
  const filterBar = document.getElementById("filter-bar");
  filterBar.innerHTML = `
    <div class="filter-bar resource-filter-bar">
      <div class="filter-group">
        <div class="filter-group-title">Type</div>
        <div class="filter-chips">
          ${chip("all", "All")}
          ${visibleKinds.map((k) => chip(k.id, k.label)).join("")}
        </div>
      </div>
    </div>`;
  filterBar.querySelectorAll("[data-kind]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeKind = btn.dataset.kind;
      renderFilterBar();
      renderList();
    });
  });
  function chip(id, label) {
    return `<button class="filter-chip ${activeKind === id ? "active" : ""}" data-kind="${id}">${escapeHtml(label)}</button>`;
  }
}

function renderList() {
  const listEl = document.getElementById("resource-list");
  const filtered = allResources.filter((r) => activeKind === "all" || r.type === activeKind);
  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">Nothing in this category yet.</div>`;
    return;
  }
  listEl.innerHTML = `<div class="resource-shelf">${filtered.map(resourceTile).join("")}</div>`;
}

function resourceTile(resource) {
  const kind = KINDS.find((k) => k.id === resource.type) || { single: resource.type || "File", icon: "file", accent: "blue" };
  const href = resource.href || resource.path || "#";
  const external = /^https?:\/\//i.test(href);
  const context = resource.skillLabel || resource.domainLabel || "RLA";
  return `
    <a class="resource-tile ${kind.accent}" href="${escapeAttr(href)}" ${external ? 'target="_blank" rel="noopener"' : (resource.download !== false ? 'download' : '')}>
      <div class="resource-tile-icon" aria-hidden="true">${iconSvg(kind.icon)}</div>
      <div class="resource-tile-label">${escapeHtml(kind.single)}</div>
      <strong>${escapeHtml(resource.title)}</strong>
      <span class="resource-tile-context">${escapeHtml(context)}</span>
    </a>`;
}

function iconSvg(type) {
  if (type === "book") return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 13h24c4.418 0 8 3.582 8 8v28H26c-4.418 0-8-3.582-8-8V13Z" fill="currentColor" opacity=".16"/><path d="M18 13h24c4.418 0 8 3.582 8 8v28H26c-4.418 0-8-3.582-8-8V13Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M18 45c0-4.418 3.582-8 8-8h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M26 23h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (type === "link") return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26 38l12-12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M22 43l-4 4a10 10 0 01-14-14l10-10a10 10 0 0114 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M42 21l4-4a10 10 0 0114 14L50 41a10 10 0 01-14 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h20l10 10v34H18c-3.314 0-6-2.686-6-6V16c0-3.314 2.686-6 6-6Z" fill="currentColor" opacity=".14"/><path d="M38 10v10h10" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M18 10h20l10 10v28c0 3.314-2.686 6-6 6H18c-3.314 0-6-2.686-6-6V16c0-3.314 2.686-6 6-6Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M22 31h16M22 39h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
}

function escapeHtml(str) { const div = document.createElement("div"); div.textContent = str ?? ""; return div.innerHTML; }
function escapeAttr(str) { return escapeHtml(str).replace(/"/g, "&quot;"); }
