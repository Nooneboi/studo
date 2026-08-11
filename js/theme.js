/*
  theme.js
  --------
  Renders the small theme switcher (Light / Dark / Sepia) into
  #theme-switch-mount, present in the header on every page. The
  actual theme is applied by setting data-theme on <html>; a tiny
  inline script in <head> (see any page's <head>) applies the saved
  choice immediately on load so there's no flash of the wrong theme.

  Themes are just alternate sets of CSS custom properties — see the
  "THEME VARIANTS" section in css/style.css.
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
    const active = getTheme();
    mount.innerHTML = `<div class="theme-switch">${THEMES.map(
      (t) =>
        `<button type="button" class="${t.id === active ? "active" : ""}" data-theme-id="${t.id}" aria-label="${t.label} theme" title="${t.label}">${t.icon}</button>`
    ).join("")}</div>`;
    mount.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => setTheme(btn.dataset.themeId));
    });
  }

  render();
})();
