/*
  data.js
  -------
  Shared fetch helpers so practice.js and module.js don't duplicate
  the same fetch/try-catch logic.
*/
const Data = {
  async loadIndex() {
    const res = await fetch("data/generated/index.json");
    return res.json();
  },
  async loadCurriculum() {
    const res = await fetch("data/generated/curriculum.json");
    return res.json();
  },
  async loadQuiz(file) {
    const res = await fetch(`data/${file}`);
    return res.json();
  },
  // Fetches every quiz file listed in index.json, in parallel, and
  // returns them merged with their index.json entry (file, id, etc.)
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
