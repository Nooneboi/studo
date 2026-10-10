/*
  data.js
  -------
  Shared fetch helpers for canonical learner data.
  Generated JSON is always requested with cache bypass so a newly deployed
  curriculum/module cannot be mixed with an older service-worker response.
*/
const Data = {
  async fetchJson(url, label = "data") {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Could not load ${label}: ${res.status} ${res.statusText} (${url})`);
    }
    const type = res.headers.get("content-type") || "";
    if (type && !type.includes("json") && !type.includes("javascript")) {
      throw new Error(`Could not load ${label}: unexpected content type ${type} (${url})`);
    }
    return res.json();
  },

  async loadIndex() {
    return this.fetchJson("data/generated/index.json", "learner index");
  },

  async loadCurriculum() {
    return this.fetchJson("data/generated/curriculum.json", "curriculum");
  },

  async loadQuiz(file) {
    const rel = String(file || "");
    if (!/^generated\/modules\/[a-z0-9._-]+\.json$/i.test(rel)) {
      throw new Error(`Invalid learner module path: ${rel || "(missing)"}`);
    }
    return this.fetchJson(`data/${rel}`, "learner module");
  },

  async loadAllQuizzes() {
    const list = await this.loadIndex();
    return Promise.all(
      list.map(async (entry) => {
        try {
          const quiz = await this.loadQuiz(entry.file);
          return { ...entry, ...quiz, file: entry.file };
        } catch (e) {
          return { ...entry, questions: [], broken: true };
        }
      })
    );
  },
};
