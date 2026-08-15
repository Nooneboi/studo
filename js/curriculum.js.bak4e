/*
  curriculum.js
  -------------
  Learner-facing RLA map. The authoring taxonomy stays complete, but the page
  reveals it progressively: track -> domain -> skill -> available set.
*/

init();

async function init() {
  const mount = document.getElementById("curriculum-view");
  const params = new URLSearchParams(location.search);
  const trackId = params.get("track") || "reading";

  let curriculum;
  try {
    curriculum = await Data.loadCurriculum();
  } catch (_) {
    mount.innerHTML = `<div class="empty-state">The curriculum map could not be loaded. Run the content build and try again.</div>`;
    return;
  }

  const track = curriculum.tracks.find((item) => item.id === trackId) || curriculum.tracks[0];
  if (!track) {
    mount.innerHTML = `<div class="empty-state">No RLA curriculum is available yet.</div>`;
    return;
  }

  const summary = safeSummary();
  const signals = new Map((summary?.skills || []).map((skill) => [skill.id, skill]));
  const firstAvailableDomain = track.domains.find((domain) => domain.availableSkillCount > 0)?.id || null;

  mount.innerHTML = `
    <section class="curriculum-hero curriculum-accent-${escapeHtml(track.accent || "blue")}">
      <div>
        <a class="curriculum-back" href="practice.html">← Practice</a>
        <div class="page-kicker">RLA curriculum</div>
        <h1>${escapeHtml(track.label)}</h1>
        <p>${escapeHtml(track.summary)}</p>
      </div>
      <aside class="curriculum-hero-meta">
        <div><strong>${track.availableSkillCount}</strong><span>skills with practice</span></div>
        <div><strong>${track.availableSetCount}</strong><span>available sets</span></div>
        <a class="btn" href="train.html">Train me</a>
      </aside>
    </section>

    <nav class="curriculum-track-tabs" aria-label="RLA practice tracks">
      ${curriculum.tracks.map((item) => `
        <a class="${item.id === track.id ? "active" : ""}" href="curriculum.html?track=${encodeURIComponent(item.id)}">${escapeHtml(item.shortLabel || item.label)}</a>
      `).join("")}
    </nav>

    <section class="curriculum-domains" aria-label="${escapeHtml(track.label)} domains">
      ${track.domains.map((domain) => renderDomain(domain, signals, domain.id === firstAvailableDomain)).join("")}
    </section>`;
}

function renderDomain(domain, signals, shouldOpen) {
  const availableLabel = domain.availableSkillCount
    ? `${domain.availableSkillCount} of ${domain.skills.length} skills ready`
    : `${domain.skills.length} skills mapped`;

  return `
    <details class="curriculum-domain" ${shouldOpen ? "open" : ""}>
      <summary>
        <div class="curriculum-domain-copy">
          <h2>${escapeHtml(domain.label)}</h2>
          <p>${escapeHtml(domain.summary)}</p>
        </div>
        <div class="curriculum-domain-status">
          <span>${escapeHtml(availableLabel)}</span>
          <span class="curriculum-chevron" aria-hidden="true">⌄</span>
        </div>
      </summary>
      <div class="curriculum-skill-list">
        ${domain.skills.map((skill) => renderSkill(skill, signals.get(skill.runtimeId) || signals.get(skill.id))).join("")}
      </div>
    </details>`;
}

function renderSkill(skill, signal) {
  const status = learningStatus(signal);
  if (!skill.available) {
    return `
      <div class="curriculum-skill is-unavailable">
        <div class="curriculum-skill-main">
          <span class="curriculum-skill-name">${escapeHtml(skill.label)}</span>
          <span class="curriculum-skill-state">Mapped</span>
        </div>
        <span class="curriculum-skill-note">Practice not built yet</span>
      </div>`;
  }

  return `
    <details class="curriculum-skill is-available">
      <summary>
        <div class="curriculum-skill-main">
          <span class="curriculum-skill-name">${escapeHtml(skill.label)}</span>
          ${status ? `<span class="curriculum-signal ${status.className}">${escapeHtml(status.label)}</span>` : ""}
        </div>
        <span class="curriculum-skill-note">${skill.setCount} set${skill.setCount === 1 ? "" : "s"} · ${skill.questionCount} q</span>
      </summary>
      <div class="curriculum-set-list">
        ${skill.sets.map((set) => `
          <a class="curriculum-set" href="module.html?file=${encodeURIComponent(set.file)}">
            <div>
              <strong>${escapeHtml(set.title)}</strong>
              <span>${escapeHtml(set.description || "Practice this skill in context.")}</span>
            </div>
            <div class="curriculum-set-meta">
              <span>${prettyKind(set.curriculum?.contentKind)}</span>
              <span>${capitalize(set.difficulty || "medium")}</span>
              <span>${set.questionCount} q</span>
              <b aria-hidden="true">→</b>
            </div>
          </a>`).join("")}
      </div>
    </details>`;
}

function learningStatus(signal) {
  if (!signal) return null;
  const due = signal.dueAt && new Date(signal.dueAt).getTime() <= Date.now();
  if (due) return { label: "Review due", className: "is-review" };
  if (signal.status === "Needs work") return { label: "Needs practice", className: "is-needs" };
  if (signal.status === "Strong") return { label: "Strong", className: "is-strong" };
  return { label: "Building", className: "is-building" };
}

function safeSummary() {
  try { return typeof Learning !== "undefined" ? Learning.getSummary() : null; }
  catch (_) { return null; }
}

function prettyKind(kind) {
  return ({
    passage_practice: "Passage practice",
    skill_drill: "Skill drill",
    quiz: "Quiz",
    mixed_review: "Mixed review",
    editing_practice: "Editing practice",
    extended_response: "Extended response",
  })[kind] || "Practice";
}

function capitalize(value) {
  return String(value || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
