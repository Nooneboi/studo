/*
  app.js
  ------
  Shared site-shell behavior + service-worker lifecycle.
*/

const STUDO_RELEASE = "0.7.0-alpha.35";
window.STUDO_RELEASE = STUDO_RELEASE;

window.StudoSafeStorage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      window.dispatchEvent(new CustomEvent("studo:storage-error", { detail: { key, error } }));
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      window.dispatchEvent(new CustomEvent("studo:storage-error", { detail: { key, error } }));
      return false;
    }
  }
};

function showSystemNotice(message, kind = "info") {
  let notice = document.getElementById("studo-system-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "studo-system-notice";
    notice.className = "studo-system-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.appendChild(notice);
  }
  notice.className = `studo-system-notice ${kind}`;
  notice.textContent = message;
  notice.hidden = false;
}

function hideSystemNotice() {
  const notice = document.getElementById("studo-system-notice");
  if (notice) notice.hidden = true;
}

window.addEventListener("offline", () => {
  showSystemNotice("You are offline. Opened pages may still work, but new files need a connection.", "offline");
});
window.addEventListener("online", hideSystemNotice);
window.addEventListener("studo:storage-error", () => {
  showSystemNotice("Progress could not be saved on this device. Open Progress and download a backup before continuing.", "warning");
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Studo error", event.reason);
  showSystemNotice("Something did not load correctly. Reload the page; your saved progress should remain on this device.", "warning");
});


const FOCUS_PAGES = new Set(["module.html", "check.html", "test.html", "train.html", "extended-response.html"]);

function currentPageName() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function learnerNavKey(path = currentPageName()) {
  if (path === "index.html" || path === "") return "home";
  if (path === "quiz.html" || path === "test.html") return "tests";
  if (path === "resources.html") return "resources";
  return "";
}

function renderCanonicalLearnerHeader() {
  const path = currentPageName();
  if (FOCUS_PAGES.has(path)) return;

  const header = document.querySelector("header.site-header");
  if (!header) return;

  const active = learnerNavKey(path);
  document.body.classList.add("canonical-learner-shell");
  header.className = "site-header simple-header";
  header.innerHTML = `
    <div class="wrap">
      <a class="simple-brand" href="index.html">Chee Skool</a>
      <nav class="simple-nav" aria-label="Main navigation">
        <a class="${active === "home" ? "active" : ""}" href="index.html"${active === "home" ? ' aria-current="page"' : ""}>Home</a>
        <a class="${active === "tests" ? "active" : ""}" href="quiz.html"${active === "tests" ? ' aria-current="page"' : ""}>Practice Tests</a>
        <a class="${active === "resources" ? "active" : ""}" href="resources.html"${active === "resources" ? ' aria-current="page"' : ""}>Resources</a>
      </nav>
    </div>`;

  document.getElementById("subject-bar-mount")?.replaceChildren();
}

function renderCanonicalMobileNavigation() {
  const path = currentPageName();
  // Learner pages already expose the same three links in their visible top
  // header. A second fixed bottom menu duplicates controls and obscures text.
  if (FOCUS_PAGES.has(path) ||
      document.querySelector(".mobile-primary-nav") ||
      document.querySelector("header.site-header nav.simple-nav, header.site-header nav.site-nav")) return;

  const active = learnerNavKey(path);
  const nav = document.createElement("nav");
  nav.className = "mobile-primary-nav canonical-mobile-nav";
  nav.setAttribute("aria-label", "Primary learner navigation");
  nav.innerHTML = `
    <a class="mobile-primary-nav-item${active === "home" ? " active" : ""}" href="index.html"${active === "home" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">⌂</span><span>Home</span>
    </a>
    <a class="mobile-primary-nav-item${active === "tests" ? " active" : ""}" href="quiz.html"${active === "tests" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">✓</span><span>Tests</span>
    </a>
    <a class="mobile-primary-nav-item${active === "resources" ? " active" : ""}" href="resources.html"${active === "resources" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">▤</span><span>Resources</span>
    </a>`;
  document.body.appendChild(nav);
  document.body.classList.add("has-mobile-primary-nav");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCanonicalLearnerHeader();
  renderCanonicalMobileNavigation();
});

window.addEventListener("load", () => {
  setupServiceWorker().catch(() => {});
});

async function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

  // During local authoring/development, never let an old app cache hide edits.
  if (isLocal) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.filter((key) => key.startsWith("studo-")).map((key) => caches.delete(key)));
    return;
  }

  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    // sessionStorage survives this refresh but does not touch learner data in localStorage.
    if (!sessionStorage.getItem("studo:sw-refresh")) {
      sessionStorage.setItem("studo:sw-refresh", "1");
      location.reload();
    } else {
      sessionStorage.removeItem("studo:sw-refresh");
    }
  });

  const registration = await navigator.serviceWorker.register("sw.js", {
    updateViaCache: "none"
  });

  // Check GitHub Pages for a new worker on every loaded session.
  await registration.update().catch(() => {});

  if (registration.waiting) {
    registration.waiting.postMessage("SKIP_WAITING");
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage("SKIP_WAITING");
      }
    });
  });
}

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
    return window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:theme", "light") : (localStorage.getItem("sq:theme") || "light");
  }

  function setTheme(id) {
    document.documentElement.setAttribute("data-theme", id);
    if (window.StudoSafeStorage) window.StudoSafeStorage.set("sq:theme", id); else localStorage.setItem("sq:theme", id);
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

/*
  Learner subject bar
  -------------------
  Alpha currently exposes only the subject that actually has learner content.
  Future subjects stay hidden until they are ready to use.
*/
const SUBJECTS = [
  { id: "rla", label: "Reasoning Through Language Arts", enabled: true },
];

function getActiveSubject() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject") || (window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:activeSubject") : localStorage.getItem("sq:activeSubject")) || "rla";
}

(function renderSubjectBar() {
  const mount = document.getElementById("subject-bar-mount");
  if (!mount) return;

  const active = getActiveSubject();
  const targetPage = window.location.pathname.endsWith("quiz.html") ? "quiz.html" : "practice.html";
  mount.innerHTML = `
    <div class="subject-bar">
      <div class="wrap">
        ${SUBJECTS.map((subject) => `<a class="subject-tab${subject.id === active ? " active" : ""}" href="${targetPage}?subject=${subject.id}">${subject.label}</a>`).join("")}
      </div>
    </div>`;

  if (window.StudoSafeStorage) window.StudoSafeStorage.set("sq:activeSubject", active);
  else localStorage.setItem("sq:activeSubject", active);
})();
