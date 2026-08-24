/*
  app.js
  ------
  Shared site-shell behavior + service-worker lifecycle.
*/

const STUDO_RELEASE = "0.7.0-alpha.18";
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


const MOBILE_FOCUS_PAGES = new Set(["module.html", "test.html", "extended-response.html"]);
const MOBILE_PRACTICE_PAGES = new Set(["practice.html", "curriculum.html", "domain.html", "skill.html", "passages.html", "category.html"]);
const MOBILE_MORE_PAGES = new Set(["progress.html", "resources.html", "about.html", "methodology.html", "privacy.html"]);

function currentPageName() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function mobileDestinationFor(path) {
  if (path === "index.html" || path === "") return "home";
  if (MOBILE_PRACTICE_PAGES.has(path)) return "practice";
  if (path === "train.html") return "train";
  if (path === "quiz.html") return "mock";
  if (MOBILE_MORE_PAGES.has(path)) return "more";
  return "";
}

function setupMobilePrimaryNavigation() {
  const path = currentPageName();
  if (MOBILE_FOCUS_PAGES.has(path) || document.querySelector(".mobile-primary-nav")) return;

  const active = mobileDestinationFor(path);
  const nav = document.createElement("nav");
  nav.className = "mobile-primary-nav";
  nav.setAttribute("aria-label", "Primary learner navigation");
  nav.innerHTML = `
    <a class="mobile-primary-nav-item${active === "home" ? " active" : ""}" href="index.html"${active === "home" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">⌂</span><span>Home</span>
    </a>
    <a class="mobile-primary-nav-item${active === "practice" ? " active" : ""}" href="practice.html"${active === "practice" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">▤</span><span>Practice</span>
    </a>
    <a class="mobile-primary-nav-item${active === "train" ? " active" : ""}" href="train.html"${active === "train" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">↻</span><span>Train</span>
    </a>
    <a class="mobile-primary-nav-item${active === "mock" ? " active" : ""}" href="quiz.html"${active === "mock" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">◫</span><span>Mock</span>
    </a>
    <button class="mobile-primary-nav-item mobile-primary-more${active === "more" ? " active" : ""}" type="button" aria-haspopup="dialog" aria-controls="mobile-more-sheet"${active === "more" ? ' aria-current="page"' : ""}>
      <span aria-hidden="true">•••</span><span>More</span>
    </button>`;

  const backdrop = document.createElement("div");
  backdrop.className = "mobile-nav-sheet-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <section class="mobile-nav-sheet" id="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" tabindex="-1">
      <div class="mobile-nav-sheet-head">
        <h2 id="mobile-more-title">More</h2>
        <button class="mobile-sheet-close" type="button" aria-label="Close More menu">Close</button>
      </div>
      <nav class="mobile-more-links" aria-label="More Chee Skool pages">
        <a href="progress.html">Progress</a>
        <a href="resources.html">Resources</a>
        <div class="mobile-more-secondary">
          <a href="about.html">About</a>
          <a href="methodology.html">Methodology</a>
          <a href="privacy.html">Privacy</a>
        </div>
      </nav>
    </section>`;

  document.body.append(nav, backdrop);
  document.body.classList.add("has-mobile-primary-nav");

  const moreButton = nav.querySelector(".mobile-primary-more");
  const sheet = backdrop.querySelector(".mobile-nav-sheet");
  const closeButton = backdrop.querySelector(".mobile-sheet-close");
  let lastFocus = null;

  function focusables() {
    return [...sheet.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  }
  function openMore() {
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.classList.add("mobile-sheet-open");
    closeButton.focus();
  }
  function closeMore({ restore = true } = {}) {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove("mobile-sheet-open");
    if (restore && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  moreButton.addEventListener("click", openMore);
  closeButton.addEventListener("click", () => closeMore());
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeMore();
  });
  backdrop.querySelectorAll("a[href]").forEach((link) => link.addEventListener("click", () => closeMore({ restore: false })));
  document.addEventListener("keydown", (event) => {
    if (backdrop.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMore();
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
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobilePrimaryNavigation();
  document.querySelectorAll("nav.site-nav").forEach((nav) => {
    if (!nav.querySelector('a[href="train.html"]')) {
      const trainLink = document.createElement("a");
      trainLink.href = "train.html";
      trainLink.textContent = "Train";
      const quiz = nav.querySelector('a[href="quiz.html"]');
      nav.insertBefore(trainLink, quiz || null);
    }
    if (!nav.querySelector('a[href="progress.html"]')) {
      const progressLink = document.createElement("a");
      progressLink.href = "progress.html";
      progressLink.textContent = "Progress";
      const resources = nav.querySelector('a[href="resources.html"]');
      nav.insertBefore(progressLink, resources || null);
    }
  });

  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === path);
  });
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
  subjectbar.js
  -------------
  Renders the global subject bar (Math / Science / Social Studies / RLA)
  right under the header, on every page that includes a
  <div id="subject-bar-mount"></div>.

  Only RLA is live for now. The other three render as disabled "Soon"
  pills — flip a subject's `enabled` flag to true once it has content,
  and it becomes a normal clickable tab automatically.

  Clicking a tab remembers the choice (localStorage) and navigates to
  practice.html (or quiz.html, if that's the page you're already on)
  with ?subject=<id> — each page reads that on load.
*/

const SUBJECTS = [
  { id: "rla", label: "Reasoning Through Language Arts", enabled: true },
  { id: "math", label: "Mathematical Reasoning", enabled: false },
  { id: "science", label: "Science", enabled: false },
  { id: "social_studies", label: "Social Studies", enabled: false },
];

function getActiveSubject() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject") || (window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:activeSubject") : localStorage.getItem("sq:activeSubject")) || "rla";
}

(function renderSubjectBar() {
  const mount = document.getElementById("subject-bar-mount");
  if (!mount) return;

  const active = getActiveSubject();
  // Where a click should navigate to: stay on quiz.html if that's
  // the current page, otherwise land on practice.html.
  const targetPage = window.location.pathname.endsWith("quiz.html") ? "quiz.html" : "practice.html";

  mount.innerHTML = `
    <div class="subject-bar">
      <div class="wrap">
        ${SUBJECTS.map((s) => {
          const isActive = s.id === active;
          if (!s.enabled) {
            return `<span class="subject-tab disabled">${s.label} <span class="soon-pill">Soon</span></span>`;
          }
          return `<a class="subject-tab${isActive ? " active" : ""}" href="${targetPage}?subject=${s.id}">${s.label}</a>`;
        }).join("")}
      </div>
    </div>
  `;

  if (window.StudoSafeStorage) window.StudoSafeStorage.set("sq:activeSubject", active); else localStorage.setItem("sq:activeSubject", active);
})();
