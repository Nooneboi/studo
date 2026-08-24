/* rla-browse.js — mobile curriculum jump without duplicating curriculum data */
(function () {
  const main = document.querySelector("main");
  if (!main || typeof Data === "undefined") return;

  const strip = document.createElement("div");
  strip.className = "mobile-rla-browse-strip";
  strip.innerHTML = `
    <div class="wrap">
      <button class="mobile-rla-browse-trigger" type="button" aria-haspopup="dialog" aria-controls="rla-browse-dialog">
        <span>Browse RLA</span><span aria-hidden="true">⌄</span>
      </button>
    </div>`;

  const backdrop = document.createElement("div");
  backdrop.className = "rla-browse-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <section class="rla-browse-sheet" id="rla-browse-dialog" role="dialog" aria-modal="true" aria-labelledby="rla-browse-title" tabindex="-1">
      <div class="rla-browse-head">
        <div><span class="rla-browse-kicker">Practice</span><h2 id="rla-browse-title">Browse RLA</h2></div>
        <button class="rla-browse-close" type="button" aria-label="Close RLA browser">Close</button>
      </div>
      <div class="rla-browse-content" id="rla-browse-content"><p class="rla-browse-loading">Loading topics…</p></div>
    </section>`;

  main.prepend(strip);
  document.body.appendChild(backdrop);

  const trigger = strip.querySelector(".mobile-rla-browse-trigger");
  const sheet = backdrop.querySelector(".rla-browse-sheet");
  const closeButton = backdrop.querySelector(".rla-browse-close");
  const content = backdrop.querySelector("#rla-browse-content");
  let loaded = false;

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function topicHref(track, domain, topic, unitMode) {
    const base = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}`;
    return unitMode
      ? `${base}&unit=${encodeURIComponent(topic.id)}`
      : `${base}&skill=${encodeURIComponent(topic.id)}`;
  }

  function renderCurriculum(curriculum) {
    const tracks = (curriculum?.tracks || []).filter((track) => track && track.id && (track.domains || []).length);
    content.innerHTML = tracks.map((track, trackIndex) => `
      <details class="rla-browse-track"${trackIndex === 0 ? " open" : ""}>
        <summary>${escapeHtml(track.label)}</summary>
        <div class="rla-browse-domains">
          ${(track.domains || []).map((domain) => {
            const units = Array.isArray(domain.units) ? domain.units.filter((item) => item?.available !== false) : [];
            const skills = Array.isArray(domain.skills) ? domain.skills.filter((item) => item?.available !== false) : [];
            const topics = units.length ? units : skills;
            const unitMode = units.length > 0;
            return `
              <section class="rla-browse-domain">
                <a class="rla-browse-domain-link" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">${escapeHtml(domain.label)}</a>
                ${topics.length ? `<div class="rla-browse-topics">${topics.map((topic) => `
                  <a href="${topicHref(track, domain, topic, unitMode)}">${escapeHtml(topic.label)}</a>`).join("")}</div>` : ""}
              </section>`;
          }).join("")}
          ${track.id === "reading" ? `<a class="rla-browse-passage-link" href="passages.html">Passage practice <span aria-hidden="true">→</span></a>` : ""}
        </div>
      </details>`).join("");
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const curriculum = await Data.loadCurriculum();
      renderCurriculum(curriculum);
      loaded = true;
    } catch (_) {
      content.innerHTML = `<p class="rla-browse-loading">The RLA curriculum could not be loaded.</p>`;
    }
  }

  function focusables() {
    return [...sheet.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')];
  }

  async function openBrowse() {
    await ensureLoaded();
    backdrop.hidden = false;
    document.body.classList.add("rla-browse-open");
    closeButton.focus();
  }

  function closeBrowse({ restore = true } = {}) {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove("rla-browse-open");
    if (restore) trigger.focus();
  }

  trigger.addEventListener("click", openBrowse);
  closeButton.addEventListener("click", () => closeBrowse());
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeBrowse();
  });
  backdrop.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link) closeBrowse({ restore: false });
  });
  document.addEventListener("keydown", (event) => {
    if (backdrop.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeBrowse();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
