/*
  focus-tools.js
  --------------
  Shared focus-mode utilities: readable text sizing, print, copy/share,
  and accessible disclosure-menu behavior. Practice-specific notes and
  highlighting are wired in module.js because they need the active module.
*/

(function () {
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.3;
  const STEP = 0.1;
  const SCALE_KEY = "sq:textScale";

  function storageGet(key) {
    try { return window.StudoSafeStorage ? window.StudoSafeStorage.get(key) : localStorage.getItem(key); }
    catch (_) { return null; }
  }

  function storageSet(key, value) {
    try {
      if (window.StudoSafeStorage) window.StudoSafeStorage.set(key, value);
      else localStorage.setItem(key, value);
    } catch (_) { /* text size can still work for the current page */ }
  }

  function clampScale(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));
  }

  function getScale() {
    return clampScale(parseFloat(storageGet(SCALE_KEY)));
  }

  function applyScale(scale) {
    const safe = clampScale(scale);
    document.documentElement.style.setProperty("--text-scale", safe);
    storageSet(SCALE_KEY, String(safe));
    updateScaleButtons(safe);
  }

  function updateScaleButtons(scale = getScale()) {
    const smaller = document.getElementById("text-smaller");
    const larger = document.getElementById("text-larger");
    if (smaller) smaller.disabled = scale <= MIN_SCALE + 0.001;
    if (larger) larger.disabled = scale >= MAX_SCALE - 0.001;
  }

  function menuDetails() {
    return document.querySelector(".focus-tools-menu");
  }

  function closeMenu({ focusSummary = false } = {}) {
    const menu = menuDetails();
    if (!menu) return;
    menu.open = false;
    if (focusSummary) menu.querySelector("summary")?.focus();
  }

  function showStatus(message) {
    const status = document.getElementById("focus-tool-status");
    if (status) status.textContent = message || "";
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand && document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Clipboard unavailable");
  }

  function currentPracticeText() {
    const passage = document.querySelector(".passage-text")?.textContent?.trim() || "";
    const question = document.querySelector(".q-prompt")?.textContent?.trim() || "";
    return [passage, question].filter(Boolean).join("\n\n");
  }

  async function copyCurrentText() {
    const text = currentPracticeText();
    if (!text) {
      showStatus("Nothing to copy on this screen.");
      return;
    }
    try {
      await writeClipboard(text);
      showStatus("Passage and question copied.");
      closeMenu();
    } catch (_) {
      showStatus("Copy failed. Your browser may block clipboard access.");
    }
  }

  async function shareCurrentLink() {
    const data = { title: document.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        showStatus("Share sheet opened.");
        closeMenu();
      } catch (error) {
        if (error?.name !== "AbortError") showStatus("Sharing was not available.");
      }
      return;
    }
    try {
      await writeClipboard(data.url);
      showStatus("Link copied.");
      closeMenu();
    } catch (_) {
      showStatus("Could not copy the link.");
    }
  }

  applyScale(getScale());

  document.addEventListener("DOMContentLoaded", () => {
    const smaller = document.getElementById("text-smaller");
    const larger = document.getElementById("text-larger");
    const printBtn = document.getElementById("print-btn");
    const copyBtn = document.getElementById("copy-btn");
    const shareBtn = document.getElementById("share-btn");
    const menu = menuDetails();

    updateScaleButtons();

    smaller?.addEventListener("click", () => {
      applyScale(+(getScale() - STEP).toFixed(2));
    });
    larger?.addEventListener("click", () => {
      applyScale(+(getScale() + STEP).toFixed(2));
    });
    printBtn?.addEventListener("click", () => {
      closeMenu();
      requestAnimationFrame(() => window.print());
    });
    copyBtn?.addEventListener("click", copyCurrentText);
    shareBtn?.addEventListener("click", shareCurrentLink);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu?.open) {
        event.preventDefault();
        closeMenu({ focusSummary: true });
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (menu?.open && !menu.contains(event.target)) closeMenu();
    });
  });
})();
