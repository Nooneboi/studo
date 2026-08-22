/* domain.js — grouped skill index with topic-level resources beside the title */
init();

async function init() {
  const mount = document.getElementById("domain-view");
  const params = new URLSearchParams(location.search);
  const trackId = params.get("track") || "reading";
  const domainId = params.get("domain");
  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = `<div class="empty-state">The curriculum could not be loaded.</div>`; return; }

  const track = curriculum.tracks.find((t) => t.id === trackId) || curriculum.tracks[0];
  const domain = track?.domains.find((d) => d.id === domainId) || track?.domains[0];
  if (!track || !domain) { mount.innerHTML = `<div class="empty-state">This curriculum area could not be found.</div>`; return; }

  const unitMode = Array.isArray(domain.units) && domain.units.length > 0;
  const groups = unitMode ? [{ id: "units", label: "Learning units", items: domain.units }] : normalizeGroups(domain);
  const topicResources = domain.topicResources || domain.resources || [];
  const argumentPractice = track.id === "arguments"
    ? (curriculum.argumentPractice || []).filter((set) => !set.curriculum?.domain || set.curriculum.domain === domain.label)
    : [];
  mount.innerHTML = `
    <header class="simple-domain-hero domain-hero-with-resources">
      <div class="domain-hero-copy">
        <a class="curriculum-back" href="curriculum.html?track=${encodeURIComponent(track.id)}">← ${escapeHtml(track.label)}</a>
        <div class="page-kicker">${escapeHtml(track.shortLabel || track.label)}</div>
        <h1>${escapeHtml(domain.label)}</h1>
      </div>
      ${topicResources.length ? `
        <div class="topic-resource-links" aria-label="${escapeHtml(domain.label)} topic files">
          <div class="topic-resource-label">Topic files</div>
          ${topicResources.map(renderTopicResource).join("")}
        </div>` : ""}
    </header>
    <div class="simple-skill-groups compact-skill-groups">
      ${groups.map((group, index) => `
        <section class="simple-skill-group tone-${toneFor(index)}">
          <h2 class="simple-skill-group-title">${escapeHtml(group.label)}</h2>
          <div class="simple-skill-stack">
            ${group.items.map((item) => unitMode ? renderUnit(track, domain, item) : renderSkill(track, domain, item)).join("")}
          </div>
        </section>`).join("")}
      ${argumentPractice.length ? `
        <section class="simple-skill-group tone-purple">
          <h2 class="simple-skill-group-title">Mixed Source Practice</h2>
          <div class="simple-skill-stack">
            ${argumentPractice.map((set) => renderArgumentPractice(set, track, domain)).join("")}
          </div>
        </section>` : ""}
    </div>`;
}

function normalizeGroups(domain) {
  const configured = domain.groups?.length ? domain.groups : [{ id:"skills", label:"Skills", skills:domain.skills.map((s)=>s.id) }];
  const map = new Map(domain.skills.map((s)=>[s.id,s]));
  return configured.map((g)=>({ ...g, items:(g.skills||[]).map((id)=>map.get(id)).filter(Boolean) }));
}

function toneFor(index){
  return ["blue","purple","teal","amber"][index % 4];
}

function renderUnit(track, domain, unit) {
  const files = unit.resourceCount || 0;
  const checks = unit.setCount || unit.checkCount || 0;
  const status = files && checks ? `Files + practice` : files ? `Files ready` : checks ? `Practice ready` : `Coming next`;
  return `
    <a class="simple-skill-pill" href="skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&unit=${encodeURIComponent(unit.id)}">
      <span class="simple-skill-marker" aria-hidden="true"></span>
      <span class="simple-skill-pill-title">${escapeHtml(unit.label)}</span>
      <span class="simple-skill-pill-meta">${escapeHtml(status)}</span>
    </a>`;
}

function renderSkill(track, domain, skill) {
  const files = skill.resourceCount || 0;
  const checks = skill.setCount || 0;
  const status = files && checks ? `Files + practice` : files ? `Files ready` : checks ? `Practice ready` : `Coming next`;
  return `
    <a class="simple-skill-pill" href="skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}">
      <span class="simple-skill-marker" aria-hidden="true"></span>
      <span class="simple-skill-pill-title">${escapeHtml(skill.label)}</span>
      <span class="simple-skill-pill-meta">${escapeHtml(status)}</span>
    </a>`;
}

function renderArgumentPractice(set, track, domain) {
  const returnHref = `domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}`;
  const href = `module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent(returnHref)}`;
  const meta = `${set.questionCount || 0} questions · ${set.difficulty || "mixed"}`;
  return `
    <a class="simple-skill-pill" href="${href}">
      <span class="simple-skill-marker" aria-hidden="true"></span>
      <span class="simple-skill-pill-title">${escapeHtml(set.title)}</span>
      <span class="simple-skill-pill-meta">${escapeHtml(meta)}</span>
    </a>`;
}

function renderTopicResource(resource) {
  const href = resource.href || resource.path || "#";
  const external = /^https?:\/\//i.test(href);
  const type = ({pdf:"PDF",worksheet:"Practice workbook",study_guide:"Study guide",notes:"Notes",reference:"Reference",link:"Link",docx:"DOCX"})[resource.type] || "File";
  return `<a class="topic-resource-link" href="${escapeAttr(safeHref(href))}" ${resource.download !== false && !external ? "download" : ""} ${external ? 'target="_blank" rel="noopener"' : ""}>
    <span>${escapeHtml(type)}</span>
    <strong>${escapeHtml(resource.title)}</strong>
  </a>`;
}

function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g,"&quot;"); }


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
