/* Studo RLA Mock V1 — pure blueprint selection, timing and scoring helpers. */
(function (root) {
  "use strict";

  function hashSeed(seed) {
    const s = String(seed ?? "studo");
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFromSeed(seed) {
    let x = hashSeed(seed) || 1;
    return function () {
      x += 0x6D2B79F5;
      let t = x;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function wordCount(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function moduleKind(module) {
    return module?.curriculum?.contentKind || "";
  }

  function isPublishedQuestionModule(module) {
    return module && !module.broken && Array.isArray(module.questions) && module.questions.length > 0 && module.subject === "rla";
  }

  function chooseReadingSets(modules, count, config, rng) {
    const allowed = new Set(config.selection.readingMixedKinds || []);
    const candidates = modules.filter((m) => m.category === "reading" && allowed.has(moduleKind(m)) && (m.questions || []).length === 7);
    const literary = shuffle(candidates.filter((m) => (m.passageMeta || m.contentMeta?.passage)?.textType === "literary"), rng);
    const informational = shuffle(candidates.filter((m) => (m.passageMeta || m.contentMeta?.passage)?.textType !== "literary"), rng);
    if (literary.length < 1 || informational.length < Math.max(1, count - 1)) throw new Error("Reading bank cannot support informational/literary mock balance");

    const staminaMin = Number(config.selection.staminaMinimumWords || 600);
    const staminaInfo = informational.filter((m) => wordCount(m.passage) >= staminaMin);
    const staminaLit = literary.filter((m) => wordCount(m.passage) >= staminaMin);
    const useLiterary = count >= 3 ? 1 : Math.min(1, count);
    const useInfo = count - useLiterary;
    const picked = [];

    if (useInfo > 0) {
      const first = staminaInfo[0] || informational[0];
      picked.push(first);
      const remainingInfo = informational.filter((m) => m.id !== first.id);
      if (useInfo > 1) {
        const firstContext = (first.passageMeta || first.contentMeta?.passage)?.context;
        const diverse = remainingInfo.find((m) => (m.passageMeta || m.contentMeta?.passage)?.context && (m.passageMeta || m.contentMeta?.passage).context !== firstContext);
        picked.push(diverse || remainingInfo[0]);
      }
    }
    if (useLiterary > 0) {
      const candidate = staminaLit[0] || literary[0];
      picked.push(candidate);
    }
    if (picked.length !== count) throw new Error(`Could not choose ${count} Reading source sets`);
    return shuffle(picked, rng);
  }

  function chooseMixedSet(modules, category, allowedKinds, questionCount, rng, usedModules) {
    const allowed = new Set(allowedKinds || []);
    const candidates = shuffle(modules.filter((m) => m.category === category && allowed.has(moduleKind(m)) && (m.questions || []).length === questionCount && !usedModules.has(m.id)), rng);
    if (!candidates.length) throw new Error(`No mixed ${category} set available`);
    return candidates[0];
  }

  function chooseFocusedQuestions(modules, category, count, focusedKind, rng, usedModules, usedQuestions) {
    const candidates = shuffle(modules.filter((m) => m.category === category && moduleKind(m) === focusedKind && !usedModules.has(m.id)), rng);
    const picked = [];
    for (const module of candidates) {
      const qs = shuffle(module.questions || [], rng).filter((q) => !usedQuestions.has(`${module.id}:${q.id}`));
      if (!qs.length) continue;
      const q = qs[0];
      picked.push({ module, question: q, partial: true });
      usedModules.add(module.id);
      usedQuestions.add(`${module.id}:${q.id}`);
      if (picked.length === count) break;
    }
    if (picked.length !== count) throw new Error(`Not enough distinct focused ${category} modules for ${count} filler questions`);
    return picked;
  }

  function groupItemsForModule(module, part, rng) {
    return (module.questions || []).map((q, index) => ({
      part,
      moduleId: module.id,
      moduleFile: module.file,
      questionId: q.id,
      category: module.category,
      groupOrder: index,
      sourceSet: true,
      title: module.title
    }));
  }

  function fillerItem(module, question, part) {
    return {
      part,
      moduleId: module.id,
      moduleFile: module.file,
      questionId: question.id,
      category: module.category,
      groupOrder: 0,
      sourceSet: false,
      title: module.title
    };
  }

  function generateFullMock({ modules, prompts, blueprint, seed = Date.now() }) {
    const rng = rngFromSeed(seed);
    const validModules = (modules || []).filter(isPublishedQuestionModule);
    const usedModules = new Set();
    const usedQuestions = new Set();
    const readingSets = chooseReadingSets(validModules, 3, blueprint, rng);
    readingSets.forEach((m) => usedModules.add(m.id));

    const argMixed = chooseMixedSet(validModules, "arguments", blueprint.selection.argumentsMixedKinds, 6, rng, usedModules);
    usedModules.add(argMixed.id);
    const langMixed = chooseMixedSet(validModules, "language_conventions", blueprint.selection.languageMixedKinds, 6, rng, usedModules);
    usedModules.add(langMixed.id);

    const part1Groups = [
      { type: "set", module: readingSets[0] },
      { type: "set", module: argMixed }
    ];
    const p1Lang = chooseFocusedQuestions(validModules, "language_conventions", 1, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    part1Groups.push({ type: "fillers", entries: p1Lang });

    const p3Groups = [
      { type: "set", module: readingSets[1] },
      { type: "set", module: readingSets[2] },
      { type: "set", module: langMixed }
    ];
    const p3Reading = chooseFocusedQuestions(validModules, "reading", 4, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    const p3Arguments = chooseFocusedQuestions(validModules, "arguments", 4, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    const p3Language = chooseFocusedQuestions(validModules, "language_conventions", 4, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    p3Groups.push({ type: "fillers", entries: p3Reading }, { type: "fillers", entries: p3Arguments }, { type: "fillers", entries: p3Language });

    function flatten(groups, part) {
      return shuffle(groups, rng).flatMap((group) => group.type === "set"
        ? groupItemsForModule(group.module, part, rng)
        : shuffle(group.entries, rng).map(({ module, question }) => fillerItem(module, question, part)));
    }

    const part1 = flatten(part1Groups, 1);
    const part3 = flatten(p3Groups, 3);
    const promptCandidates = shuffle((prompts || []).filter((p) => p && p.id && !Object.hasOwn(p, "strongerSource") && !Object.hasOwn(p, "authoringKey")), rng);
    if (!promptCandidates.length) throw new Error("No learner-safe ER prompts available");
    const erPromptId = promptCandidates[0].id;

    const attemptBlueprint = {
      version: blueprint.version,
      seed: String(seed),
      part1,
      erPromptId,
      part3,
      selectedReadingSets: readingSets.map((m) => ({ id: m.id, textType: (m.passageMeta || m.contentMeta?.passage)?.textType || "informational", context: (m.passageMeta || m.contentMeta?.passage)?.context || "", words: wordCount(m.passage) }))
    };
    validateGeneratedBlueprint(attemptBlueprint, blueprint);
    return attemptBlueprint;
  }


  function generateObjectivePractice({ modules, blueprint, seed = Date.now() }) {
    const rng = rngFromSeed(seed);
    const validModules = (modules || []).filter(isPublishedQuestionModule);
    const usedModules = new Set();
    const usedQuestions = new Set();
    const readingSets = chooseReadingSets(validModules, 2, blueprint, rng);
    readingSets.forEach((m) => usedModules.add(m.id));
    const argMixed = chooseMixedSet(validModules, "arguments", blueprint.selection.argumentsMixedKinds, 6, rng, usedModules);
    usedModules.add(argMixed.id);
    const langMixed = chooseMixedSet(validModules, "language_conventions", blueprint.selection.languageMixedKinds, 6, rng, usedModules);
    usedModules.add(langMixed.id);
    const fillersR = chooseFocusedQuestions(validModules, "reading", 3, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    const fillersL = chooseFocusedQuestions(validModules, "language_conventions", 1, blueprint.selection.focusedKind, rng, usedModules, usedQuestions);
    const groups = [
      { type: "set", module: readingSets[0] },
      { type: "set", module: readingSets[1] },
      { type: "set", module: argMixed },
      { type: "set", module: langMixed },
      { type: "fillers", entries: fillersR },
      { type: "fillers", entries: fillersL }
    ];
    const items = shuffle(groups, rng).flatMap((group) => group.type === "set"
      ? groupItemsForModule(group.module, 1, rng)
      : shuffle(group.entries, rng).map(({ module, question }) => fillerItem(module, question, 1)));
    if (items.length !== blueprint.objectivePractice.questionCount) throw new Error("Objective practice count mismatch");
    const counts = items.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {});
    for (const [category, expected] of Object.entries(blueprint.objectivePractice.domainTargets)) {
      if (counts[category] !== expected) throw new Error(`Objective practice domain target mismatch for ${category}`);
    }
    return { version: blueprint.version, seed: String(seed), items, selectedReadingSets: readingSets.map((m) => ({ id: m.id, textType: (m.passageMeta || m.contentMeta?.passage)?.textType || "informational", words: wordCount(m.passage) })) };
  }

  function createObjectiveAttempt(generated, blueprint, now = Date.now(), id) {
    const attemptId = id || `objective-${now}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      attemptId, mode: "objective", blueprintVersion: generated.version, seed: generated.seed,
      createdAt: new Date(now).toISOString(), completedAt: null, stage: "objective",
      objective: createObjectiveStage(generated.items, blueprint.objectivePractice.seconds, now), objectiveScore: null
    };
  }

  function validateGeneratedBlueprint(mock, blueprint) {
    if (mock.part1.length !== blueprint.full.part1.questionCount) throw new Error("Part 1 question count mismatch");
    if (mock.part3.length !== blueprint.full.part3.questionCount) throw new Error("Part 3 question count mismatch");
    const all = [...mock.part1, ...mock.part3];
    if (all.length !== blueprint.full.objectiveQuestionCount) throw new Error("Objective question count mismatch");
    const keys = all.map((i) => `${i.moduleId}:${i.questionId}`);
    if (new Set(keys).size !== keys.length) throw new Error("Duplicate objective question selected");
    const counts = all.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {});
    for (const [category, expected] of Object.entries(blueprint.full.domainTargets)) {
      if (counts[category] !== expected) throw new Error(`Domain target mismatch for ${category}: ${counts[category]} != ${expected}`);
    }
    if (!mock.selectedReadingSets.some((r) => Number(r.words) >= Number(blueprint.selection.staminaMinimumWords || 600))) throw new Error("No stamina Reading passage selected");
    const literary = mock.selectedReadingSets.filter((r) => r.textType === "literary").length;
    const ratio = literary / mock.selectedReadingSets.length;
    if (Math.abs(ratio - 0.25) > 0.1) throw new Error("Reading literary balance outside tolerance");
    return true;
  }

  function createAttempt(generated, blueprint, now = Date.now(), id) {
    const attemptId = id || `mock-${now}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      attemptId,
      blueprintVersion: generated.version,
      seed: generated.seed,
      createdAt: new Date(now).toISOString(),
      completedAt: null,
      stage: "part1",
      part1: createObjectiveStage(generated.part1, blueprint.full.part1.seconds, now),
      er: { promptId: generated.erPromptId, launchedAt: null, completedAt: null },
      break: { seconds: blueprint.full.break.seconds, startedAt: null, completedAt: null },
      part3: createObjectiveStage(generated.part3, blueprint.full.part3.seconds, null),
      objectiveScore: null
    };
  }

  function createObjectiveStage(items, seconds, now) {
    return { items, seconds, startedAt: now ? Number(now) : null, submittedAt: null, currentIndex: 0, answers: {}, flags: {}, locked: false };
  }

  function remainingSeconds(stageState, now = Date.now()) {
    if (!stageState || stageState.submittedAt || stageState.locked) return 0;
    if (!stageState.startedAt) return Number(stageState.seconds || 0);
    return Math.max(0, Number(stageState.seconds || 0) - Math.floor((Number(now) - Number(stageState.startedAt)) / 1000));
  }

  function objectiveItemKey(item) { return `${item.moduleId}:${item.questionId}`; }

  function scoreObjectiveAttempt(attempt, moduleMap) {
    const stages = attempt.mode === "objective" ? [attempt.objective] : [attempt.part1, attempt.part3];
    const summary = { correct: 0, attempted: 0, total: 0, unanswered: 0, flagged: 0, accuracy: 0, domains: {}, skills: {} };
    for (const stage of stages) {
      for (const item of stage.items || []) {
        const module = moduleMap.get ? moduleMap.get(item.moduleId) : moduleMap[item.moduleId];
        const question = (module?.questions || []).find((q) => q.id === item.questionId);
        if (!question) continue;
        const key = objectiveItemKey(item);
        const value = stage.answers?.[key];
        const answered = value !== undefined && value !== null && String(value) !== "";
        const domain = item.category;
        const bucket = summary.domains[domain] ||= { correct: 0, attempted: 0, total: 0, accuracy: 0 };
        const skillId = question.skill?.id || "unmapped";
        const skillBucket = summary.skills[skillId] ||= { id: skillId, label: question.skill?.label || skillId, category: domain, correct: 0, attempted: 0, total: 0, accuracy: 0 };
        summary.total += 1; bucket.total += 1; skillBucket.total += 1;
        if (stage.flags?.[key]) summary.flagged += 1;
        if (!answered) { summary.unanswered += 1; continue; }
        summary.attempted += 1; bucket.attempted += 1; skillBucket.attempted += 1;
        const correct = String(value) === String(question.correct);
        if (correct) { summary.correct += 1; bucket.correct += 1; skillBucket.correct += 1; }
      }
    }
    summary.accuracy = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
    for (const bucket of Object.values(summary.domains)) bucket.accuracy = bucket.total ? Math.round((bucket.correct / bucket.total) * 100) : 0;
    for (const bucket of Object.values(summary.skills)) bucket.accuracy = bucket.total ? Math.round((bucket.correct / bucket.total) * 100) : 0;
    return summary;
  }

  function stageTimeUsedSeconds(stage) {
    if (!stage?.startedAt || !stage?.submittedAt) return null;
    const submittedMs = typeof stage.submittedAt === "number" ? stage.submittedAt : Date.parse(stage.submittedAt);
    if (!Number.isFinite(submittedMs)) return null;
    return Math.min(Number(stage.seconds || Infinity), Math.max(0, Math.floor((submittedMs - Number(stage.startedAt)) / 1000)));
  }

  function sanitizeAttemptForHistory(attempt) {
    const base = {
      attemptId: attempt.attemptId,
      blueprintVersion: attempt.blueprintVersion,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      erPromptId: attempt.er?.promptId || null,
      objectiveScore: attempt.objectiveScore || null
    };
    if (attempt.mode === "objective") {
      base.objective = stageHistory(attempt.objective);
      return base;
    }
    base.part1 = stageHistory(attempt.part1);
    base.part3 = stageHistory(attempt.part3);
    return base;
  }

  function stageHistory(stage) {
    if (!stage) return null;
    return { seconds: stage.seconds, startedAt: stage.startedAt, submittedAt: stage.submittedAt, timeUsedSeconds: stageTimeUsedSeconds(stage), unanswered: countUnanswered(stage), flagged: countFlags(stage) };
  }

  function countUnanswered(stage) { return (stage?.items || []).filter((item) => !(objectiveItemKey(item) in (stage?.answers || {}))).length; }
  function countFlags(stage) { return Object.values(stage?.flags || {}).filter(Boolean).length; }

  root.MockEngine = { rngFromSeed, wordCount, generateFullMock, generateObjectivePractice, validateGeneratedBlueprint, createAttempt, createObjectiveAttempt, remainingSeconds, objectiveItemKey, scoreObjectiveAttempt, stageTimeUsedSeconds, sanitizeAttemptForHistory };
})(typeof globalThis !== "undefined" ? globalThis : window);
