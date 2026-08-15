/*
  practice.js — simple curriculum index
  ------------------------------------
  Practice should feel like a library index, not a dashboard full of cards.
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

  let curriculum;
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
    const availability = track.availableSetCount
      ? `${track.availableSetCount} set${track.availableSetCount === 1 ? "" : "s"} · ${track.questionCount} questions`
      : `${track.totalSkillCount || track.domains.reduce((n,d)=>n+d.skills.length,0)} skills mapped`;

    return `
      <a class="practice-track-row" href="curriculum.html?track=${encodeURIComponent(track.id)}">
        <span class="practice-track-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="practice-track-copy">
          <h3>${escapeHtml(track.label)}</h3>
          <p>${escapeHtml(track.summary)}</p>
        </div>
        <div class="practice-track-meta">
          <span>${escapeHtml(availability)}</span>
          <b aria-hidden="true">→</b>
        </div>
      </a>`;
  }).join("");
}

function renderNextStep() {
  const mount = document.getElementById("practice-next-mount");
  if (!mount) return;

  let summary = null;
  try { summary = typeof Learning !== "undefined" ? Learning.getSummary() : null; } catch (_) {}

  if (summary?.attempts) {
    const nextSkill = summary.weakestSkills?.[0] || summary.skills?.[0];
    const due = summary.dueReviews || summary.activeMistakes || 0;
    mount.innerHTML = `
      <aside class="practice-next-line">
        <div>
          <span class="practice-next-label">Suggested next</span>
          <strong>${escapeHtml(nextSkill?.label || "Continue your recent work")}</strong>
          <span>${due ? `${due} review${due === 1 ? "" : "s"} ready` : "A short focused session is ready"}</span>
        </div>
        <a class="btn" href="train.html">Train me</a>
      </aside>`;
    return;
  }

  mount.innerHTML = `
    <aside class="practice-next-line">
      <div>
        <span class="practice-next-label">New here?</span>
        <strong>Start with a short baseline.</strong>
        <span>Studo will use your first answers to suggest what to practice next.</span>
      </div>
      <a class="btn" href="train.html">Build baseline</a>
    </aside>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
