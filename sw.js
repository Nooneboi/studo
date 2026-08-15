/*
  sw.js — service worker
  -----------------------
  Caches the app shell + sample quiz data on first visit so the
  site keeps working without internet afterward. When you add new
  quiz files, bump CACHE_NAME (e.g. "study-ledger-v2") so learners'
  browsers pick up the update instead of serving a stale cache.
*/

const CACHE_NAME = "studo-v23-curriculum-library";
const CORE_ASSETS = [
  "index.html",
  "404.html",
  "favicon.svg",
  "practice.html",
  "curriculum.html",
  "domain.html",
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
  "data/resources.json",
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin requests, falling back to network,
// and caching new same-origin files (like quizzes you add later)
// the first time a learner loads them.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let Google Fonts etc. pass through normally

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
