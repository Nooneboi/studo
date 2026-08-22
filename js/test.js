/* Studo RLA Mock/Test V1 — strict section flow with fixed attempt recovery. */
const MOCK_PREFIX = "sq:rlaMock:";
const MOCK_HISTORY_KEY = "sq:rlaMockAttempts";
const MOCK_ACTIVE_KEY = "sq:rlaMock:activeId";
const CATEGORY_LABELS = { reading: "Reading", arguments: "Arguments", language_conventions: "Language" };
const params = new URLSearchParams(location.search);
const attemptId = params.get("attempt") || "";
const viewEl = document.getElementById("mock-view");
const flagBtn = document.getElementById("flag-btn");
const reviewBtn = document.getElementById("section-review-btn");
let attempt = null;
let modules = [];
let moduleMap = new Map();
let timerHandle = null;
let reviewing = false;

initMock();

async function initMock() {
  if (!attemptId) return renderFatal("No mock attempt was selected.");
  attempt = loadAttempt(attemptId);
  if (!attempt) return renderFatal("This mock attempt could not be recovered on this device.");
  try {
    modules = await Data.loadAllQuizzes();
    moduleMap = new Map(modules.map((m) => [m.id, m]));
    syncErCompletion();
    enforceExpiredStage();
    wireTopControls();
    renderStage();
  } catch (error) {
    console.error(error);
    renderFatal("Chee Skool could not load the questions for this mock.");
  }
}

function wireTopControls() {
  document.getElementById("mock-exit")?.addEventListener("click", (event) => {
    if (attempt.completedAt) return;
    if (!confirm("Leave the mock? Your saved attempt will remain on this device and the active section clock will keep running.")) event.preventDefault();
  });
  flagBtn?.addEventListener("click", toggleCurrentFlag);
  reviewBtn?.addEventListener("click", () => renderSectionReview());
}

function renderStage() {
  stopTimer();
  reviewing = false;
  syncErCompletion();
  if (attempt.stage === "part1" || attempt.stage === "part3" || attempt.stage === "objective") return renderObjectiveStage();
  if (attempt.stage === "er") return renderErStage();
  if (attempt.stage === "break") return renderBreakStage();
  if (attempt.stage === "results") return renderResults();
  renderFatal("This mock has an unknown saved stage.");
}

function currentObjectiveStage() {
  if (attempt.stage === "objective") return attempt.objective;
  return attempt[attempt.stage];
}

