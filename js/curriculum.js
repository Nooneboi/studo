/*
  curriculum.js — track index
  ---------------------------
  A track page should only answer: which domain do I want next?
  Domain detail belongs on its own page so the learner never sees every layer at once.
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

  mount.innerHTML = `
    <section class="curriculum-index-hero">
      <a class="curriculum-back" href="practice.html">← Practice</a>
      <div class="page-kicker">RLA curriculum</div>
      <h1>${escapeHtml(track.label)}</h1>
      <p>${escapeHtml(track.summary)}</p>
      <div class="curriculum-index-meta">
        <span>${track.domains.length} domains</span>
        <span>${track.totalSkillCount} skills</span>
        <span>${track.availableSetCount} practice sets</span>
      </div>
    </section>

    <nav class="curriculum-track-tabs" aria-label="RLA practice tracks">
      ${curriculum.tracks.map((item) => `
        <a class="${item.id === track.id ? "active" : ""}" href="curriculum.html?track=${encodeURIComponent(item.id)}">${escapeHtml(item.shortLabel || item.label)}</a>
      `).join("")}
    </nav>

    <section class="curriculum-domain-index" aria-label="${escapeHtml(track.label)} domains">
      ${track.domains.map((domain, index) => `
        <a class="curriculum-domain-row" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">
          <span class="curriculum-domain-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="curriculum-domain-title"><h2>${escapeHtml(domain.label)}</h2></div>
          <div class="curriculum-domain-count">
            <span>${domain.skills.length} skills</span>
            ${domain.availableSetCount ? `<span>${domain.availableSetCount} sets ready</span>` : `<span>Mapped</span>`}
            <b aria-hidden="true">→</b>
          </div>
        </a>
      `).join("")}
    </section>`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
