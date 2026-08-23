/*
  storage.js
  ----------
  Tiny wrapper around localStorage so every learner's progress
  (answers, deleted questions, highlights, notes) stays on THEIR
  OWN device only. Nothing is sent anywhere — this is what makes
  the site free to run with no backend/server.

  Everything is namespaced under "sq:" (Study Quiz) so it won't
  collide with anything else in the browser.
*/

const Store = {
  _key(quizId, suffix) {
    return `sq:${quizId}:${suffix}`;
  },

  getAnswers(quizId) {
    return this._read(this._key(quizId, "answers"), {});
  },
  setAnswer(quizId, questionId, value) {
    const answers = this.getAnswers(quizId);
    answers[questionId] = value;
    this._write(this._key(quizId, "answers"), answers);
  },
  clearAnswer(quizId, questionId) {
    const answers = this.getAnswers(quizId);
    delete answers[questionId];
    this._write(this._key(quizId, "answers"), answers);
  },

  getInteractionDrafts(quizId) {
    return this._read(this._key(quizId, "interaction-drafts"), {});
  },
  setInteractionDraft(quizId, questionId, value) {
    const drafts = this.getInteractionDrafts(quizId);
    if (value == null || value === "") delete drafts[questionId];
    else drafts[questionId] = String(value);
    this._write(this._key(quizId, "interaction-drafts"), drafts);
  },
  clearInteractionDraft(quizId, questionId) {
    const drafts = this.getInteractionDrafts(quizId);
    delete drafts[questionId];
    this._write(this._key(quizId, "interaction-drafts"), drafts);
  },

  getDeleted(quizId) {
    return this._read(this._key(quizId, "deleted"), []);
  },
  setDeleted(quizId, questionId, isDeleted) {
    const list = new Set(this.getDeleted(quizId));
    if (isDeleted) list.add(questionId);
    else list.delete(questionId);
    this._write(this._key(quizId, "deleted"), Array.from(list));
  },

  getNotes(quizId) {
    return this._read(this._key(quizId, "notes"), {});
  },
  setNote(quizId, questionId, text) {
    const notes = this.getNotes(quizId);
    if (text) notes[questionId] = text;
    else delete notes[questionId];
    this._write(this._key(quizId, "notes"), notes);
  },

  getHighlights(quizId) {
    return this._read(this._key(quizId, "highlights"), {});
  },
  setHighlights(quizId, questionId, htmlWithMarks) {
    const highlights = this.getHighlights(quizId);
    highlights[questionId] = htmlWithMarks;
    this._write(this._key(quizId, "highlights"), highlights);
  },

  getPassageHighlights(quizId) {
    return this._read(this._key(quizId, "passage-highlights"), "");
  },
  setPassageHighlights(quizId, htmlWithMarks) {
    this._write(this._key(quizId, "passage-highlights"), htmlWithMarks || "");
  },

  resetQuiz(quizId) {
    ["answers", "deleted", "notes", "highlights", "passage-highlights", "interaction-drafts"].forEach((suffix) =>
      (window.StudoSafeStorage ? window.StudoSafeStorage.remove(this._key(quizId, suffix)) : localStorage.removeItem(this._key(quizId, suffix)))
    );
  },

  _read(key, fallback) {
    try {
      const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(key) : localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Store read failed for", key, e);
      return fallback;
    }
  },
  _write(key, value) {
    try {
      if (window.StudoSafeStorage) return window.StudoSafeStorage.set(key, JSON.stringify(value));
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("Store write failed for", key, e);
      window.dispatchEvent(new CustomEvent("studo:storage-error", { detail: { key, error: e } }));
      return false;
    }
  },
};