function renderObjectiveStage() {
  const stage = currentObjectiveStage();
  if (!stage) return renderFatal("This objective section is missing.");
  if (!stage.startedAt) { stage.startedAt = Date.now(); saveAttempt(); }
  const remaining = MockEngine.remainingSeconds(stage, Date.now());
  if (remaining <= 0 && !stage.submittedAt) return submitObjectiveStage(true);

  showTopControls(true);
  const label = attempt.stage === "part1" ? "Part 1" : attempt.stage === "part3" ? "Part 3" : "Objective Practice";
  setText("mock-part-label", label);
  setText("mock-title", attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock");
  stage.currentIndex = Math.max(0, Math.min(Number(stage.currentIndex || 0), stage.items.length - 1));
  const item = stage.items[stage.currentIndex];
  const module = moduleMap.get(item.moduleId);
  const q = (module?.questions || []).find((x) => x.id === item.questionId);
  if (!module || !q) return renderFatal("One selected mock question could not be loaded.");
  const key = MockEngine.objectiveItemKey(item);
  const saved = stage.answers?.[key];
  const promptHtml = q.type === "grammar_edit" ? escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>') : escapeHtml(q.prompt || "");
  const hasPassage = Boolean(module.passage);

  viewEl.innerHTML = `
    <section class="study-workspace mock-objective-workspace${hasPassage ? "" : " no-passage"}">
      <div>${hasPassage ? passageHtml(module) : ""}</div>
      <article class="question-panel" aria-label="Mock question">
        <div class="question-stage">
          <div class="mock-question-meta">${escapeHtml(CATEGORY_LABELS[item.category] || item.category)} · ${escapeHtml(module.title || "Question")}</div>
          <div class="q-prompt">${promptHtml}</div>
          <div data-role="answer-area">${answerAreaHtml(q, saved, stage.currentIndex)}</div>
        </div>
        <div class="question-footer">
          <button class="question-nav-btn secondary" id="mock-prev" type="button" ${stage.currentIndex === 0 ? "disabled" : ""}>Previous</button>
          <span class="question-footer-position">${stage.currentIndex + 1} / ${stage.items.length}</span>
          <button class="question-nav-btn primary" id="mock-next" type="button">${stage.currentIndex === stage.items.length - 1 ? "Review section" : "Next"}</button>
        </div>
      </article>
    </section>`;

  viewEl.querySelectorAll(".answer-radio").forEach((radio) => radio.addEventListener("change", () => {
    if (!radio.checked || stage.locked) return;
    stage.answers[key] = radio.value;
    saveAttempt();
    updateObjectiveHeader();
  }));
  viewEl.querySelectorAll(".mock-edit-select").forEach((select) => select.addEventListener("change", () => {
    if (stage.locked) return;
    if (select.value) stage.answers[key] = select.value;
    else delete stage.answers[key];
    saveAttempt();
    updateObjectiveHeader();
  }));
  document.getElementById("mock-prev")?.addEventListener("click", () => { if (stage.currentIndex > 0) { stage.currentIndex -= 1; saveAttempt(); renderObjectiveStage(); } });
  document.getElementById("mock-next")?.addEventListener("click", () => {
    if (stage.currentIndex < stage.items.length - 1) { stage.currentIndex += 1; saveAttempt(); renderObjectiveStage(); }
    else renderSectionReview();
  });
  updateObjectiveHeader();
  startObjectiveTimer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function answerAreaHtml(q, saved, index) {
  if (!["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) return `<div class="empty-state">This item type is not supported in Mock V1.</div>`;
  if (q.type === "grammar_edit") {
    return `<label class="mock-edit-field"><span>Choose the best edit</span><select class="mock-edit-select" aria-label="Choose the best edit"><option value="">Select an answer…</option>${(q.options || []).map((opt) => `<option value="${escapeAttr(opt.id)}" ${saved === opt.id ? "selected" : ""}>${escapeHtml(opt.text)}</option>`).join("")}</select></label>`;
  }
  return `<fieldset class="options-list" aria-label="Answer choices">${(q.options || []).map((opt) => `<label class="answer-choice"><input class="answer-radio" type="radio" name="mock-answer-${index}" value="${escapeAttr(opt.id)}" ${saved === opt.id ? "checked" : ""}><span class="choice-letter">${escapeHtml(String(opt.id).toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`).join("")}</fieldset>`;
}

function passageHtml(module) {
  const paragraphs = String(module.passage || "").trim().split(/\n\s*\n+/).filter(Boolean);
  return `<aside class="reading-column test-reading-column" aria-label="Source passage"><header class="passage-heading passage-heading-test"><h1>${escapeHtml(module.title)}</h1><p>${escapeHtml(module.description || "")}</p></header><section class="reading-panel reading-panel-clean"><div class="reading-scroll"><div class="passage-text passage-numbered">${paragraphs.map((p, i) => `<p class="passage-paragraph"><span class="passage-paragraph-number">${i + 1}</span><span>${escapeHtml(p)}</span></p>`).join("")}</div></div>${module.source ? `<div class="source-credit">${escapeHtml(module.source)}</div>` : ""}</section></aside>`;
}

function toggleCurrentFlag() {
  if (!attempt || !["part1", "part3", "objective"].includes(attempt.stage) || reviewing) return;
  const stage = currentObjectiveStage();
  const item = stage.items[stage.currentIndex];
  const key = MockEngine.objectiveItemKey(item);
  stage.flags[key] = !stage.flags?.[key];
  saveAttempt();
  updateObjectiveHeader();
}

function updateObjectiveHeader() {
  if (!attempt || !["part1", "part3", "objective"].includes(attempt.stage)) return;
  const stage = currentObjectiveStage();
  const item = stage.items[stage.currentIndex];
  const key = MockEngine.objectiveItemKey(item);
  const answered = Object.keys(stage.answers || {}).filter((k) => String(stage.answers[k] ?? "").trim()).length;
  setText("mock-progress", reviewing ? `Review · ${answered}/${stage.items.length} answered` : `Question ${stage.currentIndex + 1} of ${stage.items.length}`);
  const fill = document.getElementById("mock-progress-fill");
  if (fill) fill.style.width = `${reviewing ? 100 : ((stage.currentIndex + 1) / stage.items.length) * 100}%`;
  if (flagBtn) {
    const flagged = Boolean(stage.flags?.[key]);
    flagBtn.hidden = reviewing;
    flagBtn.classList.toggle("active", flagged);
    flagBtn.setAttribute("aria-pressed", String(flagged));
    flagBtn.textContent = flagged ? "Flagged" : "Flag for review";
  }
  if (reviewBtn) reviewBtn.hidden = reviewing;
}

function renderSectionReview() {
  if (!["part1", "part3", "objective"].includes(attempt.stage)) return;
  reviewing = true;
  const stage = currentObjectiveStage();
  const answered = stage.items.filter((item) => hasAnswer(stage.answers?.[MockEngine.objectiveItemKey(item)])).length;
  showTopControls(true);
  if (flagBtn) flagBtn.hidden = true;
  if (reviewBtn) reviewBtn.hidden = true;
  setText("mock-progress", `Review · ${answered}/${stage.items.length} answered`);
  viewEl.innerHTML = `<section class="test-review mock-section-review"><div class="test-review-head"><span class="question-number">Section review</span><h1>Check before you submit</h1><p>Answers stay hidden. Return to any unanswered or flagged question before locking this section.</p></div><div class="mock-navigator">${stage.items.map((item, index) => {
    const key = MockEngine.objectiveItemKey(item); const isAnswered = hasAnswer(stage.answers?.[key]); const isFlagged = Boolean(stage.flags?.[key]);
    return `<button type="button" class="mock-nav-cell${isAnswered ? " answered" : " unanswered"}${isFlagged ? " flagged" : ""}" data-index="${index}"><strong>${index + 1}</strong><span>${isFlagged ? "Flagged" : isAnswered ? "Answered" : "Unanswered"}</span></button>`;
  }).join("")}</div><div class="test-review-actions"><button class="question-nav-btn secondary" id="review-back" type="button">Back to questions</button><button class="question-nav-btn primary" id="review-submit" type="button">Submit section</button></div></section>`;
  viewEl.querySelectorAll("[data-index]").forEach((btn) => btn.addEventListener("click", () => { stage.currentIndex = Number(btn.dataset.index); saveAttempt(); renderObjectiveStage(); }));
  document.getElementById("review-back")?.addEventListener("click", () => renderObjectiveStage());
  document.getElementById("review-submit")?.addEventListener("click", () => submitObjectiveStage(false));
  startObjectiveTimer();
}

function submitObjectiveStage(timedOut) {
  stopTimer();
  const stage = currentObjectiveStage();
  if (!stage || stage.submittedAt) return;
  const unanswered = stage.items.filter((item) => !hasAnswer(stage.answers?.[MockEngine.objectiveItemKey(item)])).length;
  if (!timedOut && unanswered && !confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Submit this section anyway? You cannot return after submitting.`)) return;
  stage.submittedAt = new Date().toISOString();
  stage.locked = true;
  if (attempt.mode === "objective") return completeAttempt(timedOut);
  if (attempt.stage === "part1") {
    attempt.stage = "er";
    saveAttempt();
    renderStage();
  } else if (attempt.stage === "part3") completeAttempt(timedOut);
}

function renderErStage() {
  showTopControls(false);
  setText("mock-part-label", "Part 2");
  setText("mock-title", "Extended Response");
  setText("mock-clock", "45:00");
  const erState = loadMockErState();
  const hasDraft = Boolean(erState);
  viewEl.innerHTML = `<section class="mock-transition-screen"><span class="mock-option-label">Part 2 · 45 minutes</span><h1>Extended Response</h1><p>Your full mock uses one paired-source writing prompt. The essay is not automatically scored; after submission, your three rubric traits remain clearly labeled as self-review.</p><div class="mock-transition-notes"><span>Read both sources</span><span>Choose the better-supported argument</span><span>Use specific evidence</span></div><button class="btn" id="launch-er" type="button">${hasDraft ? "Continue Extended Response" : "Start Extended Response"}</button><p class="mock-disclaimer">The 45-minute ER clock starts when the writing workspace opens and continues across refreshes.</p></section>`;
  document.getElementById("launch-er")?.addEventListener("click", () => {
    if (!attempt.er.launchedAt) attempt.er.launchedAt = new Date().toISOString();
    saveAttempt();
    const ret = `test.html?attempt=${encodeURIComponent(attempt.attemptId)}`;
    location.href = `extended-response.html?prompt=${encodeURIComponent(attempt.er.promptId)}&mode=timed&attempt=${encodeURIComponent(attempt.attemptId)}&return=${encodeURIComponent(ret)}`;
  });
}

function syncErCompletion() {
  if (!attempt || attempt.mode === "objective" || attempt.stage !== "er") return;
  const erState = loadMockErState();
  if (erState?.submittedAt && !attempt.er.completedAt) {
    attempt.er.completedAt = erState.submittedAt;
    attempt.stage = "break";
    attempt.break.startedAt = Date.now();
    saveAttempt();
  }
}

function loadMockErState() {
  if (!attempt?.er?.promptId) return null;
  try { return JSON.parse(getValue(`sq:er:mock:${attempt.attemptId}:${attempt.er.promptId}`) || "null"); } catch (_) { return null; }
}

function renderBreakStage() {
  showTopControls(false);
  if (!attempt.break.startedAt) { attempt.break.startedAt = Date.now(); saveAttempt(); }
  setText("mock-part-label", "Break"); setText("mock-title", "10-minute break");
  viewEl.innerHTML = `<section class="mock-transition-screen"><span class="mock-option-label">Between Parts 2 and 3</span><h1>Take the intended break</h1><div class="mock-break-clock" id="break-clock">10:00</div><p>Part 3 keeps its full 65 minutes whether you use the whole break or continue early.</p><button class="btn secondary" id="continue-part3" type="button">Continue to Part 3 now</button></section>`;
  const update = () => {
    const elapsed = Math.floor((Date.now() - Number(attempt.break.startedAt)) / 1000);
    const remaining = Math.max(0, Number(attempt.break.seconds) - elapsed);
    setText("mock-clock", formatTime(remaining)); setText("break-clock", formatTime(remaining));
    if (remaining <= 0) startPart3();
  };
  update(); timerHandle = setInterval(update, 1000);
  document.getElementById("continue-part3")?.addEventListener("click", () => { if (confirm("Continue early? Part 3 will begin immediately with its full 65-minute timer.")) startPart3(); });
}

function startPart3() {
  if (attempt.stage !== "break") return;
  stopTimer(); attempt.break.completedAt = new Date().toISOString(); attempt.stage = "part3"; attempt.part3.startedAt = Date.now(); saveAttempt(); renderStage();
}

function completeAttempt(timedOut) {
  stopTimer();
  attempt.objectiveScore = MockEngine.scoreObjectiveAttempt(attempt, moduleMap);
  attempt.completedAt = new Date().toISOString();
  attempt.stage = "results";
  attempt.timedOut = Boolean(timedOut);
  saveAttempt();
  archiveAttempt();
  removeValue(MOCK_ACTIVE_KEY);
  renderResults();
}

function renderResults() {
  showTopControls(false);
  const score = attempt.objectiveScore || MockEngine.scoreObjectiveAttempt(attempt, moduleMap);
  setText("mock-part-label", "Results"); setText("mock-title", attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock"); setText("mock-clock", "Done");
  const erState = attempt.mode === "objective" ? null : loadMockErState();
  const erScores = erState?.selfScores || {};
  const erText = [erScores.argument, erScores.organization, erScores.english].every(Number.isInteger) ? `${erScores.argument} / ${erScores.organization} / ${erScores.english}` : "Not self-reviewed yet";
  const timeUsed = attempt.mode === "objective"
    ? [["Objective section", MockEngine.stageTimeUsedSeconds(attempt.objective)]]
    : [["Part 1", MockEngine.stageTimeUsedSeconds(attempt.part1)], ["Extended Response", erState ? MockEngine.stageTimeUsedSeconds({ seconds: 2700, startedAt: erState.startedAt, submittedAt: erState.submittedAt }) : null], ["Part 3", MockEngine.stageTimeUsedSeconds(attempt.part3)]];
  const skillRows = Object.values(score.skills || {}).sort((a, b) => a.accuracy - b.accuracy || b.total - a.total || a.label.localeCompare(b.label));
  viewEl.innerHTML = `<section class="mock-results"><div class="page-kicker">Raw objective result</div><h1>${score.correct} / ${score.total} correct</h1><p class="mock-results-lede">${score.accuracy}% objective accuracy. This is a Chee Skool raw score, not a GED scaled score or pass/fail prediction.</p><div class="mock-results-grid">${Object.entries(score.domains || {}).map(([key, bucket]) => `<div><span>${escapeHtml(CATEGORY_LABELS[key] || key)}</span><strong>${bucket.correct}/${bucket.total}</strong><small>${bucket.accuracy}%</small></div>`).join("")}</div><div class="mock-result-details"><span><strong>${score.unanswered}</strong> unanswered</span><span><strong>${score.flagged}</strong> flagged at submission</span></div><div class="mock-time-used"><strong>Time used</strong>${timeUsed.map(([label, seconds]) => `<span>${escapeHtml(label)}: ${escapeHtml(seconds == null ? "Not recorded" : formatDuration(seconds))}</span>`).join("")}</div>${skillRows.length ? `<details class="mock-skill-review"><summary>Skill breakdown</summary><div class="mock-skill-grid">${skillRows.map((bucket) => `<div><span>${escapeHtml(bucket.label)}</span><strong>${bucket.correct}/${bucket.total}</strong><small>${bucket.accuracy}%</small></div>`).join("")}</div></details>` : ""}${attempt.mode === "objective" ? "" : `<section class="mock-er-result"><span class="mock-option-label">Extended Response · Self-review</span><h2>T1 / T2 / T3: ${escapeHtml(erText)}</h2><p>These trait levels are your own rubric review and are kept separate from the objective result.</p><a class="btn secondary small" href="extended-response.html?prompt=${encodeURIComponent(attempt.er.promptId)}&mode=timed&attempt=${encodeURIComponent(attempt.attemptId)}&return=${encodeURIComponent(`test.html?attempt=${attempt.attemptId}`)}">Review ER response</a></section>`}<details class="mock-answer-review"><summary>Review objective answers</summary><p class="mock-review-note">Answer explanations are available only after the test is complete.</p>${objectiveAnswerReviewHtml()}</details><div class="mock-results-actions"><a class="btn" href="quiz.html">Back to Mock Tests</a><a class="btn secondary" href="progress.html">Open Progress</a></div></section>`;
}

function objectiveAnswerReviewHtml() {
  const stages = attempt.mode === "objective" ? [attempt.objective] : [attempt.part1, attempt.part3];
  let number = 0;
  return stages.flatMap((stage) => (stage?.items || []).map((item) => {
    number += 1;
    const module = moduleMap.get(item.moduleId);
    const q = (module?.questions || []).find((x) => x.id === item.questionId);
    if (!q) return "";
    const key = MockEngine.objectiveItemKey(item);
    const value = stage.answers?.[key];
    const selected = (q.options || []).find((opt) => String(opt.id) === String(value));
    const correct = (q.options || []).find((opt) => String(opt.id) === String(q.correct));
    const isCorrect = value != null && String(value) === String(q.correct);
    const feedback = isCorrect ? q.explanation : (selected?.whyWrong || q.explanation || "Review the source and compare the evidence more closely.");
    return `<article class="mock-review-item ${isCorrect ? "correct" : "incorrect"}"><div class="mock-review-heading"><span>Question ${number} · ${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}</span><strong>${isCorrect ? "Correct" : value == null ? "Unanswered" : "Incorrect"}</strong></div><h3>${escapeHtml(module?.title || "Question")}</h3><p>${escapeHtml(q.prompt || "")}</p><dl><div><dt>Your answer</dt><dd>${escapeHtml(selected?.text || "No answer")}</dd></div><div><dt>Correct answer</dt><dd>${escapeHtml(correct?.text || String(q.correct || ""))}</dd></div></dl><p class="mock-review-feedback">${escapeHtml(feedback || "")}</p></article>`;
  })).join("");
}

function archiveAttempt() {
  const history = loadHistory();
  const entry = {
    ...MockEngine.sanitizeAttemptForHistory(attempt),
    mode: attempt.mode || "full",
    label: attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock",
    erSelfReview: attempt.mode === "objective" ? null : (loadMockErState()?.selfScores || null)
  };
  const next = [entry, ...history.filter((x) => x.attemptId !== entry.attemptId)].slice(0, 25);
  setValue(MOCK_HISTORY_KEY, JSON.stringify(next));
}

function loadHistory() { try { const x = JSON.parse(getValue(MOCK_HISTORY_KEY) || "[]"); return Array.isArray(x) ? x : []; } catch (_) { return []; } }

function startObjectiveTimer() {
  stopTimer();
  const stage = currentObjectiveStage();
  const update = () => {
    const remaining = MockEngine.remainingSeconds(stage, Date.now());
    setText("mock-clock", formatTime(remaining));
    document.getElementById("mock-clock")?.classList.toggle("urgent", remaining <= 300);
    if (remaining <= 0 && !stage.submittedAt) submitObjectiveStage(true);
  };
  update(); timerHandle = setInterval(update, 1000);
}

function enforceExpiredStage() {
  if (!["part1", "part3", "objective"].includes(attempt.stage)) return;
  const stage = currentObjectiveStage();
  if (stage && !stage.submittedAt && stage.startedAt && MockEngine.remainingSeconds(stage, Date.now()) <= 0) submitObjectiveStage(true);
}

function showTopControls(objective) {
  if (flagBtn) flagBtn.hidden = !objective;
  if (reviewBtn) reviewBtn.hidden = !objective;
  const fill = document.getElementById("mock-progress-fill"); if (fill && !objective) fill.style.width = "0%";
  if (!objective) setText("mock-progress", "");
}
function stopTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }
function saveAttempt() { setValue(`${MOCK_PREFIX}${attempt.attemptId}`, JSON.stringify(attempt)); }
function loadAttempt(id) { try { return JSON.parse(getValue(`${MOCK_PREFIX}${id}`) || "null"); } catch (_) { return null; } }
function getValue(key) { return window.StudoSafeStorage ? window.StudoSafeStorage.get(key) : localStorage.getItem(key); }
function setValue(key, value) { return window.StudoSafeStorage ? window.StudoSafeStorage.set(key, value) : localStorage.setItem(key, value); }
function removeValue(key) { return window.StudoSafeStorage ? window.StudoSafeStorage.remove(key) : localStorage.removeItem(key); }
function hasAnswer(value) { return typeof value === "string" ? Boolean(value.trim()) : value !== undefined && value !== null; }
function formatTime(seconds) { const m = Math.floor(Math.max(0, seconds) / 60); const s = Math.max(0, seconds) % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; }
function formatDuration(seconds) { const m = Math.floor(Number(seconds || 0) / 60); const s = Number(seconds || 0) % 60; return `${m}m ${String(s).padStart(2, "0")}s`; }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function renderFatal(message) { stopTimer(); showTopControls(false); viewEl.innerHTML = `<section class="empty-state"><h1>Mock unavailable</h1><p>${escapeHtml(message)}</p><a class="btn" href="quiz.html">Back to Mock Tests</a></section>`; }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g, "&quot;"); }
