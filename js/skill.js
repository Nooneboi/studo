/* skill.js — one obvious study action, details underneath */
init();

async function init() {
  const mount = document.getElementById("skill-view");
  const p = new URLSearchParams(location.search);
  const trackId = p.get("track") || "reading";
  const domainId = p.get("domain");
  const skillId = p.get("skill");

  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = '<p>The curriculum could not be loaded.</p>'; return; }

  const track = curriculum.tracks.find((x) => x.id === trackId);
  const domain = track?.domains.find((x) => x.id === domainId);
  const skill = domain?.skills.find((x) => x.id === skillId);

  if (!track || !domain || !skill) {
    mount.innerHTML = '<p>This skill could not be found.</p>';
    return;
  }

  const sets = skill.sets || [];
  const checks = skill.checks || [];
  const resources = skill.studyResources || skill.resources || [];
  const startSet = sets[0] || null;
  const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}`;
  const startHref = startSet
    ? `module.html?file=${encodeURIComponent(startSet.file)}&return=${encodeURIComponent(returnHref)}`
    : null;

  document.title = `Chee Skool — ${skill.label}`;

  mount.innerHTML = skill.id === "R1.2"
    ? renderMainIdeaHub(track, domain, skill, sets, checks, resources, returnHref)
    : `
      <a class="simple-back" href="curriculum.html?track=${encodeURIComponent(track.id)}">${escapeHtml(track.label)}</a>
      <div class="simple-kicker">${escapeHtml(domain.label)}</div>
      <h1>${escapeHtml(skill.label)}</h1>

      ${startHref
        ? `<p class="simple-primary-action"><a href="${escapeAttr(startHref)}">Start studying</a></p>`
        : '<p class="simple-muted">Study material is being prepared.</p>'}

      <nav class="simple-skill-actions" aria-label="${escapeHtml(skill.label)} options">
        ${sets.length ? `<a href="${escapeAttr(startHref)}">Learn</a>` : ""}
        ${sets.length > 1 ? `<a href="${escapeAttr(moduleHref(sets[1], returnHref))}">Practice</a>` : ""}
        ${checks.length ? `<a href="${escapeAttr(checkHref(checks[0], returnHref))}">Check</a>` : ""}
        ${resources.length ? '<a href="#resources">More resources</a>' : ""}
      </nav>

      ${resources.length ? `
        <section class="simple-resources" id="resources">
          <h2>More resources</h2>
          <ul>
            ${resources.map(renderResource).join("")}
          </ul>
        </section>` : ""}`;
}

function renderMainIdeaHub(track, domain, skill, sets, checks, resources, returnHref) {
  const learnSet = sets.find((set) => set.curriculum?.assistanceLevel === "full") || sets[0];
  const practiceSets = sets.filter((set) => set.file && set.file !== learnSet?.file);
  const check = checks[0] || null;
  const practiceLabels = ["B", "C", "D", "E"];
  return `
    <a class="simple-back" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">← ${escapeHtml(domain.label)}</a>
    <div class="simple-kicker">${escapeHtml(domain.label)}</div>
    <h1>Main Idea</h1>
    <p class="mainidea-hub-lede">Build the skill first. Then transfer it to harder passages. Finish with a GED-style Skill Check.</p>

    <section class="mainidea-hub-path" aria-label="Main Idea study path">
      ${learnSet ? `
        <a class="mainidea-hub-step primary" href="${escapeAttr(moduleHref(learnSet, returnHref))}">
          <span class="mainidea-hub-step-label">1 · Learn</span>
          <strong>Learn the method</strong>
          <small>Topic vs. main idea, scope, gist, and evidence.</small>
        </a>` : ""}

      ${practiceSets.map((set, index) => `
        <a class="mainidea-hub-step" href="${escapeAttr(moduleHref(set, returnHref))}">
          <span class="mainidea-hub-step-label">${index + 2} · Practice ${practiceLabels[index] || ""}</span>
          <strong>${escapeHtml(mainIdeaStepTitle(set.title))}</strong>
          <small>${escapeHtml(mainIdeaStepDescription(set, index))}</small>
        </a>`).join("")}

      ${check ? `
        <a class="mainidea-hub-step check" href="${escapeAttr(checkHref(check, returnHref))}">
          <span class="mainidea-hub-step-label">${practiceSets.length + 2} · Skill Check</span>
          <strong>Check what transfers</strong>
          <small>8 fresh questions. No hints while you answer.</small>
        </a>` : ""}
    </section>

    ${resources.length ? `
      <section class="simple-resources mainidea-hub-resources" id="resources">
        <h2>Extra study files</h2>
        <p class="simple-muted">Use these after the study path when you want offline review or extra repetition.</p>
        <ul>${resources.map(renderResource).join("")}</ul>
      </section>` : ""}`;
}

function mainIdeaStepTitle(title) {
  return String(title || "")
    .replace(/^Main Idea\s*[—-]\s*Practice\s*[B-E]:?\s*/i, "")
    .replace(/Transfer$/i, "")
    .trim() || "Practice";
}

function mainIdeaStepDescription(set, index) {
  const level = set.curriculum?.assistanceLevel;
  if (level === "supported") return "Stated main idea with structured support.";
  if (level === "light") return "Implied main idea: combine clues before choosing.";
  if (index === 2) return "Transfer the skill to literary text.";
  if (index === 3) return "Harder informational transfer with less support.";
  return set.description || "Practice the skill on a fresh passage.";
}

function moduleHref(set, returnHref) {
  return `module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent(returnHref)}`;
}
function checkHref(check, returnHref) {
  return `check.html?file=${encodeURIComponent(check.file)}&return=${encodeURIComponent(returnHref)}`;
}
function renderResource(resource) {
  const href = safeHref(resource.href || resource.path || "#");
  const external = /^https?:\/\//i.test(href);
  return `<li><a href="${escapeAttr(href)}" ${external ? 'target="_blank" rel="noopener"' : ""}>${escapeHtml(resource.title)}</a></li>`;
}
function safeHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "#";
  try {
    const parsed = new URL(raw, window.location.href);
    if (!["http:", "https:"].includes(parsed.protocol)) return "#";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return parsed.href;
    return raw;
  } catch (_) { return "#"; }
}
function escapeHtml(value) { const d=document.createElement("div"); d.textContent=value??""; return d.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g, "&quot;"); }
