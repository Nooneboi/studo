/*
  test.js — Studo timed test workspace (v3)
  ------------------------------------------
  Focused single-question exam flow with:
  - one compact app bar for title, progress, timer, tools, and submit
  - passage/question split when needed
  - review screen before submission
  - unique question keys across modules
  - written responses excluded from auto-graded totals
*/

const CATEGORY_LABELS = {
  reading: "Reading",
  writing: "Writing and Analysis",
  language_conventions: "Language Conventions",
  all: "Full RLA",
};

const viewEl = document.getElementById("test-view");
let items = [];
let answers = {};
let currentIndex = 0;
let remainingSeconds = 0;
let autoSeconds = 0;
let timerMode = "auto";
let timerHandle = null;
let submitted = false;
let reviewing = false;
let testLabel = "RLA";

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || "rla";
  const category = params.get("category") || "all";

  if (subject !== "rla") {
    viewEl.innerHTML = `<div class="empty-state">This subject is coming soon. <a href="quiz.html">Back to Quiz</a></div>`;
    return;
  }

  let modules;
  try {
    modules = (await Data.loadAllQuizzes()).filter((m) => (m.subject || "rla") === "rla");
  } catch (e) {
    viewEl.innerHTML = `<div class="empty-state">Couldn't load the test. <a href="quiz.html">Back to Quiz</a></div>`;
    return;
  }

  if (category !== "all") modules = modules.filter((m) => (m.category || "reading") === category);
  modules = modules.filter((m) => (m.questions || []).length);

  items = modules.flatMap((module) =>
    module.questions.map((question, moduleQuestionIndex) => ({ module, question, moduleQuestionIndex }))
  );

  if (!items.length) {
    viewEl.innerHTML = `<div class="empty-state">No questions available for this test. <a href="quiz.html">Back to Quiz</a></div>`;
    return;
  }

  testLabel = CATEGORY_LABELS[category] || "RLA";
  autoSeconds = items.reduce((sum, item) => sum + (item.question.time || 30), 0);
  timerMode = localStorage.getItem("sq:timerMode") || "auto";
  remainingSeconds = secondsForMode(timerMode);

  setupShell();
  renderCurrentQuestion();
  setupTimerPicker();
  if (timerMode !== "none") startTimer();
}

function answerKey(item) {
  return `${item.module.id}:${item.question.id}`;
}

function secondsForMode(mode) {
  if (mode === "none") return 0;
  if (mode === "auto") return autoSeconds;
  if (mode === "custom") {
    const saved = parseInt(localStorage.getItem("sq:customMinutes"), 10);
    return (isNaN(saved) || saved <= 0 ? 20 : saved) * 60;
  }
  const n = parseInt(mode, 10);
  return isNaN(n) ? autoSeconds : n;
}

function setupShell() {
  const titleEl = document.getElementById("focus-title");
  if (titleEl) titleEl.textContent = `${testLabel} Test`;

  const exitLink = document.getElementById("focus-exit");
  if (exitLink) {
    exitLink.addEventListener("click", (e) => {
      if (!submitted && Object.keys(answers).length) {
        const ok = confirm("Leave this test? Your answers from this attempt won't be saved.");
        if (!ok) e.preventDefault();
      }
    });
  }

  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) submitBtn.addEventListener("click", () => submitTest(false));
}

function renderWorkspaceShell(hasPassage) {
  viewEl.innerHTML = `
    <section class="study-workspace${hasPassage ? "" : " no-passage"}" id="study-workspace">
      <div id="passage-mount"></div>
      <article class="question-panel" aria-label="Test question">
        <div id="question-stage" class="question-stage"></div>
        <div class="question-footer" id="question-footer"></div>
      </article>
    </section>
  `;
}

