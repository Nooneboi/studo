/* skill.js — three-column skill resource layout */
init();

async function init() {
  const mount = document.getElementById("skill-view");
  const p = new URLSearchParams(location.search);
  const trackId = p.get("track") || "reading";
  const domainId = p.get("domain");
  const skillId = p.get("skill");
  const unitId = p.get("unit");
  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = `<div class="empty-state">The curriculum could not be loaded.</div>`; return; }

  const track = curriculum.tracks.find((x) => x.id === trackId) || curriculum.tracks[0];
  const domain = track?.domains.find((x) => x.id === domainId) || track?.domains[0];
  const item = unitId
    ? domain?.units?.find((x) => x.id === unitId)
    : domain?.skills.find((x) => x.id === skillId);
  if (!track || !domain || !item) {
    mount.innerHTML = `<div class="empty-state">This learning area could not be found. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  const resources = item.studyResources || item.resources || [];
  const studyGuides = resources.filter((r) => r.type !== "worksheet");
  const workbookSheets = resources.filter((r) => r.type === "worksheet");
  const practiceSets = item.sets || [];
  const checks = item.checks || [];

  document.title = `Chee Skool — ${item.label}`;
  mount.innerHTML = `
    <header class="skill-library-hero">
      <a class="curriculum-back" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">← ${escapeHtml(domain.label)}</a>
      <div class="page-kicker">${escapeHtml(track.label)}</div>
      <h1>${escapeHtml(item.label)}</h1>
      ${item.summary ? `<p class="skill-library-summary">${escapeHtml(item.summary)}</p>` : ""}
    </header>

    <section class="skill-resource-grid" aria-label="${escapeHtml(item.label)} learning resources">
      ${renderColumn("Study Guide", studyGuides, (r) => renderResource(r))}
      ${renderColumn("Workbook Sheets", workbookSheets, (r) => renderResource(r))}
      ${renderColumn("Interactive Practice", practiceSets, (set) => renderPracticeSet(set, track, domain, item, Boolean(unitId)))}
    </section>
    ${renderSkillChecks(checks, track, domain, item, Boolean(unitId))}`;
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
  return `<a class="skill-resource-link" href="${escapeAttr(safeHref(href))}" ${r.download !== false && !external ? "download" : ""} ${external ? 'target="_blank" rel="noopener"' : ""}>
    <strong>${escapeHtml(r.title)}</strong>
  </a>`;
}

function renderPracticeSet(set, track, domain, item, isUnit) {
  const key = isUnit ? "unit" : "skill";
  const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&${key}=${encodeURIComponent(item.id)}`;
  const href = `module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent(returnHref)}`;
  return `<a class="skill-resource-link" href="${href}">
    <strong>${escapeHtml(set.title)}</strong>
  </a>`;
}

function renderSkillChecks(checks, track, domain, item, isUnit) {
  if (!checks.length) return "";
  const key = isUnit ? "unit" : "skill";
  const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&${key}=${encodeURIComponent(item.id)}`;
  return `<section class="skill-check-section" aria-labelledby="skill-check-heading">
    <div class="skill-check-heading">
      <div><span class="page-kicker">Independent check</span><h2 id="skill-check-heading">Skill Check</h2></div>
      <p>Independent · no hints · answers after finishing</p>
    </div>
    <div class="skill-check-list">${checks.map((check) => {
      const href = `check.html?file=${encodeURIComponent(check.file)}&return=${encodeURIComponent(returnHref)}`;
      return `<a class="skill-check-link" href="${escapeAttr(href)}"><strong>${escapeHtml(check.title)}</strong><span>Independent · no hints · answers after finishing</span></a>`;
    }).join("")}</div>
  </section>`;
}

function escapeHtml(v) { const d = document.createElement("div"); d.textContent = v ?? ""; return d.innerHTML; }
function escapeAttr(v) { return escapeHtml(v).replace(/"/g, "&quot;"); }


function safeHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "#";
  if (raw.startsWith("#")) return raw;
  try {
    const parsed = new URL(raw, window.location.href);
    if (!["http:", "https:"].includes(parsed.protocol)) return "#";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return parsed.href;
    return raw;
  } catch (_) {
    return "#";
  }
}
