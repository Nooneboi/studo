/*
  train.js — Phase 3C adaptive session
  ------------------------------------
  Builds a short session from the local learning history and the current
  question catalog. Every chosen question has an explainable reason.
*/

const trainView = document.getElementById("train-view");
const trainHeaderProgress = document.getElementById("train-header-progress");
let catalog = [];
let plan = null;
let currentIndex = 0;
let currentConfidence = null;
let openedAt = Date.now();
const results = [];

init();

async function init() {
  try {
    catalog = await Data.loadAllQuizzes();
    plan = Learning.buildTrainingPlan(catalog, { limit: 8 });
  } catch (e) {
    trainView.innerHTML = `<div class="empty-state">Couldn't build a training session. <a href="practice.html">Choose Practice manually</a>.</div>`;
    return;
  }

  if (!plan.items.length) {
    trainView.innerHTML = `<div class="empty-state">There aren't enough auto-graded questions available yet. <a href="practice.html">Choose Practice manually</a>.</div>`;
    return;
  }

  renderPlan();
}

function renderPlan() {
  setHeaderProgress("");
  const reasonCounts = countReasons(plan.items);
  trainView.innerHTML = `
    <section class="train-plan" aria-labelledby="train-plan-heading">
      <div class="train-plan-eyebrow">${plan.adaptive ? "Adaptive session" : "Baseline session"}</div>
      <h1 id="train-plan-heading">Today’s training</h1>
      <p class="lede">${plan.adaptive
        ? "Chee Skool picked these questions from your review timing, weaker skills, and places where a fresh question can test whether learning transferred."
        : "Chee Skool needs a little more evidence before it can personalize strongly. This session stays broad, while still following up obvious signals such as a recent miss."}</p>

      <div class="train-plan-meta" aria-label="Training session summary">
        <div><strong>${plan.items.length}</strong><span>questions</span></div>
        <div><strong>~${plan.estimatedMinutes}</strong><span>minutes</span></div>
        <div><strong>${plan.dueCount}</strong><span>reviews due</span></div>
      </div>

      <div class="train-plan-reasons">
        ${reasonCounts.map((item) => `<div class="train-reason-row"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div>`).join("")}
      </div>

      <div class="train-plan-actions">
        <button class="btn" id="start-training">Start training</button>
        <a class="btn secondary" href="practice.html">Choose manually</a>
      </div>

      <p class="train-plan-note">No streaks, XP, or random filler. Every question in this session has a reason.</p>
    </section>`;

  document.getElementById("start-training").addEventListener("click", () => {
    currentIndex = 0;
    results.length = 0;
    renderQuestion();
  });
}

function renderQuestion() {
  const item = plan.items[currentIndex];
  if (!item) return renderComplete();
  const q = item.question;
  currentConfidence = null;
  openedAt = Date.now();
  setHeaderProgress(`${currentIndex + 1} / ${plan.items.length}`);

  const hasPassage = Boolean(item.module.passage);
  trainView.innerHTML = `
    <div class="train-session-shell">
      <div class="train-session-topline">
        <span class="question-number">Question ${currentIndex + 1} of ${plan.items.length}</span>
        <details class="train-why">
          <summary>Why this question?</summary>
          <p>${escapeHtml(item.reason)}</p>
        </details>
      </div>

      <section class="study-workspace ${hasPassage ? "" : "no-passage"}">
        ${hasPassage ? passageHtml(item.module) : ""}
        <article class="question-panel train-question-panel">
          <div class="question-stage">
            <div class="question-topline">
              <span class="question-number">${escapeHtml(Learning.categoryLabel(item.module.category))}</span>
              <span class="question-detail">${escapeHtml(item.skillLabel)}</span>
            </div>
            <div class="q-prompt">${questionPromptHtml(q)}</div>
            <div id="train-answer-area"></div>
            ${confidenceHtml()}
            <div class="explanation-box" id="train-feedback"></div>
            <div id="train-mistake-reason"></div>
          </div>
          <div class="question-footer train-question-footer">
            <span class="train-footer-status" id="train-footer-status"></span>
            <div class="spacer"></div>
            <button class="btn" id="train-next" disabled>${currentIndex === plan.items.length - 1 ? "Finish session" : "Next"} &rarr;</button>
          </div>
        </article>
      </section>
    </div>`;

  setupConfidence();
  renderAnswerArea(item);
  document.getElementById("train-next").addEventListener("click", () => {
    currentIndex += 1;
    renderQuestion();
  });
}

function passageHtml(module) {
  return `
    <aside class="reading-panel" aria-label="Reading passage">
      <div class="panel-kicker"><span>Passage</span><span>${escapeHtml(module.title)}</span></div>
      <div class="reading-scroll"><div class="passage-text">${escapeHtml(module.passage)}</div></div>
      ${module.source ? `<div class="source-credit">${escapeHtml(module.source)}</div>` : ""}
    </aside>`;
}

