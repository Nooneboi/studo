/*
  check.js — dedicated independent Skill Check runtime
  ----------------------------------------------------
  No hints, retries, confidence prompts, timer, or correctness feedback
  are shown until the learner submits the complete check.
*/
const CHECK_HISTORY_KEY = "sq:skill-check-history:v1";
const CHECK_HISTORY_LIMIT = 60;
const params = new URLSearchParams(location.search);
const checkView = document.getElementById("check-view");
const requestedFile = params.get("file") || "";
const returnHref = safeReturn(params.get("return"));
let currentModule = null;
let currentIndex = 0;
let submitted = false;
const answers = {};

initCheck();

async function initCheck() {
  document.getElementById("check-exit")?.setAttribute("href", returnHref);
  if (!requestedFile || !/^generated\/modules\/[a-z0-9._-]+\.json$/i.test(requestedFile)) {
    return renderRecovery("This Skill Check could not be opened.");
  }
  try {
    currentModule = await Data.loadQuiz(requestedFile);
  } catch (error) {
    console.error(error);
    return renderRecovery("This Skill Check could not be loaded.");
  }
  const roles = currentModule?.contentMeta?.curriculum?.deliveryRoles || [];
  if (!roles.includes("skill_check")) return renderRecovery("This file is not a dedicated Skill Check.");
  if (!Array.isArray(currentModule.questions) || !currentModule.questions.length) return renderRecovery("This Skill Check has no questions.");

  document.title = `Chee Skool — ${currentModule.title || "Skill Check"}`;
  document.getElementById("check-title").textContent = currentModule.topic || "Skill Check";
  renderQuestion();
}

