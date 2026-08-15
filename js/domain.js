/*
  domain.js — one domain, grouped and ordered
  -------------------------------------------
  Inspired by good curriculum indexes: clear sections, numbered skills, and
  resource links under each skill. No dashboard cards and no nested accordions.
*/

init();

async function init() {
  const mount = document.getElementById("domain-view");
  const params = new URLSearchParams(location.search);
  const trackId = params.get("track") || "reading";
  const domainId = params.get("domain");

  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) {
    mount.innerHTML = `<div class="empty-state">The curriculum map could not be loaded.</div>`;
    return;
  }

  const track = curriculum.tracks.find((t) => t.id === trackId) || curriculum.tracks[0];
  const domain = track?.domains.find((d) => d.id === domainId) || track?.domains[0];
  if (!track || !domain) {
    mount.innerHTML = `<div class="empty-state">This curriculum area could not be found.</div>`;
    return;
  }

  const groups = normalizeGroups(domain);
  mount.innerHTML = `
    <header class="domain-hero">
      <a class="curriculum-back" href="curriculum.html?track=${encodeURIComponent(track.id)}">← ${escapeHtml(track.shortLabel || track.label)}</a>
      <div class="page-kicker">${escapeHtml(track.label)}</div>
      <h1>${escapeHtml(domain.label)}</h1>
      <p>${escapeHtml(domain.summary)}</p>
      <div class="domain-summary-line">
        <span>${domain.skills.length} skills</span>
        <span>${domain.availableSetCount} web sets</span>
        <span>${domain.skills.reduce((n,s)=>n+(s.resourceCount||0),0)} study files</span>
      </div>
    </header>

    <div class="domain-layout">
      <aside class="domain-jump" aria-label="Sections">
        <span class="domain-jump-label">On this page</span>
        ${groups.map((g) => `<a href="#${escapeHtml(g.id)}">${escapeHtml(g.label)}</a>`).join("")}
      </aside>
      <div class="domain-groups">
        ${groups.map((group, groupIndex) => renderGroup(group, groupIndex)).join("")}
      </div>
    </div>`;
}

function normalizeGroups(domain) {
  const configured = domain.groups?.length ? domain.groups : [{ id: "skills", label: "Skills", skills: domain.skills.map((s) => s.id) }];
  const skillMap = new Map(domain.skills.map((s) => [s.id, s]));
  return configured.map((g) => ({ ...g, items: (g.skills || []).map((id) => skillMap.get(id)).filter(Boolean) }));
}

function renderGroup(group, groupIndex) {
  return `
    <section class="domain-group" id="${escapeHtml(group.id)}">
      <div class="domain-group-heading">
        <span>${String(groupIndex + 1).padStart(2, "0")}</span>
        <h2>${escapeHtml(group.label)}</h2>
      </div>
      <div class="domain-skill-list">
        ${group.items.map((skill, skillIndex) => renderSkill(skill, skillIndex)).join("")}
      </div>
    </section>`;
}

function renderSkill(skill, skillIndex) {
  const resources = [];
  for (const set of skill.sets || []) {
    resources.push({
      type: prettyKind(set.curriculum?.contentKind),
      title: set.title,
      meta: `${capitalize(set.difficulty || "medium")} · ${set.questionCount} questions`,
      href: `module.html?file=${encodeURIComponent(set.file)}`,
      download: false,
    });
  }
  for (const resource of skill.resources || []) {
    resources.push({
      type: prettyResourceType(resource.type),
      title: resource.title,
      meta: resource.description || (resource.type === "pdf" ? "Downloadable study file" : "Study resource"),
      href: resource.href || resource.path || "#",
      download: resource.download !== false && resource.type === "pdf",
    });
  }

  return `
    <section class="domain-skill" id="skill-${escapeHtml(skill.id)}">
      <div class="domain-skill-heading">
        <span class="domain-skill-number">${String(skillIndex + 1).padStart(2, "0")}</span>
        <div><h3>${escapeHtml(skill.label)}</h3><span class="domain-skill-id">${escapeHtml(skill.id)}</span></div>
        <div class="domain-skill-ready">${resources.length ? `${resources.length} resource${resources.length === 1 ? "" : "s"}` : "Coming next"}</div>
      </div>
      ${resources.length ? `
        <div class="domain-resource-list">
          ${resources.map((resource) => `
            <a class="domain-resource-row" href="${escapeAttr(resource.href)}" ${resource.download ? "download" : ""}>
              <span class="domain-resource-type">${escapeHtml(resource.type)}</span>
              <strong>${escapeHtml(resource.title)}</strong>
              <span class="domain-resource-meta">${escapeHtml(resource.meta)}</span>
              <b aria-hidden="true">${resource.download ? "↓" : "→"}</b>
            </a>`).join("")}
        </div>` : `<div class="domain-empty-note">No learner material published yet.</div>`}
    </section>`;
}

function prettyKind(kind) {
  return ({ passage_practice:"Passage practice", skill_drill:"Skill drill", quiz:"Quiz", mixed_review:"Mixed review", editing_practice:"Editing practice", extended_response:"Extended response" })[kind] || "Practice";
}
function prettyResourceType(type) {
  return ({ pdf:"PDF guide", worksheet:"Worksheet", study_guide:"Study guide", notes:"Notes", reference:"Reference" })[type] || "Resource";
}
function capitalize(value) { return String(value || "").replace(/_/g," ").replace(/^./,(c)=>c.toUpperCase()); }
function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g,"&quot;"); }
