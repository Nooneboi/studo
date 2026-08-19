/*
  learning.js — Studo learning engine (Phase 3C)
  ------------------------------------------------
  Explainable, local-first learning state:
  - stores first graded attempts
  - rolls attempts into skill signals
  - tracks mistakes and observed distractor patterns
  - schedules spaced skill reviews
  - prefers transfer: new questions testing the same skill/family
  - builds a reasoned "Train Me" session from the available catalog

  The percentages shown by Studo are practice signals, not predicted exam scores.
*/

const Learning = (() => {
  const STATE_KEY = "sq:learning:v1"; // keep the key so existing users migrate in place
  const STATE_VERSION = 2;
  const MAX_ATTEMPTS = 2500;
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

  const CATEGORY_LABELS = {
    reading: "Reading",
    writing: "Writing and Analysis",
    language_conventions: "Language Conventions",
  };

  function emptyState() {
    return { version: STATE_VERSION, attempts: [], mistakes: {}, reviews: {} };
  }

  function readState() {
    try {
      const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(STATE_KEY) : localStorage.getItem(STATE_KEY);
      if (!raw) return emptyState();
      const state = JSON.parse(raw);
      return {
        version: STATE_VERSION,
        attempts: Array.isArray(state.attempts) ? state.attempts : [],
        mistakes: state.mistakes && typeof state.mistakes === "object" ? state.mistakes : {},
        reviews: state.reviews && typeof state.reviews === "object" ? state.reviews : {},
      };
    } catch (e) {
      console.warn("Learning state read failed", e);
      return emptyState();
    }
  }

  function writeState(state) {
    try {
      state.version = STATE_VERSION;
      if (window.StudoSafeStorage) { window.StudoSafeStorage.set(STATE_KEY, JSON.stringify(state)); return; }
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

  function familyFor(module, question) {
    const skill = skillFor(module, question);
    return question.familyId || question.family || skill.id;
  }

  function questionKey(module, question) {
    return `${module.id}:${question.id}`;
  }

  function difficultyWeight(value) {
    return { easy: 0.9, medium: 1, hard: 1.15 }[String(value || "medium").toLowerCase()] || 1;
  }

  function modeWeight(mode) {
    return mode === "test" ? 1.1 : mode === "train" ? 1.05 : 1;
  }

  function observedPatternFor(question, answer, correct) {
    if (correct || !question || !Array.isArray(question.options)) return null;
    const selected = question.options.find((opt) => opt.id === answer);
    return selected?.distractorType || null;
  }

  function addDays(isoOrDate, days) {
    const d = isoOrDate instanceof Date ? new Date(isoOrDate) : new Date(isoOrDate || Date.now());
    d.setTime(d.getTime() + Math.max(0, days) * 86400000);
    return d.toISOString();
  }

  function reviewIntervalFor(stage, confidence) {
    if (confidence === "guessing") return 1;
    if (confidence === "unsure") return stage <= 1 ? 1 : Math.max(2, REVIEW_INTERVALS[Math.min(stage - 1, REVIEW_INTERVALS.length - 1)]);
    return REVIEW_INTERVALS[Math.min(Math.max(0, stage), REVIEW_INTERVALS.length - 1)];
  }

  function updateReview(state, attempt, skill) {
    const current = state.reviews[skill.id] || {
      skillId: skill.id,
      skillLabel: skill.label,
      category: attempt.category,
      topic: attempt.topic,
      stage: 0,
      correctStreak: 0,
      lapses: 0,
      intervalDays: 0,
      dueAt: attempt.attemptedAt,
    };

    if (!attempt.correct) {
      state.reviews[skill.id] = {
        ...current,
        skillLabel: skill.label,
        category: attempt.category,
        topic: attempt.topic,
        stage: 0,
        correctStreak: 0,
        lapses: (current.lapses || 0) + 1,
        intervalDays: 0,
        dueAt: attempt.attemptedAt,
        lastResult: "wrong",
        lastAttemptAt: attempt.attemptedAt,
      };
      return;
    }

    let stage = Math.min((current.stage || 0) + 1, REVIEW_INTERVALS.length - 1);
    if (attempt.confidence === "guessing") stage = Math.min(current.stage || 0, 1);
    if (attempt.confidence === "unsure") stage = Math.min(Math.max(current.stage || 0, 1), REVIEW_INTERVALS.length - 1);
    const intervalDays = reviewIntervalFor(stage, attempt.confidence);

    state.reviews[skill.id] = {
      ...current,
      skillLabel: skill.label,
      category: attempt.category,
      topic: attempt.topic,
      stage,
      correctStreak: (current.correctStreak || 0) + 1,
      intervalDays,
      dueAt: addDays(attempt.attemptedAt, intervalDays),
      lastResult: "correct",
      lastAttemptAt: attempt.attemptedAt,
    };
  }

  function updateMistakes(state, attempt, module, question, skill, file) {
    const key = attempt.questionKey;
    const familyId = attempt.familyId;
    const existing = state.mistakes[key];

    if (!attempt.correct) {
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
        familyId,
        wrongCount: (existing?.wrongCount || 0) + 1,
        correctAfter: 0,
        transferCorrect: 0,
        status: "needs_review",
        reason: existing?.reason || null,
        observedPattern: attempt.observedPattern || existing?.observedPattern || null,
        lastWrongAt: attempt.attemptedAt,
        lastAttemptAt: attempt.attemptedAt,
      };
      return;
    }

    // Correcting the exact same question is useful, but does not prove transfer.
    if (existing && existing.status !== "mastered") {
      state.mistakes[key] = {
        ...existing,
        correctAfter: (existing.correctAfter || 0) + 1,
        lastAttemptAt: attempt.attemptedAt,
        status: "improving",
      };
    }

    // A correct answer on a DIFFERENT question in the same family/skill is
    // stronger evidence that the idea transferred rather than being memorized.
    Object.entries(state.mistakes).forEach(([mistakeKey, mistake]) => {
      if (mistakeKey === key || mistake.status === "mastered") return;
      const sameFamily = mistake.familyId && familyId && mistake.familyId === familyId;
      const sameSkill = mistake.skillId === skill.id;
      if (!sameFamily && !sameSkill) return;
      const transferCorrect = (mistake.transferCorrect || 0) + 1;
      state.mistakes[mistakeKey] = {
        ...mistake,
        transferCorrect,
        lastAttemptAt: attempt.attemptedAt,
        status: transferCorrect >= 2 ? "mastered" : "improving",
      };
    });
  }

  function recordAttempt({ module, question, answer, correct, mode = "practice", elapsedMs = null, file = null, confidence = null }) {
    if (!module || !question || typeof correct !== "boolean") return null;

    const state = readState();
    const skill = skillFor(module, question);
    const now = new Date().toISOString();
    const key = questionKey(module, question);
    const observedPattern = observedPatternFor(question, answer, correct);
    const attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionKey: key,
      questionId: question.id,
      familyId: familyFor(module, question),
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
      confidence: confidence || null,
      observedPattern,
      attemptedAt: now,
    };

    state.attempts.push(attempt);
    if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);

    updateMistakes(state, attempt, module, question, skill, file);
    updateReview(state, attempt, skill);
    writeState(state);

    return {
      attempt,
      skill: getSkillSummary(skill.id, state),
      mistake: state.mistakes[key] || null,
      review: state.reviews[skill.id] || null,
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
      const confidenceWeight = attempt.confidence === "guessing" ? 0.7 : attempt.confidence === "unsure" ? 0.9 : 1;
      const weight = difficultyWeight(attempt.difficulty) * modeWeight(attempt.mode) * confidenceWeight;
      weightedTotal += weight;
      if (attempt.correct) weightedCorrect += weight;
    });

    const score = Math.round(((weightedCorrect + 1.5) / (weightedTotal + 3)) * 100);
    const correctCount = attempts.filter((a) => a.correct).length;
    const accuracy = Math.round((correctCount / attempts.length) * 100);
    const last = attempts[attempts.length - 1];
    const review = state.reviews[skillId] || null;

    return {
      id: skillId,
      label: last.skillLabel || last.topic || skillId,
      category: last.category || "reading",
      topic: last.topic || "General",
      attempts: attempts.length,
      correct: correctCount,
      accuracy,
      score,
      signal: attempts.length < 3 ? "Low data" : attempts.length < 8 ? "Early signal" : "Established",
      status: score >= 80 ? "Strong" : score >= 65 ? "Building" : "Needs work",
      lastAttemptAt: last.attemptedAt,
      dueAt: review?.dueAt || null,
      intervalDays: review?.intervalDays || 0,
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

  function getReviewSchedule({ dueOnly = false } = {}) {
    const state = readState();
    const now = Date.now();
    return Object.values(state.reviews || {})
      .filter((item) => !dueOnly || new Date(item.dueAt || 0).getTime() <= now)
      .sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0));
  }

  function getSummary() {
    const state = readState();
    const graded = state.attempts;
    const correct = graded.filter((a) => a.correct).length;
    const activeMistakes = Object.values(state.mistakes).filter((m) => m.status !== "mastered");
    const skills = getSkillSummaries();
    const dueReviews = getReviewSchedule({ dueOnly: true });

    const confidenceCounts = graded.reduce((acc, item) => {
      if (item.confidence) acc[item.confidence] = (acc[item.confidence] || 0) + 1;
      return acc;
    }, { sure: 0, unsure: 0, guessing: 0 });

    return {
      attempts: graded.length,
      correct,
      accuracy: graded.length ? Math.round((correct / graded.length) * 100) : null,
      activeMistakes: activeMistakes.length,
      dueReviews: dueReviews.length,
      nextReview: getReviewSchedule()[0] || null,
      skills,
      weakestSkills: skills.filter((s) => s.attempts >= 2).slice(0, 3),
      recentAttempts: graded.slice(-8).reverse(),
      confidenceCounts,
      sureWrong: graded.filter((a) => a.confidence === "sure" && !a.correct).length,
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

  function getObservedPatterns() {
    const attempts = readState().attempts.filter((a) => !a.correct && a.observedPattern);
    const counts = attempts.reduce((acc, item) => {
      acc[item.observedPattern] = (acc[item.observedPattern] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }

  function isAutoGraded(question) {
    if (!question) return false;
    if (["multiple_choice", "evidence_based", "grammar_edit"].includes(question.type)) return true;
    return question.type === "fill_blank" && typeof question.correct === "string";
  }

  function buildTrainingPlan(catalog, { limit = 8 } = {}) {
    const state = readState();
    const attempts = state.attempts;
    const activeMistakes = Object.values(state.mistakes).filter((m) => m.status !== "mastered");
    const skills = getSkillSummaries();
    const skillMap = Object.fromEntries(skills.map((s) => [s.id, s]));
    const now = Date.now();
    const seenKeys = new Set(attempts.map((a) => a.questionKey));
    const sureWrongBySkill = attempts.reduce((acc, a) => {
      if (!a.correct && a.confidence === "sure") acc[a.skillId] = (acc[a.skillId] || 0) + 1;
      return acc;
    }, {});

    const candidates = [];
    (catalog || []).forEach((module) => {
      (module.questions || []).forEach((question) => {
        if (!isAutoGraded(question)) return;
        const key = questionKey(module, question);
        const skill = skillFor(module, question);
        const familyId = familyFor(module, question);
        const skillSummary = skillMap[skill.id] || null;
        const review = state.reviews[skill.id] || null;
        const reviewDue = review && new Date(review.dueAt || 0).getTime() <= now;
        const exactMistake = state.mistakes[key] && state.mistakes[key].status !== "mastered" ? state.mistakes[key] : null;
        const relatedMistake = activeMistakes.find((m) => m.questionKey !== key && (m.familyId === familyId || m.skillId === skill.id));
        const lastAttempt = [...attempts].reverse().find((a) => a.questionKey === key) || null;
        const lastAgeHours = lastAttempt ? (now - new Date(lastAttempt.attemptedAt).getTime()) / 3600000 : Infinity;
        const unseen = !seenKeys.has(key);

        let score = 10;
        let reason = unseen ? "Build a clearer skill signal" : "Maintain the skill";
        let reasonType = unseen ? "baseline" : "maintenance";

        if (relatedMistake && unseen) {
          score += 150;
          reason = `New question testing ${relatedMistake.skillLabel || skill.label} after a previous miss`;
          reasonType = "transfer";
        } else if (reviewDue) {
          score += 115;
          reason = `${skill.label} is due for review`;
          reasonType = "due";
        } else if (exactMistake) {
          score += 95;
          reason = `Revisit a recent mistake in ${skill.label}`;
          reasonType = "mistake";
        } else if (skillSummary && skillSummary.status === "Needs work") {
          score += 75 + Math.max(0, 65 - skillSummary.score);
          reason = `Strengthen ${skill.label}`;
          reasonType = "weak";
        } else if (sureWrongBySkill[skill.id]) {
          score += 70;
          reason = `Check a possible misconception in ${skill.label}`;
          reasonType = "misconception";
        } else if (skillSummary && skillSummary.status === "Building") {
          score += 45;
          reason = `Keep building ${skill.label}`;
          reasonType = "building";
        }

        if (unseen) score += 25;
        // Do not immediately drill the exact same question after feedback. Fresh
        // transfer questions should win first; exact repeats become useful later.
        if (lastAgeHours < 1) score -= 130;
        else if (lastAgeHours < 24) score -= 70;

        candidates.push({
          score,
          reason,
          reasonType,
          module: { ...module },
          moduleFile: module.file || null,
          question,
          questionKey: key,
          skillId: skill.id,
          skillLabel: skill.label,
          familyId,
          unseen,
        });
      });
    });

    candidates.sort((a, b) => b.score - a.score || Number(b.unseen) - Number(a.unseen));

    const selected = [];
    const skillCounts = {};
    for (const item of candidates) {
      if (selected.length >= limit) break;
      const count = skillCounts[item.skillId] || 0;
      if (count >= 3 && candidates.some((c) => (skillCounts[c.skillId] || 0) < 2 && !selected.includes(c))) continue;
      selected.push(item);
      skillCounts[item.skillId] = count + 1;
    }

    // With very little learning history, label the SESSION as baseline rather
    // than pretending the whole plan is personalized. Individual questions
    // still keep their true reason (for example, a direct transfer follow-up).
    const adaptive = attempts.length >= 3;

    return {
      adaptive,
      items: selected,
      estimatedMinutes: Math.max(5, Math.round(selected.reduce((sum, item) => sum + (item.question.time || 55), 0) / 60)),
      dueCount: getReviewSchedule({ dueOnly: true }).length,
    };
  }

  function clearLearningHistory() {
    if (window.StudoSafeStorage) window.StudoSafeStorage.remove(STATE_KEY);
    else localStorage.removeItem(STATE_KEY);
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
    getReviewSchedule,
    buildTrainingPlan,
    skillFor,
    familyFor,
    questionKey,
    categoryLabel,
    setMistakeReason,
    getObservedPatterns,
    clearLearningHistory,
  };
})();
