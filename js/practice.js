/* practice.js — resource-first learner index */
init();

async function init() {
  const params = new URLSearchParams(location.search);
  const subject = params.get("subject") || (window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:activeSubject") : localStorage.getItem("sq:activeSubject")) || "rla";
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
  const model = window.StudoLibraryModel;
  const items = model ? model.buildPracticeSearchItems(tracks) : [];

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }
    const matches = items.filter((item) => item.searchText.includes(query.replace(/_/g, "-"))).slice(0, 10);
    results.hidden = false;
    results.innerHTML = matches.length ? matches.map((item) => {
      const target = item.unitId
        ? `skill.html?track=${encodeURIComponent(item.trackId)}&domain=${encodeURIComponent(item.domainId)}&unit=${encodeURIComponent(item.unitId)}`
        : `skill.html?track=${encodeURIComponent(item.trackId)}&domain=${encodeURIComponent(item.domainId)}&skill=${encodeURIComponent(item.skillId)}`;
      return `
        <a class="skill-search-row" href="${target}">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.domainLabel)} · ${escapeHtml(item.trackLabel)}</span>
          <b aria-hidden="true">→</b>
        </a>`;
    }).join("") : `<div class="skill-search-empty">No matching topic.</div>`;
  });
}

function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