function questionPromptHtml(q) {
  if (q.type === "grammar_edit") {
    return escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>');
  }
  return escapeHtml(q.prompt || "");
}

function confidenceHtml() {
  return `
    <div class="train-confidence" aria-label="Optional certainty before answering">
      <button type="button" data-confidence="sure">Sure</button>
      <button type="button" data-confidence="unsure">Unsure</button>
      <button type="button" data-confidence="guessing">Guessing</button>
    </div>`;
}

function setupConfidence() {
  document.querySelectorAll("[data-confidence]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentConfidence = btn.dataset.confidence;
      document.querySelectorAll("[data-confidence]").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
}

function renderAnswerArea(item) {
  const q = item.question;
  const area = document.getElementById("train-answer-area");

  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const groupName = `train-answer-${currentIndex}`;
    area.innerHTML = `<fieldset class="options-list" aria-label="Answer choices">${q.options.map((opt) => `
      <label class="answer-choice" data-opt="${escapeAttr(opt.id)}">
        <input class="answer-radio" type="radio" name="${escapeAttr(groupName)}" value="${escapeAttr(opt.id)}">
        <span class="choice-letter">${escapeHtml(opt.id.toUpperCase())}.</span>
        <span class="opt-text">${escapeHtml(opt.text)}</span>
      </label>`).join("")}</fieldset>`;

    area.querySelectorAll(".answer-radio").forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked || area.classList.contains("answer-locked")) return;
        gradeAnswer(item, radio.value, area);
      });
    });
    return;
  }

  if (q.type === "fill_blank") {
    area.innerHTML = `
      <label class="question-detail" for="train-short-answer">Your answer</label>
      <div class="train-short-row">
        <input id="train-short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer">
        <button class="btn" id="train-check-short">Check</button>
      </div>`;
    document.getElementById("train-check-short").addEventListener("click", () => {
      const input = document.getElementById("train-short-answer");
      if (!input.value.trim()) return;
      gradeAnswer(item, input.value.trim(), area);
      input.disabled = true;
      document.getElementById("train-check-short").disabled = true;
    });
  }
}

function gradeAnswer(item, answer, area) {
  const q = item.question;
  const correct = isCorrect(q, answer);
  const result = Learning.recordAttempt({
    module: { ...item.module, file: item.moduleFile },
    question: q,
    answer,
    correct,
    mode: "train",
    elapsedMs: Date.now() - openedAt,
    file: item.moduleFile,
    confidence: currentConfidence,
  });

  results.push({ item, answer, correct, result });
  if (Array.isArray(q.options)) revealChoices(area, q, answer);
  area.querySelectorAll("input, button").forEach((el) => { if (!el.matches('[data-confidence]')) el.disabled = true; });
  area.classList.add("answer-locked");
  const confidenceRow = document.querySelector(".train-confidence");
  if (confidenceRow) confidenceRow.hidden = true;

  renderFeedback(item, answer, correct, result);
  document.getElementById("train-next").disabled = false;
  document.getElementById("train-footer-status").textContent = correct ? "" : "Saved for review.";
}

function revealChoices(area, q, selectedId) {
  const correctIds = new Set(q.correct || []);
  area.querySelectorAll(".answer-choice").forEach((choice) => {
    const selected = choice.dataset.opt === selectedId;
    const correct = correctIds.has(choice.dataset.opt);
    choice.classList.toggle("selected", selected);
    choice.classList.toggle("correct", correct);
    choice.classList.toggle("incorrect", selected && !correct);
  });
}

