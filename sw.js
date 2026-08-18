const CACHE_NAME = "studo-v41-phase6b";
const CORE_ASSETS = [
  "index.html","practice.html","passages.html","curriculum.html","domain.html","skill.html","category.html","module.html","quiz.html","test.html","train.html","resources.html","progress.html",
  "favicon.svg","manifest.json","css/site.css",
  "js/app.js","js/storage.js","js/data.js","js/learning.js","js/home.js","js/progress.js","js/focus-tools.js","js/annotate.js","js/practice.js","js/passages.js","js/curriculum.js","js/domain.js","js/skill.js","js/category.js","js/module.js","js/quiz.js","js/test.js","js/train.js","js/resources.js",
  "data/generated/index.json","data/generated/curriculum.json","data/sample-quiz.json"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;e.respondWith(networkFirst(e.request));});
async function networkFirst(req){const cache=await caches.open(CACHE_NAME);try{const res=await fetch(new Request(req,{cache:"no-store"}));if(res&&res.ok)await cache.put(req,res.clone());return res;}catch(err){const hit=await cache.match(req);if(hit)return hit;if(req.mode==="navigate"){const fallback=await cache.match("index.html");if(fallback)return fallback;}throw err;}}
