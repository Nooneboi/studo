/* curriculum.js — one clear choice: which domain? */
init();

async function init() {
  const mount = document.getElementById("curriculum-view");
  const params = new URLSearchParams(location.search);
  const trackId = params.get("track") || "reading";
  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = `<div class="empty-state">The curriculum could not be loaded.</div>`; return; }

  const track = curriculum.tracks.find((item) => item.id === trackId) || curriculum.tracks[0];
  if (!track) { mount.innerHTML = `<div class="empty-state">No curriculum is available yet.</div>`; return; }

  mount.innerHTML = `
    <header class="simple-curriculum-hero">
      <a class="curriculum-back" href="practice.html">← Practice</a>
      <div class="page-kicker">RLA curriculum</div>
      <h1>${escapeHtml(track.label)}</h1>
    </header>
    <section class="simple-domain-list" aria-label="${escapeHtml(track.label)} topics">
      ${track.domains.map((domain) => `
        <a class="simple-domain-row" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">
          <span>${escapeHtml(domain.label)}</span>
          <b aria-hidden="true">→</b>
        </a>`).join("")}
      ${track.id === "reading" ? `
        <a class="simple-domain-row" href="passages.html">
          <span>Passage practice</span>
          <b aria-hidden="true">→</b>
        </a>` : ""}
    </section>`;
}
function escapeHtml(value) { const div=document.createElement("div"); div.textContent=value??""; return div.innerHTML; }
