/*
  theme.js
  --------
  Compact theme picker used in the site header.
  The previous 3-icon segmented control looked too utility-heavy and
  visually noisy. This version uses one clear "Theme" trigger with a
  small popover menu so the header stays calm.
*/

const THEMES = [
  {
    id: "light",
    label: "Light",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  },
  {
    id: "dark",
    label: "Dark",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  },
  {
    id: "sepia",
    label: "Sepia",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  },
];

(function () {
  const mount = document.getElementById("theme-switch-mount");
  if (!mount) return;

  function getTheme() {
    return localStorage.getItem("sq:theme") || "light";
  }

  function setTheme(id) {
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("sq:theme", id);
    render();
  }

  function render() {
    const activeId = getTheme();
    const activeTheme = THEMES.find((t) => t.id === activeId) || THEMES[0];

    mount.innerHTML = `
      <details class="theme-picker">
        <summary class="theme-picker-btn" aria-label="Choose theme" title="Theme">
          <span class="theme-picker-icon" aria-hidden="true">${activeTheme.icon}</span>
          <span class="theme-picker-text">${activeTheme.label}</span>
        </summary>
        <div class="theme-picker-menu" role="menu" aria-label="Theme options">
          ${THEMES.map((theme) => `
            <button
              type="button"
              class="theme-option${theme.id === activeId ? " active" : ""}"
              data-theme-id="${theme.id}"
              role="menuitemradio"
              aria-checked="${theme.id === activeId ? "true" : "false"}"
            >
              <span class="theme-picker-icon" aria-hidden="true">${theme.icon}</span>
              <span>${theme.label}</span>
            </button>
          `).join("")}
        </div>
      </details>
    `;

    const details = mount.querySelector(".theme-picker");
    mount.querySelectorAll(".theme-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTheme(btn.dataset.themeId);
        if (details) details.open = false;
      });
    });
  }

  render();
})();
