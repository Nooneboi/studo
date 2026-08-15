/*
  practice.js — curriculum-driven Practice hub
  --------------------------------------------
  The learner sees four calm tracks. The richer 8-domain RLA taxonomy stays
  underneath and powers each track rather than being dumped onto the homepage.
*/

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const listEl = document.getElementById("category-list");

  if (subject !== "rla") {
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  let curriculum = null;
  try {
    curriculum = await Data.loadCurriculum();
  } catch (_) {
    listEl.innerHTML = `<div class="empty-state">The curriculum map could not be loaded. Run the content build and try again.</div>`;
    return;
  }

  renderNextStep();
  renderTracks(curriculum.tracks || []);
}

function renderTracks(tracks) {
  const listEl = document.getElementById("category-list");
  const countEl = document.getElementById("practice-area-count");
  if (countEl) countEl.textContent = `${tracks.length} tracks`;

  listEl.innerHTML = tracks.map((track, index) => {
    const availableDomains = track.domains.filter((d) => d.availableSkillCount > 0);
    const domainLabels = track.domains.slice(0, 4).map((d) => `<span>${escapeHtml(d.label)}</span>`).join("");
    const availability = track.availableSetCount
      ? `${track.availableSetCount} set${track.availableSetCount === 1 ? "" : "s"} · ${track.questionCount} skill q`
      : "Curriculum mapped · practice coming next";

    return `
      <a class="practice-area-card practice-area-${escapeHtml(track.accent || "blue")}" href="curriculum.html?track=${encodeURIComponent(track.id)}">
        <div class="practice-area-topline">
          <span class="practice-area-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="practice-area-count">${escapeHtml(availability)}</span>
        </div>
        <div>
          <h3>${escapeHtml(track.label)}</h3>
          <p>${escapeHtml(track.summary)}</p>
        </div>
        <div class="practice-area-topics" aria-label="Curriculum areas">${domainLabels}</div>
        <div class="practice-area-open">${track.availableSetCount ? "Explore track" : "View curriculum"} <span aria-hidden="true">→</span></div>
      </a>`;
  }).join("");
}

function renderNextStep() {
  const mount = document.getElementById("practice-next-mount");
  if (!mount) return;

  let summary = null;
  try {
    summary = typeof Learning !== "undefined" ? Learning.getSummary() : null;
  } catch (_) {}

  if (summary?.attempts) {
    const nextSkill = summary.weakestSkills?.[0] || summary.skills?.[0];
    const due = summary.dueReviews || summary.activeMistakes || 0;
    const headline = nextSkill ? nextSkill.label : "Keep your skills moving";
    const note = due
      ? `${due} review${due === 1 ? " is" : "s are"} ready. Studo can mix them with fresh questions.`
      : "Your recent work is saved. A short focused session is ready when you are.";

    mount.innerHTML = `
      <aside class="practice-next-card">
        <div class="practice-next-label">Suggested next</div>
        <h2>${escapeHtml(headline)}</h2>
        <p>${escapeHtml(note)}</p>
        <div class="practice-next-actions">
          <a class="btn" href="train.html">Train me</a>
          <a class="text-link" href="progress.html">View progress →</a>
        </div>
      </aside>`;
    return;
  }

  mount.innerHTML = `
    <aside class="practice-next-card is-new">
      <div class="practice-next-label">Start simple</div>
      <h2>Try a short baseline.</h2>
      <p>Your first few answers help Studo decide what deserves more practice later.</p>
      <div class="practice-next-actions">
        <a class="btn" href="train.html">Build baseline</a>
        <a class="text-link" href="curriculum.html?track=reading">Browse Reading →</a>
      </div>
    </aside>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