function renderFeedback(item, answer, correct, learningResult) {
  const q = item.question;
  const feedback = document.getElementById("train-feedback");
  const correctOption = Array.isArray(q.options) ? q.options.find((opt) => (q.correct || []).includes(opt.id)) : null;
  const selectedOption = Array.isArray(q.options) ? q.options.find((opt) => opt.id === answer) : null;
  const whyWrong = !correct ? selectedOption?.whyWrong || genericDistractorReason(selectedOption?.distractorType) : "";
  const correctDisplay = correctOption ? `${correctOption.id.toUpperCase()}. ${correctOption.text}` : typeof q.correct === "string" ? q.correct : "";
  const selectedDisplay = selectedOption ? `${selectedOption.id.toUpperCase()}. ${selectedOption.text}` : "";
  const evidence = q.evidenceExcerpt || q.evidence || "";

  const breakdown = [
    !correct && whyWrong ? `
      <div class="answer-breakdown-row">
        <span>Your answer</span>
        <p>${selectedDisplay ? `<strong>${escapeHtml(selectedDisplay)}</strong> — ` : ""}${escapeHtml(whyWrong)}</p>
      </div>` : "",
    evidence ? `
      <div class="answer-breakdown-row">
        <span>Evidence</span>
        <p>${escapeHtml(evidence)}</p>
      </div>` : "",
    q.rule ? `
      <div class="answer-breakdown-row">
        <span>Tip</span>
        <p>${escapeHtml(q.rule)}</p>
      </div>` : "",
  ].filter(Boolean).join("");

  feedback.innerHTML = `
    <div class="answer-review ${correct ? "is-right" : "is-wrong"}">
      <div class="answer-review-head">
        <strong>${correct ? "Correct" : "Not quite"}</strong>
        ${!correct && correctDisplay ? `<span>Correct answer: ${escapeHtml(correctDisplay)}</span>` : ""}
      </div>
      ${q.explanation ? `<p class="answer-review-why"><span>Why</span>${escapeHtml(q.explanation)}</p>` : ""}
      ${breakdown ? `
        <details class="answer-breakdown">
          <summary>See answer breakdown</summary>
          <div class="answer-breakdown-body">${breakdown}</div>
        </details>` : ""}
    </div>`;
  feedback.classList.add("visible");

  const reasonMount = document.getElementById("train-mistake-reason");
  if (!correct && learningResult?.mistake) {
    reasonMount.innerHTML = `
      <details class="mistake-reason visible">
        <summary>Why did I miss this? <span>Optional</span></summary>
        <div class="mistake-reason-options">
          ${[
            ["misread", "Misread the question"],
            ["evidence", "Couldn't find the evidence"],
            ["two_choices", "Between two answers"],
            ["guess", "Guessed"],
            ["careless", "Careless mistake"],
          ].map(([id, label]) => `<button type="button" class="mistake-reason-btn" data-reason="${id}">${label}</button>`).join("")}
        </div>
      </details>`;
    reasonMount.querySelectorAll("[data-reason]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Learning.setMistakeReason(learningResult.mistake.questionKey, btn.dataset.reason);
        reasonMount.querySelectorAll("[data-reason]").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });
  }
}
function renderComplete() {
  setHeaderProgress("Complete");
  const correct = results.filter((r) => r.correct).length;
  const skills = [...new Set(results.map((r) => r.item.skillLabel))];
  const transferCount = results.filter((r) => r.item.reasonType === "transfer").length;
  const summary = Learning.getSummary();

  trainView.innerHTML = `
    <section class="train-complete">
      <div class="train-plan-eyebrow">Session complete</div>
      <h1>${correct} of ${results.length} correct</h1>
      <p class="lede">The useful part is what happens next: review timing and skill signals were updated from this session.</p>

      <div class="train-complete-grid">
        <div><strong>${skills.length}</strong><span>skills touched</span></div>
        <div><strong>${transferCount}</strong><span>transfer questions</span></div>
        <div><strong>${summary.dueReviews}</strong><span>reviews due now</span></div>
      </div>

      <div class="train-complete-skills">
        <span>Worked on</span>
        <p>${skills.map(escapeHtml).join(" · ")}</p>
      </div>

      <div class="train-plan-actions">
        <a class="btn" href="progress.html">View what changed</a>
        <button class="btn secondary" id="train-again">Build another session</button>
      </div>
    </section>`;

  document.getElementById("train-again").addEventListener("click", async () => {
    plan = Learning.buildTrainingPlan(catalog, { limit: 8 });
    currentIndex = 0;
    results.length = 0;
    renderPlan();
  });
}

function countReasons(items) {
  const labels = {
    transfer: "Fresh questions for previous misses",
    due: "Spaced reviews due",
    mistake: "Recent mistakes",
    misconception: "Possible misconceptions",
    weak: "Weaker skills",
    building: "Skills still building",
    baseline: "Baseline questions",
    maintenance: "Maintenance",
  };
  const counts = {};
  items.forEach((item) => { counts[item.reasonType] = (counts[item.reasonType] || 0) + 1; });
  return Object.entries(counts).map(([id, count]) => ({ id, count, label: labels[id] || "Training questions" }));
}

function isCorrect(q, answer) {
  if (Array.isArray(q.correct)) return q.correct.includes(answer);
  if (typeof q.correct === "string") return String(answer).trim().toLowerCase() === q.correct.trim().toLowerCase();
  return false;
}

function genericDistractorReason(type) {
  return {
    mentioned_not_supported: "This idea is mentioned, but it does not directly support what the question asks.",
    too_broad: "This answer goes beyond what the text actually supports.",
    too_narrow: "This answer focuses on one detail and misses the larger point.",
    opposite_claim: "This answer conflicts with a detail in the passage.",
    unsupported_motive: "This adds a motive the passage never gives.",
    unsupported_emotion: "This adds an emotion the passage never shows.",
    background_only: "This is background information rather than direct evidence for the claim.",
    location_homophone: "This word refers to a place, not the grammatical form needed here.",
    contraction_homophone: "This is a contraction and does not fit the grammatical job needed here.",
    possessive_pronoun_form: "This possessive form stands alone; the sentence needs a form directly before a noun.",
  }[type] || "It sounds possible, but it does not best satisfy the exact question.";
}

function setHeaderProgress(text) {
  if (trainHeaderProgress) trainHeaderProgress.textContent = text;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
