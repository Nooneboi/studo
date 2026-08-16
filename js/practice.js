/* practice.js — resource-first learner index */
init();

async function init() {
  const params = new URLSearchParams(location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const listEl = document.getElementById("category-list");
  if (subject !== "rla") {
    listEl.innerHTML = `<div class="empty-state">This subject is not available yet.</div>`;
    return;
  }

  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) {
    listEl.innerHTML = `<div class="empty-state">The curriculum could not be loaded.</div>`;
    return;
  }

  renderTracks(curriculum.tracks || []);
  setupSearch(curriculum.tracks || []);
}

function renderTracks(tracks) {
  const listEl = document.getElementById("category-list");
  const trackRows = tracks.map((track) => `
    <a class="library-track-row" href="curriculum.html?track=${encodeURIComponent(track.id)}">
      <span>${escapeHtml(track.label)}</span>
      <b aria-hidden="true">→</b>
    </a>`).join("");
  listEl.innerHTML = trackRows;
}

function setupSearch(tracks) {
  const input = document.getElementById("skill-search");
  const results = document.getElementById("skill-search-results");
  const items = [];
  for (const track of tracks) {
    for (const domain of track.domains || []) {
      for (const skill of domain.skills || []) {
        items.push({ track, domain, skill });
      }
    }
  }

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }
    const matches = items.filter(({ track, domain, skill }) =>
      `${skill.label} ${domain.label} ${track.label}`.toLowerCase().includes(query)
    ).slice(0, 8);
    results.hidden = false;
    results.innerHTML = matches.length ? matches.map(({ track, domain, skill }) => `
      <a class="skill-search-row" href="skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}">
        <strong>${escapeHtml(skill.label)}</strong>
        <span>${escapeHtml(domain.label)} · ${escapeHtml(track.shortLabel || track.label)}</span>
        <b aria-hidden="true">→</b>
      </a>`).join("") : `<div class="skill-search-empty">No matching topic.</div>`;
  });
}

function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
