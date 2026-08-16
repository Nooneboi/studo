/* domain.js — grouped skill index; resources live on the skill page */
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

  const groups = normalizeGroups(domain);
  mount.innerHTML = `
    <header class="simple-domain-hero">
      <a class="curriculum-back" href="curriculum.html?track=${encodeURIComponent(track.id)}">← ${escapeHtml(track.label)}</a>
      <div class="page-kicker">${escapeHtml(track.shortLabel || track.label)}</div>
      <h1>${escapeHtml(domain.label)}</h1>
    </header>
    <div class="simple-skill-groups">
      ${groups.map((group) => `
        <section class="simple-skill-group">
          <h2>${escapeHtml(group.label)}</h2>
          <div class="simple-skill-list">
            ${group.items.map((skill) => renderSkill(track, domain, skill)).join("")}
          </div>
        </section>`).join("")}
    </div>`;
}

function normalizeGroups(domain) {
  const configured = domain.groups?.length ? domain.groups : [{ id:"skills", label:"Skills", skills:domain.skills.map((s)=>s.id) }];
  const map = new Map(domain.skills.map((s)=>[s.id,s]));
  return configured.map((g)=>({ ...g, items:(g.skills||[]).map((id)=>map.get(id)).filter(Boolean) }));
}

function renderSkill(track, domain, skill) {
  const files = skill.resourceCount || 0;
  const checks = skill.setCount || 0;
  const availability = files ? `${files} file${files===1?"":"s"}` : checks ? "Check available" : "";
  return `
    <a class="simple-skill-row" href="skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}">
      <span>${escapeHtml(skill.label)}</span>
      <span class="simple-skill-meta">${escapeHtml(availability)}</span>
      <b aria-hidden="true">→</b>
    </a>`;
}
function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
