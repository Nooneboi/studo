/* curriculum.js — simple grouped RLA skill browsing */
init();

async function init() {
  const mount = document.getElementById("curriculum-view");
  const params = new URLSearchParams(location.search);
  const trackId = params.get("track") || "reading";
  let curriculum;
  try { curriculum = await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML = '<p>The curriculum could not be loaded.</p>'; return; }

  const track = curriculum.tracks.find((item) => item.id === trackId);
  if (!track) {
    mount.innerHTML = '<p>This study area is not available yet.</p>';
    return;
  }

  document.title = `Chee Skool — ${track.label}`;

  mount.innerHTML = `
    <a class="simple-back" href="rla.html">GED RLA</a>
    <div class="simple-kicker">RLA</div>
    <h1>${escapeHtml(track.label)}</h1>
    <div class="simple-skill-groups">
      ${track.domains.map((domain) => renderDomain(track, domain)).join("")}
    </div>`;
}

function renderDomain(track, domain) {
  const skills = (domain.skills || []).filter((skill) => skill.available !== false);
  if (!skills.length) return "";
  return `
    <section class="simple-skill-group">
      <h2>${escapeHtml(domain.label)}</h2>
      <ul>
        ${skills.map((skill) => `
          <li>
            <a href="skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}">${escapeHtml(skill.label)}</a>
          </li>`).join("")}
      </ul>
    </section>`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
