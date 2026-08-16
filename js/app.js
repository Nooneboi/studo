/*
  app.js
  ------
  Shared site-shell behavior + service-worker lifecycle.
*/
document.addEventListener("DOMContentLoaded", () => {
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
