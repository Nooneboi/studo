/*
  sw.js — Studo service worker
  ----------------------------
  Production strategy:
  - When online, request the newest same-origin file from the network first.
  - Save successful responses for offline use.
  - Fall back to the cache only when the network is unavailable.

  This keeps deployments fresh WITHOUT clearing localStorage / learner data.
*/

const CACHE_NAME = "studo-v29-phase4i";
const CORE_ASSETS = [
  "index.html",
  "404.html",
  "favicon.svg",
  "practice.html",
  "curriculum.html",
  "domain.html",
  "skill.html",
  "category.html",
  "module.html",
  "quiz.html",
  "test.html",
  "train.html",
  "resources.html",
  "progress.html",
  "manifest.json",
  "css/style.css",
  "css/studo-v2.css",
  "js/app.js",
  "js/subjectbar.js",
  "js/theme.js",
  "js/storage.js",
  "js/data.js",
  "js/learning.js",
  "js/progress.js",
  "js/focus-tools.js",
  "js/annotate.js",
  "js/practice.js",
  "js/curriculum.js",
  "js/domain.js",
  "js/skill.js",
  "js/category.js",
  "js/module.js",
  "js/quiz.js",
  "js/test.js",
  "js/train.js",
  "js/resources.js",
  "data/generated/index.json",
  "data/generated/curriculum.json",
  "data/generated/modules/evidence-practice.json",
  "data/generated/modules/evidence-transfer-practice.json",
  "data/generated/modules/grammar-practice.json",
  "data/generated/modules/grammar-transfer-practice.json",
  "data/generated/modules/writing-practice.json",
  "data/sample-quiz.json",
  "data/resources.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Bypass the browser HTTP cache as well. GitHub Pages remains the source of truth.
    const freshRequest = new Request(request, { cache: "no-store" });
    const response = await fetch(freshRequest);

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const fallback = await cache.match("index.html");
      if (fallback) return fallback;
    }

    throw error;
  }
}
