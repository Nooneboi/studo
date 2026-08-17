/* skill.js — three-column skill resource layout */
init();

async function init() {
  const mount = document.getElementById("skill-view");
  const p = new URLSearchParams(location.search);
  const trackId = p.get("track") || "reading";
  const domainId = p.get("domain");
  const skillId = p.get("skill");
  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = `<div class="empty-state">The curriculum could not be loaded.</div>`; return; }

  const track = curriculum.tracks.find((x) => x.id === trackId) || curriculum.tracks[0];
  const domain = track?.domains.find((x) => x.id === domainId) || track?.domains[0];
  const skill = domain?.skills.find((x) => x.id === skillId);
  if (!track || !domain || !skill) {
    mount.innerHTML = `<div class="empty-state">This skill could not be found. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  const resources = skill.studyResources || skill.resources || [];
  const studyGuides = resources.filter((r) => r.type !== "worksheet");
  const workbookSheets = resources.filter((r) => r.type === "worksheet");
  const checks = skill.checks || skill.sets || [];

  document.title = `Studo — ${skill.label}`;
  mount.innerHTML = `
    <header class="skill-library-hero">
      <a class="curriculum-back" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">← ${escapeHtml(domain.label)}</a>
      <div class="page-kicker">${escapeHtml(track.label)}</div>
      <h1>${escapeHtml(skill.label)}</h1>
    </header>

    <section class="skill-resource-grid" aria-label="${escapeHtml(skill.label)} learning resources">
      ${renderColumn("Study Guide", studyGuides, (r) => renderResource(r))}
      ${renderColumn("Workbook Sheets", workbookSheets, (r) => renderResource(r))}
      ${renderColumn("Interactive Practice", checks, (set) => renderCheck(set, track, domain, skill))}
    </section>`;
}

function renderColumn(title, items, renderer) {
  const empty = title === "Study Guide"
    ? "No study guides yet."
    : title === "Workbook Sheets"
      ? "No workbook sheets yet."
      : "No interactive practice yet.";
  return `<section class="skill-resource-column">
    <h2>${escapeHtml(title)}</h2>
    <div class="skill-resource-column-list">
      ${items.length ? items.map(renderer).join("") : `<p class="skill-resource-column-empty">${empty}</p>`}
    </div>
  </section>`;
}

function renderResource(r) {
  const href = r.href || r.path || "#";
  const external = /^https?:\/\//i.test(href);
  return `<a class="skill-resource-link" href="${escapeAttr(href)}" ${r.download !== false && !external ? "download" : ""} ${external ? 'target="_blank" rel="noopener"' : ""}>
    <strong>${escapeHtml(r.title)}</strong>
    ${r.description ? `<span>${escapeHtml(r.description)}</span>` : ""}
  </a>`;
}

function renderCheck(set, track, domain, skill) {
  const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}`;
  const href = `module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent(returnHref)}`;
  return `<a class="skill-resource-link" href="${href}">
    <strong>${escapeHtml(set.title)}</strong>
    ${set.description ? `<span>${escapeHtml(set.description)}</span>` : ""}
  </a>`;
}

function escapeHtml(v) { const d = document.createElement("div"); d.textContent = v ?? ""; return d.innerHTML; }
function escapeAttr(v) { return escapeHtml(v).replace(/"/g, "&quot;"); }
