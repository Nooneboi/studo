/*
  sw.js — service worker
  -----------------------
  Caches the app shell + sample quiz data on first visit so the
  site keeps working without internet afterward. When you add new
  quiz files, bump CACHE_NAME (e.g. "study-ledger-v2") so learners'
  browsers pick up the update instead of serving a stale cache.
*/

const CACHE_NAME = "study-ledger-v5";
const CORE_ASSETS = [
  "index.html",
  "404.html",
  "favicon.svg",
  "practice.html",
  "category.html",
  "module.html",
  "quiz.html",
  "test.html",
  "resources.html",
  "manifest.json",
  "css/style.css",
  "js/app.js",
  "js/subjectbar.js",
  "js/storage.js",
  "js/data.js",
  "js/practice.js",
  "js/category.js",
  "js/module.js",
  "js/quiz.js",
  "js/test.js",
  "js/resources.js",
  "data/index.json",
  "data/sample-quiz.json",
  "data/evidence-practice.json",
  "data/grammar-practice.json",
  "data/writing-practice.json",
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
