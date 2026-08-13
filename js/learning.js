/*
  learning.js — Studo learning engine (Phase 3A)
  ----------------------------------------------
  Keeps the first version deliberately explainable:
  - every graded attempt is stored locally
  - attempts roll up into skill-level signals
  - incorrect answers create a mistake/review record
  - repeated correct work can move a mistake from needs-review -> improving -> mastered

  This is NOT a score predictor. Skill percentages are practice signals only,
  and the UI labels low-data estimates clearly so we do not pretend to know
  more about the learner than the evidence supports.
*/

const Learning = (() => {
  const STATE_KEY = "sq:learning:v1";
  const MAX_ATTEMPTS = 2000;

  const CATEGORY_LABELS = {
    reading: "Reading",
    writing: "Writing and Analysis",
    language_conventions: "Language Conventions",
  };

  function emptyState() {
    return { version: 1, attempts: [], mistakes: {} };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return emptyState();
      const state = JSON.parse(raw);
      return {
        version: 1,
        attempts: Array.isArray(state.attempts) ? state.attempts : [],
        mistakes: state.mistakes && typeof state.mistakes === "object" ? state.mistakes : {},
      };
    } catch (e) {
      console.warn("Learning state read failed", e);
      return emptyState();
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Learning state write failed", e);
    }
  }

  function slug(value) {
    return String(value || "general")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "general";
  }

  function skillFor(module, question) {
    const declared = question.skill || question.skills?.[0];
    if (declared && typeof declared === "object") {
      return {
        id: declared.id || `${slug(module.category)}.${slug(declared.label || module.topic)}`,
        label: declared.label || module.topic || CATEGORY_LABELS[module.category] || "General",
        category: declared.category || module.category || "reading",
      };
    }
    if (typeof declared === "string") {
      return {
        id: declared,
        label: question.skillLabel || module.topic || declared.split(".").slice(-1)[0].replace(/_/g, " "),
        category: module.category || "reading",
      };
    }
    return {
      id: `${slug(module.category)}.${slug(module.topic || "general")}`,
      label: module.topic || CATEGORY_LABELS[module.category] || "General",
      category: module.category || "reading",
    };
  }

  function questionKey(module, question) {
    return `${module.id}:${question.id}`;
  }

  function difficultyWeight(value) {
    return { easy: 0.9, medium: 1, hard: 1.15 }[String(value || "medium").toLowerCase()] || 1;
  }

  function modeWeight(mode) {
    return mode === "test" ? 1.1 : 1;
  }

  function recordAttempt({ module, question, answer, correct, mode = "practice", elapsedMs = null, file = null }) {
    if (!module || !question || typeof correct !== "boolean") return null;

    const state = readState();
    const skill = skillFor(module, question);
    const now = new Date().toISOString();
    const key = questionKey(module, question);
    const attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionKey: key,
      questionId: question.id,
      moduleId: module.id,
      moduleFile: file || module.file || null,
      moduleTitle: module.title || "",
      subject: module.subject || "rla",
      category: module.category || "reading",
      topic: module.topic || "General",
      skillId: skill.id,
      skillLabel: skill.label,
      answer: typeof answer === "string" ? answer : String(answer ?? ""),
      correct,
      mode,
      difficulty: module.difficulty || "medium",
      elapsedMs: Number.isFinite(elapsedMs) ? Math.max(0, Math.round(elapsedMs)) : null,
      attemptedAt: now,
    };

    state.attempts.push(attempt);
    if (state.attempts.length > MAX_ATTEMPTS) {
      state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
    }

    const existing = state.mistakes[key];
    if (!correct) {
      state.mistakes[key] = {
        questionKey: key,
        questionId: question.id,
        moduleId: module.id,
        moduleFile: file || module.file || existing?.moduleFile || null,
        moduleTitle: module.title || existing?.moduleTitle || "",
        category: module.category || existing?.category || "reading",
        topic: module.topic || existing?.topic || "General",
        skillId: skill.id,
        skillLabel: skill.label,
        wrongCount: (existing?.wrongCount || 0) + 1,
        correctAfter: 0,
        status: "needs_review",
        lastWrongAt: now,
        lastAttemptAt: now,
      };
    } else if (existing && existing.status !== "mastered") {
      const correctAfter = (existing.correctAfter || 0) + 1;
      state.mistakes[key] = {
        ...existing,
        correctAfter,
        lastAttemptAt: now,
        status: correctAfter >= 2 ? "mastered" : "improving",
      };
    }

    writeState(state);
    return {
      attempt,
      skill: getSkillSummary(skill.id, state),
      mistake: state.mistakes[key] || null,
    };
  }

  function getAttempts() {
    return readState().attempts.slice();
  }

  function getMistakes({ includeMastered = false } = {}) {
    const list = Object.values(readState().mistakes || {});
    return list
      .filter((item) => includeMastered || item.status !== "mastered")
      .sort((a, b) => new Date(b.lastAttemptAt || b.lastWrongAt) - new Date(a.lastAttemptAt || a.lastWrongAt));
  }

  function getSkillSummary(skillId, suppliedState = null) {
    const state = suppliedState || readState();
    const attempts = state.attempts.filter((a) => a.skillId === skillId);
    if (!attempts.length) return null;

    let weightedTotal = 0;
    let weightedCorrect = 0;
    attempts.forEach((attempt) => {
      const weight = difficultyWeight(attempt.difficulty) * modeWeight(attempt.mode);
      weightedTotal += weight;
      if (attempt.correct) weightedCorrect += weight;
    });

    // A small neutral prior prevents 1 question from becoming a fake 0%/100% mastery claim.
    const score = Math.round(((weightedCorrect + 1.5) / (weightedTotal + 3)) * 100);
    const accuracy = Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100);
    const last = attempts[attempts.length - 1];

    return {
      id: skillId,
      label: last.skillLabel || last.topic || skillId,
      category: last.category || "reading",
      topic: last.topic || "General",
      attempts: attempts.length,
      correct: attempts.filter((a) => a.correct).length,
      accuracy,
      score,
      signal: attempts.length < 3 ? "Low data" : attempts.length < 8 ? "Early signal" : "Established",
      status: score >= 80 ? "Strong" : score >= 65 ? "Building" : "Needs work",
      lastAttemptAt: last.attemptedAt,
    };
  }

  function getSkillSummaries() {
    const state = readState();
    const ids = [...new Set(state.attempts.map((a) => a.skillId).filter(Boolean))];
    return ids
      .map((id) => getSkillSummary(id, state))
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || b.attempts - a.attempts);
  }

  function getSummary() {
    const state = readState();
    const graded = state.attempts;
    const correct = graded.filter((a) => a.correct).length;
    const activeMistakes = Object.values(state.mistakes).filter((m) => m.status !== "mastered");
    const skills = getSkillSummaries();

    return {
      attempts: graded.length,
      correct,
      accuracy: graded.length ? Math.round((correct / graded.length) * 100) : null,
      activeMistakes: activeMistakes.length,
      skills,
      weakestSkills: skills.filter((s) => s.attempts >= 2).slice(0, 3),
      recentAttempts: graded.slice(-8).reverse(),
    };
  }

  function setMistakeReason(questionKeyValue, reason) {
    if (!questionKeyValue) return null;
    const state = readState();
    const item = state.mistakes[questionKeyValue];
    if (!item) return null;
    state.mistakes[questionKeyValue] = {
      ...item,
      reason: reason || null,
      reasonUpdatedAt: new Date().toISOString(),
    };
    writeState(state);
    return state.mistakes[questionKeyValue];
  }

  function clearLearningHistory() {
    localStorage.removeItem(STATE_KEY);
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || "Practice";
  }

  return {
    recordAttempt,
    getAttempts,
    getMistakes,
    getSkillSummary,
    getSkillSummaries,
    getSummary,
    skillFor,
    questionKey,
    categoryLabel,
    setMistakeReason,
    clearLearningHistory,
  };
})();