function renderCurrentQuestion() {
  reviewing = false;
  currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  const item = items[currentIndex];
  const q = item.question;
  const key = answerKey(item);
  const savedAnswer = answers[key];
  const hasPassage = Boolean(item.module.passage);

  renderWorkspaceShell(hasPassage);
  renderPassage(item.module);

  const promptHtml = q.type === "grammar_edit"
    ? escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>')
    : escapeHtml(q.prompt || "");

  const stage = document.getElementById("question-stage");
  stage.innerHTML = `
    <div class="question-topline">
      <span class="question-number">Question ${currentIndex + 1}</span>
      <span class="question-detail">${escapeHtml(questionDetail(item))}</span>
    </div>
    <div class="q-prompt">${promptHtml}</div>
    <div data-role="answer-area"></div>
    <div class="explanation-box" data-role="explanation">${escapeHtml(q.explanation || "")}</div>
    ${submitted && !isAutoGraded(q) ? `<div class="review-note">This response is not auto-graded. Use the explanation as a self-review checklist.</div>` : ""}
  `;

  renderAnswerArea(item, stage.querySelector('[data-role="answer-area"]'), savedAnswer);
  if (submitted) revealReview(item);

  const footer = document.getElementById("question-footer");
  footer.innerHTML = `
    <button class="question-nav-btn secondary" id="prev-question" ${currentIndex === 0 ? "disabled" : ""}>&larr; Previous</button>
    <span class="question-footer-position">${currentIndex + 1} / ${items.length}</span>
    <button class="question-nav-btn primary" id="next-question">${currentIndex === items.length - 1 ? (submitted ? "Back to first" : "Review answers") : "Next"} &rarr;</button>
  `;

  document.getElementById("prev-question").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderCurrentQuestion();
    }
  });

  document.getElementById("next-question").addEventListener("click", () => {
    if (currentIndex < items.length - 1) {
      currentIndex += 1;
      renderCurrentQuestion();
    } else if (submitted) {
      currentIndex = 0;
      renderCurrentQuestion();
    } else {
      renderReviewScreen();
    }
  });

  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderReviewScreen() {
  reviewing = true;
  const answeredCount = getAnsweredCount();
  const firstUnanswered = items.findIndex((item) => !hasAnswer(answers[answerKey(item)]));

  viewEl.innerHTML = `
    <section class="test-review" aria-labelledby="review-heading">
      <div class="test-review-head">
        <span class="question-number">Review</span>
        <h1 id="review-heading">Check your answers</h1>
        <p>${answeredCount} of ${items.length} answered${firstUnanswered >= 0 ? ". Unanswered questions are marked below." : ". Everything has an answer."}</p>
      </div>

      <div class="test-review-list">
        ${items.map((item, index) => {
          const answered = hasAnswer(answers[answerKey(item)]);
          return `
            <button type="button" class="review-question-row${answered ? " answered" : " unanswered"}" data-review-index="${index}">
              <span class="review-question-number">${index + 1}</span>
              <span class="review-question-copy">
                <strong>${escapeHtml(item.module.topic || item.module.title || `Question ${index + 1}`)}</strong>
                <span>${answered ? "Answered" : "Not answered"}</span>
              </span>
              <span class="review-question-arrow" aria-hidden="true">&rarr;</span>
            </button>`;
        }).join("")}
      </div>

      <div class="test-review-actions">
        <button type="button" class="question-nav-btn secondary" id="review-back-btn">Back to questions</button>
        ${firstUnanswered >= 0 ? `<button type="button" class="question-nav-btn secondary" id="first-unanswered-btn">Go to first unanswered</button>` : ""}
        <button type="button" class="question-nav-btn primary" id="review-submit-btn">Submit test</button>
      </div>
    </section>
  `;

  viewEl.querySelectorAll("[data-review-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentIndex = Number(btn.dataset.reviewIndex);
      renderCurrentQuestion();
    });
  });

  document.getElementById("review-back-btn").addEventListener("click", () => renderCurrentQuestion());
  const firstBtn = document.getElementById("first-unanswered-btn");
  if (firstBtn) {
    firstBtn.addEventListener("click", () => {
      currentIndex = firstUnanswered;
      renderCurrentQuestion();
    });
  }
  document.getElementById("review-submit-btn").addEventListener("click", () => submitTest(false));

  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPassage(module) {
  const mount = document.getElementById("passage-mount");
  if (!mount) return;
  if (!module.passage) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = `
    <aside class="reading-panel" aria-label="Reading passage">
      <div class="panel-kicker"><span>Passage</span><span>${escapeHtml(module.title)}</span></div>
      <div class="reading-scroll"><div class="passage-text">${escapeHtml(module.passage)}</div></div>
      ${module.source ? `<div class="source-credit">${escapeHtml(module.source)}</div>` : ""}
    </aside>`;
}

function questionDetail(item) {
  const q = item.question;
  const parts = [];
  if (item.module.topic) parts.push(item.module.topic);
  if (q.points) parts.push(`${q.points} ${q.points === 1 ? "point" : "points"}`);
  return parts.join(" · ");
}