function renderQuestion() {
  const q = currentModule.questions[currentIndex];
  const hasPassage = Boolean(currentModule.passage);
  checkView.innerHTML = `
    <section class="check-intro" aria-label="Skill Check conditions">
      <span>Independent</span><span>No hints</span><span>Answers after finishing</span>
    </section>
    <section class="study-workspace check-workspace${hasPassage ? "" : " no-passage"}">
      <div>${hasPassage ? passageHtml(currentModule, q, answers[q.id] || "") : ""}</div>
      <article class="question-panel" aria-label="Skill Check question">
        <div class="question-stage">
          <div class="question-topline question-topline-clean"><span class="question-number">Question ${currentIndex + 1} of ${currentModule.questions.length}</span></div>
          <div class="q-prompt">${promptHtml(q)}</div>
          <div data-role="check-answer-area">${answerAreaHtml(q, answers[q.id] || "", currentIndex)}</div>
          <p class="interaction-live-status" id="check-answer-status" aria-live="polite"></p>
        </div>
        <div class="question-footer">
          <button class="question-nav-btn secondary" id="check-prev" type="button" ${currentIndex === 0 ? "disabled" : ""}>Previous</button>
          <span class="question-footer-position">${currentIndex + 1} / ${currentModule.questions.length}</span>
          <button class="question-nav-btn primary" id="check-next" type="button">${currentIndex === currentModule.questions.length - 1 ? "Finish Check" : "Next"}</button>
        </div>
      </article>
    </section>`;

  bindAnswer(q);
  document.getElementById("check-prev")?.addEventListener("click", () => {
    if (currentIndex > 0) { currentIndex -= 1; renderQuestion(); }
  });
  document.getElementById("check-next")?.addEventListener("click", () => {
    if (currentIndex < currentModule.questions.length - 1) { currentIndex += 1; renderQuestion(); }
    else finishCheck();
  });
  updateHeader();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function promptHtml(q) {
  const I = window.QuestionInteractions;
  if (q.type === "grammar_edit" && I?.grammarEditMode(q) === "inline") return "";
  return escapeHtml(q.prompt || "");
}

function optionSelectHtml(q, saved, label) {
  return `<select class="mock-edit-select" aria-label="${escapeAttr(label)}"><option value="">Select an answer…</option>${(q.options || []).map((opt) => `<option value="${escapeAttr(opt.id)}" ${String(saved) === String(opt.id) ? "selected" : ""}>${escapeHtml(opt.text)}</option>`).join("")}</select>`;
}

function answerAreaHtml(q, saved, index) {
  const I = window.QuestionInteractions;
  if (["multiple_choice", "evidence_based"].includes(q.type)) {
    return `<fieldset class="options-list" aria-label="Answer choices">${(q.options || []).map((opt) => `<label class="answer-choice"><input class="answer-radio" type="radio" name="check-answer-${index}" value="${escapeAttr(opt.id)}" ${String(saved) === String(opt.id) ? "checked" : ""}><span class="choice-letter">${escapeHtml(String(opt.id).toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`).join("")}</fieldset>`;
  }
  if (q.type === "grammar_edit") {
    if (I?.grammarEditMode(q) === "inline") {
      const parts = I.splitGrammarPrompt(q);
      return `<div class="embedded-edit-question inline-mode"><div class="embedded-edit-prompt">${escapeHtml(parts.before)}${optionSelectHtml(q, saved, "Choose the best edit")}${escapeHtml(parts.after)}</div></div>`;
    }
    return `<label class="mock-edit-field"><span>Choose the best revision</span>${optionSelectHtml(q, saved, "Choose the best revision")}</label>`;
  }
  if (q.type === "select_text") return `<div class="select-text-instructions">Select one ${escapeHtml(q.interaction?.selectionMode || "text area")} directly in the passage.</div>`;
  if (q.type === "drag_sort") return dragSortHtml(q, saved);
  if (q.type === "drag_order") return dragOrderHtml(q, saved);
  return `<div class="empty-state">This question type is not available in Skill Check.</div>`;
}

function passageHtml(module, q, saved) {
  const I = window.QuestionInteractions;
  const body = String(module.passage || "").trim().split(/\n\s*\n+/).filter(Boolean).map((paragraph, i) => {
    if (q.type !== "select_text" || !I) return `<p class="passage-paragraph"><span class="passage-paragraph-number">${i + 1}</span><span>${escapeHtml(paragraph)}</span></p>`;
    const segments = I.segmentTextTargets(paragraph, q.interaction?.targets || []);
    const content = segments.map((segment) => segment.kind === "target"
      ? `<button type="button" class="select-text-target${String(saved) === String(segment.id) ? " selected" : ""}" data-select-target="${escapeAttr(segment.id)}" aria-pressed="${String(saved) === String(segment.id)}">${escapeHtml(segment.text)}</button>`
      : escapeHtml(segment.text)).join("");
    return `<p class="passage-paragraph"><span class="passage-paragraph-number">${i + 1}</span><span>${content}</span></p>`;
  }).join("");
  return `<aside class="reading-column test-reading-column" aria-label="Source passage"><header class="passage-heading passage-heading-test"><h1>${escapeHtml(module.contentMeta?.passage?.title || module.title)}</h1></header><section class="reading-panel reading-panel-clean"><div class="reading-scroll"><div class="passage-text passage-numbered">${body}</div></div>${module.source ? `<div class="source-credit">${escapeHtml(module.source)}</div>` : ""}</section></aside>`;
}

function dragSortHtml(q, saved) {
  const I = window.QuestionInteractions;
  const assignments = I?.parseSort(saved) || {};
  const zones = q.interaction?.zones || [];
  const items = q.interaction?.items || [];
  const itemHtml = (item) => `<article class="drag-card" data-drag-item="${escapeAttr(item.id)}"><p>${escapeHtml(item.text)}</p><div class="drag-card-destinations">${zones.map((zone) => `<button type="button" data-sort-destination="${escapeAttr(zone.id)}" ${assignments[item.id] === zone.id ? "disabled" : ""}>${escapeHtml(zone.label)}</button>`).join("")}</div></article>`;
  return `<div class="drag-sort-board"><section class="drag-zone drag-bank"><h3>Statements to sort</h3><div data-sort-list="__bank__">${items.filter((item) => !assignments[item.id]).map(itemHtml).join("")}</div></section><div class="drag-zone-grid">${zones.map((zone) => `<section class="drag-zone"><h3>${escapeHtml(zone.label)}</h3><div data-sort-list="${escapeAttr(zone.id)}">${items.filter((item) => assignments[item.id] === zone.id).map(itemHtml).join("")}</div></section>`).join("")}</div></div>`;
}

function dragOrderHtml(q, saved) {
  const I = window.QuestionInteractions;
  const authored = (q.interaction?.items || []).map((item) => item.id);
  let order = I?.parseOrder(saved) || [];
  if (order.length !== authored.length || !authored.every((id) => order.includes(id))) order = [...authored];
  const itemMap = new Map((q.interaction?.items || []).map((item) => [item.id, item]));
  return `<div class="drag-order-list" data-order-list>${order.map((id, position) => { const item = itemMap.get(id); return `<article class="drag-order-row" data-order-item="${escapeAttr(id)}"><div><span class="order-number">${position + 1}</span><span>${escapeHtml(item?.text || id)}</span></div><div class="order-controls"><button type="button" class="order-control" data-order-up ${position === 0 ? "disabled" : ""}>↑</button><button type="button" class="order-control" data-order-down ${position === order.length - 1 ? "disabled" : ""}>↓</button></div></article>`; }).join("")}</div>`;
}

function bindAnswer(q) {
  const I = window.QuestionInteractions;
  checkView.querySelectorAll(".answer-radio").forEach((radio) => radio.addEventListener("change", () => {
    if (radio.checked && !submitted) setAnswer(q, radio.value);
  }));
  checkView.querySelectorAll(".mock-edit-select").forEach((select) => select.addEventListener("change", () => setAnswer(q, select.value)));
  if (q.type === "select_text") {
    const targets = [...checkView.querySelectorAll("[data-select-target]")];
    targets.forEach((button) => button.addEventListener("click", () => {
      targets.forEach((target) => { const active = target === button; target.classList.toggle("selected", active); target.setAttribute("aria-pressed", String(active)); });
      setAnswer(q, button.dataset.selectTarget);
    }));
  }
  if (q.type === "drag_sort" && I) {
    const assignments = I.parseSort(answers[q.id] || "");
    checkView.querySelectorAll("[data-sort-destination]").forEach((button) => button.addEventListener("click", () => {
      const card = button.closest("[data-drag-item]");
      assignments[card?.dataset.dragItem] = button.dataset.sortDestination;
      setAnswer(q, I.serializeSort(assignments));
      renderQuestion();
    }));
  }
  if (q.type === "drag_order" && I) {
    const authored = (q.interaction?.items || []).map((item) => item.id);
    let order = I.parseOrder(answers[q.id] || "");
    if (order.length !== authored.length || !authored.every((id) => order.includes(id))) order = [...authored];
    checkView.querySelectorAll("[data-order-up], [data-order-down]").forEach((button) => button.addEventListener("click", () => {
      const row = button.closest("[data-order-item]");
      order = I.moveOrder(order, row?.dataset.orderItem, button.hasAttribute("data-order-up") ? -1 : 1);
      setAnswer(q, I.serializeOrder(order));
      renderQuestion();
    }));
  }
}

function setAnswer(q, value) {
  const canonical = window.QuestionInteractions?.canonicalizeAnswer(q, value) ?? String(value || "");
  if (canonical) answers[q.id] = canonical;
  else delete answers[q.id];
  const status = document.getElementById("check-answer-status");
  if (status) status.textContent = canonical ? "Answer saved for this Check." : "Answer cleared.";
  updateHeader();
}

function finishCheck() {
  const I = window.QuestionInteractions;
  const unanswered = currentModule.questions.filter((q) => !I?.hasCompleteAnswer(q, answers[q.id] || ""));
  if (unanswered.length) {
    const first = currentModule.questions.findIndex((q) => q.id === unanswered[0].id);
    currentIndex = Math.max(0, first);
    renderQuestion();
    const status = document.getElementById("check-answer-status");
    if (status) { status.textContent = `${unanswered.length} question${unanswered.length === 1 ? "" : "s"} still need an answer.`; status.setAttribute("role", "alert"); }
    return;
  }
  if (submitted) return;
  submitted = true;
  const attemptId = globalThis.crypto?.randomUUID?.() || `check-${Date.now()}`;
  const results = currentModule.questions.map((question) => {
    const answer = answers[question.id];
    const correct = I.isCorrect(question, answer);
    Learning.recordAttempt({
      module: currentModule,
      question,
      answer,
      correct,
      mode: "skill_check",
      file: requestedFile,
      confidence: null,
      firstTryCorrect: correct,
      attemptCount: 1,
      assistance: "none",
      learningStage: null,
    });
    return { question, answer, correct };
  });
  const correct = results.filter((item) => item.correct).length;
  saveHistory({ attemptId, correct, total: results.length });
  renderResults(results, correct);
}

function saveHistory({ attemptId, correct, total }) {
  const firstQuestion = currentModule.questions[0];
  const skill = Learning.skillFor(currentModule, firstQuestion);
  const history = readHistory();
  history.unshift({
    attemptId,
    moduleId: currentModule.id,
    skillId: skill.id,
    skillLabel: skill.label,
    moduleTitle: currentModule.title || "Skill Check",
    attemptedAt: new Date().toISOString(),
    correct,
    total,
    percentage: Math.round((correct / total) * 100),
  });
  writeStorage(CHECK_HISTORY_KEY, JSON.stringify(history.slice(0, CHECK_HISTORY_LIMIT)));
}

function readHistory() {
  try {
    const raw = readStorage(CHECK_HISTORY_KEY, "[]");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}

function renderResults(results, correct) {
  const I = window.QuestionInteractions;
  const total = results.length;
  checkView.innerHTML = `
    <section class="check-results" aria-labelledby="check-result-heading">
      <div class="page-kicker">Skill Check complete</div>
      <h1 id="check-result-heading" tabindex="-1">${correct} / ${total} correct</h1>
      <p>${Math.round((correct / total) * 100)}% on this Chee Skool Skill Check. This is an independent practice result, not a GED score.</p>
      <div class="check-result-actions"><a class="btn" href="${escapeAttr(returnHref)}">Back to skill</a><a class="btn secondary" href="${escapeAttr(returnHref)}">Review this skill</a></div>
      <div class="check-review-list">${results.map((item, index) => `
        <article class="answer-review ${item.correct ? "is-right" : "is-wrong"}">
          <div class="answer-review-head"><strong>Question ${index + 1}</strong><span>${item.correct ? "Correct" : "Needs review"}</span></div>
          <p>${escapeHtml(item.question.prompt || "")}</p>
          <p><strong>Your answer:</strong> ${escapeHtml(I.formatAnswer(item.question, item.answer))}</p>
          <p><strong>Correct answer:</strong> ${escapeHtml(I.formatAnswer(item.question, item.question.correct))}</p>
          ${item.question.explanation ? `<p class="answer-review-why"><span>Why</span>${escapeHtml(item.question.explanation)}</p>` : ""}
          ${item.question.evidenceExcerpt ? `<blockquote>${escapeHtml(item.question.evidenceExcerpt)}</blockquote>` : ""}
        </article>`).join("")}</div>
    </section>`;
  document.getElementById("check-result-heading")?.focus();
  document.getElementById("check-header-progress").textContent = "Complete";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateHeader() {
  const answered = currentModule.questions.filter((q) => window.QuestionInteractions?.hasCompleteAnswer(q, answers[q.id] || "")).length;
  const header = document.getElementById("check-header-progress");
  if (header) header.textContent = `${answered}/${currentModule.questions.length} answered`;
}

function renderRecovery(message) {
  checkView.innerHTML = `<div class="empty-state"><h1>Skill Check unavailable</h1><p>${escapeHtml(message)}</p><a class="btn" href="${escapeAttr(returnHref)}">Back to skill</a></div>`;
}

function safeReturn(value) {
  const raw = String(value || "").trim();
  if (!raw) return "practice.html";
  try {
    const url = new URL(raw, location.href);
    if (url.origin !== location.origin) return "practice.html";
    const page = url.pathname.split("/").pop();
    if (!page || !["skill.html", "domain.html", "practice.html", "progress.html"].includes(page)) return "practice.html";
    return `${page}${url.search}${url.hash}`;
  } catch (_) { return "practice.html"; }
}

function readStorage(key, fallback) {
  return window.StudoSafeStorage ? window.StudoSafeStorage.get(key, fallback) : (localStorage.getItem(key) ?? fallback);
}
function writeStorage(key, value) {
  if (window.StudoSafeStorage) return window.StudoSafeStorage.set(key, value);
  localStorage.setItem(key, value); return true;
}
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g, "&quot;"); }