function renderAnswerArea(item, container, savedAnswer) {
  const q = item.question;
  const key = answerKey(item);

  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const optionClass = q.type === "evidence_based" ? " evidence-option" : "";
    const groupName = `test-answer-${currentIndex}`;
    container.innerHTML = `<fieldset class="options-list" aria-label="Answer choices">${q.options
      .map((opt) => `<label class="answer-choice${optionClass}" data-opt="${escapeAttr(opt.id)}"><input class="answer-radio" type="radio" name="${groupName}" value="${escapeAttr(opt.id)}" ${savedAnswer === opt.id ? "checked" : ""} ${submitted ? "disabled" : ""}><span class="choice-letter">${escapeHtml(opt.id.toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`)
      .join("")}</fieldset>`;

    container.querySelectorAll(".answer-radio").forEach((radio) => {
      radio.addEventListener("change", () => {
        if (submitted || !radio.checked) return;
        answers[key] = radio.value;
        updateProgress();
      });
    });
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<label class="question-detail answer-label" for="test-short-answer">Your answer</label><input id="test-short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}" ${submitted ? "disabled" : ""}>`;
    const input = container.querySelector("input");
    input.addEventListener("input", () => {
      answers[key] = input.value;
      updateProgress();
    });
  } else {
    container.innerHTML = `<label class="question-detail answer-label" for="test-written-answer">Your response</label><textarea id="test-written-answer" class="open-ended-input" placeholder="Write your response…" ${submitted ? "disabled" : ""}>${escapeHtml(savedAnswer || "")}</textarea>`;
    const ta = container.querySelector("textarea");
    ta.addEventListener("input", () => {
      answers[key] = ta.value;
      updateProgress();
    });
  }
}

function revealReview(item) {
  const q = item.question;
  const key = answerKey(item);
  const answer = answers[key];
  const stage = document.getElementById("question-stage");
  if (!stage) return;

  const explanation = stage.querySelector('[data-role="explanation"]');
  if (explanation && explanation.textContent.trim()) explanation.classList.add("visible");

  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const correct = new Set(q.correct || []);
    stage.querySelectorAll(".answer-choice").forEach((choice) => {
      const isSelected = choice.dataset.opt === answer;
      const isCorrect = correct.has(choice.dataset.opt);
      choice.classList.toggle("selected", isSelected);
      choice.classList.toggle("correct", isCorrect);
      choice.classList.toggle("incorrect", isSelected && !isCorrect);
      const radio = choice.querySelector(".answer-radio");
      if (radio) radio.checked = isSelected;
    });
  }
}

function getAnsweredCount() {
  return items.filter((item) => hasAnswer(answers[answerKey(item)])).length;
}

function updateProgress() {
  const answered = getAnsweredCount();
  const progressLabel = document.getElementById("progress-label");
  const answeredLabel = document.getElementById("answered-label");
  const fill = document.getElementById("progress-fill");
  const submitBtn = document.getElementById("submit-btn");

  if (progressLabel) progressLabel.textContent = reviewing ? "Review" : `Question ${currentIndex + 1} of ${items.length}`;
  if (answeredLabel) answeredLabel.textContent = `${answered} answered`;
  if (fill) fill.style.width = `${reviewing ? 100 : ((currentIndex + 1) / items.length) * 100}%`;
  if (submitBtn && !submitted) submitBtn.classList.toggle("ready", answered === items.length);
}

function hasAnswer(value) {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

const TIMER_LABELS = {
  auto: "Auto",
  "600": "10 min",
  "900": "15 min",
  "1200": "20 min",
  "1800": "30 min",
  none: "Untimed",
};

function setupTimerPicker() {
  const btn = document.getElementById("timer-picker-btn");
  const panel = document.getElementById("timer-picker-panel");
  const label = document.getElementById("timer-picker-label");
  const customInput = document.getElementById("custom-minutes-input");
  const applyCustomBtn = document.getElementById("apply-custom-timer");
  if (!btn || !panel || !label) return;

  function updateLabel() {
    label.textContent = timerMode === "custom"
      ? `${Math.round(secondsForMode("custom") / 60)} min`
      : TIMER_LABELS[timerMode] || "Auto";
    panel.querySelectorAll("[data-timer-value]").forEach((b) => b.classList.toggle("active", b.dataset.timerValue === timerMode));
    btn.classList.toggle("untimed", timerMode === "none");
  }

  function closePanel() {
    panel.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
  }

  updateLabel();
  btn.addEventListener("click", () => {
    const willOpen = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !btn.contains(e.target)) closePanel();
  });

  panel.querySelectorAll("[data-timer-value]").forEach((optBtn) => {
    optBtn.addEventListener("click", () => {
      timerMode = optBtn.dataset.timerValue;
      localStorage.setItem("sq:timerMode", timerMode);
      updateLabel();
      applyTimerMode();
      closePanel();
    });
  });

  applyCustomBtn.addEventListener("click", applyCustom);
  customInput.addEventListener("keydown", (e) => { if (e.key === "Enter") applyCustom(); });

  function applyCustom() {
    const minutes = parseInt(customInput.value, 10);
    if (minutes > 0) {
      localStorage.setItem("sq:customMinutes", minutes);
      timerMode = "custom";
      localStorage.setItem("sq:timerMode", timerMode);
      updateLabel();
      applyTimerMode();
      closePanel();
    }
  }

  function applyTimerMode() {
    remainingSeconds = secondsForMode(timerMode);
    clearInterval(timerHandle);
    btn.classList.remove("low");
    updateClock();
    if (!submitted && timerMode !== "none") startTimer();
  }

  updateClock();
}

function startTimer() {
  clearInterval(timerHandle);
  updateClock();
  timerHandle = setInterval(() => {
    remainingSeconds -= 1;
    updateClock();
    if (remainingSeconds <= 0) submitTest(true);
  }, 1000);
}

function updateClock() {
  const clock = document.getElementById("clock");
  const control = document.getElementById("timer-picker-btn");
  if (!clock || !control) return;

  if (timerMode === "none") {
    clock.textContent = "";
    control.classList.remove("low");
    return;
  }

  const m = Math.max(0, Math.floor(remainingSeconds / 60));
  const s = Math.max(0, remainingSeconds % 60);
  clock.textContent = `${m}:${String(s).padStart(2, "0")}`;
  control.classList.toggle("low", remainingSeconds <= 60 && remainingSeconds > 0);
}

function submitTest(timedOut = false) {
  if (submitted) return;
  const unanswered = items.filter((item) => !hasAnswer(answers[answerKey(item)])).length;
  if (!timedOut && unanswered) {
    const ok = confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Submit anyway?`);
    if (!ok) return;
  }

  submitted = true;
  reviewing = false;
  clearInterval(timerHandle);

  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitted";
  }

  const result = scoreTest();
  const writtenCount = items.filter((item) => !isAutoGraded(item.question)).length;
  const resultsMount = document.getElementById("results-mount");
  resultsMount.innerHTML = `
    <div class="score-banner" role="status">
      <div>
        <div class="question-number">${timedOut ? "Time ended · auto-submitted" : "Test submitted"}</div>
        <div class="score-title">Auto-graded score</div>
        ${writtenCount ? `<div class="score-note">${writtenCount} written response${writtenCount === 1 ? "" : "s"} excluded from this score and ready for self-review.</div>` : ""}
      </div>
      <div class="score-num">${result.earned} / ${result.total}</div>
    </div>`;

  renderCurrentQuestion();
  setTestStatus("Review mode: correct answers and explanations are visible.");
}

function scoreTest() {
  let earned = 0;
  let total = 0;
  items.forEach((item) => {
    const q = item.question;
    if (!isAutoGraded(q)) return;
    const points = q.points || 1;
    total += points;
    if (isCorrectAnswer(q, answers[answerKey(item)])) earned += points;
  });
  return { earned, total };
}

function isAutoGraded(q) {
  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) return true;
  return q.type === "fill_blank" && typeof q.correct === "string";
}

function isCorrectAnswer(q, answer) {
  if (!hasAnswer(answer)) return false;
  if (Array.isArray(q.correct)) return q.correct.includes(answer);
  if (typeof q.correct === "string") return String(answer).trim().toLowerCase() === q.correct.trim().toLowerCase();
  return false;
}

function setTestStatus(message) {
  const el = document.getElementById("test-status");
  if (!el) return;
  el.textContent = message;
  clearTimeout(setTestStatus._timer);
  if (!submitted) setTestStatus._timer = setTimeout(() => { el.textContent = ""; }, 2200);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
