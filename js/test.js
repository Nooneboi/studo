/*
  test.js — Studo timed test workspace (v2)
  ------------------------------------------
  A single-question test interface that keeps the relevant passage beside the
  question. Test answers stay in memory for the current sitting. Question keys
  combine module + question IDs, preventing collisions when multiple modules
  contain q1/q2/etc.
*/

const CATEGORY_LABELS = {
  reading: "Reading",
  writing: "Writing and Analysis",
  language_conventions: "Language Conventions",
  all: "Full RLA",
};

const viewEl = document.getElementById("test-view");
let items = []; // [{ module, question, moduleQuestionIndex }]
let answers = {};
let currentIndex = 0;
let remainingSeconds = 0;
let autoSeconds = 0;
let timerMode = "auto";
let timerHandle = null;
let submitted = false;
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

  renderShell();
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

function renderShell() {
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

  viewEl.innerHTML = `
    <div class="study-shell">
      <section class="study-heading" aria-labelledby="test-heading">
        <div>
          <h1 id="test-heading">${escapeHtml(testLabel)} Test</h1>
          <p class="lede">Work through one question at a time. Answers and explanations stay hidden until you submit.</p>
        </div>
        <div class="study-meta">
          <div class="study-progress" aria-label="Test progress">
            <div class="study-progress-row"><span id="progress-label">Question 1 of ${items.length}</span><span id="answered-label">0 answered</span></div>
            <div class="study-progress-track" aria-hidden="true"><div class="study-progress-fill" id="progress-fill"></div></div>
          </div>
        </div>
      </section>

      <div id="results-mount"></div>

      <div class="study-actions">
        <div class="test-timer-bar" id="timer-bar" aria-live="polite">
          <span>Time remaining</span><span class="clock" id="clock"></span>
        </div>
        <div class="spacer"></div>
        <span class="study-status" id="test-status" aria-live="polite"></span>
        <button id="submit-btn" class="btn">Submit test</button>
      </div>

      <section class="study-workspace" id="study-workspace">
        <div id="passage-mount"></div>
        <article class="question-panel" aria-label="Test question">
          <div id="question-stage" class="question-stage"></div>
          <div class="question-footer" id="question-footer"></div>
        </article>
      </section>
    </div>
  `;

  document.getElementById("submit-btn").addEventListener("click", () => submitTest(false));
}

function renderCurrentQuestion() {
  currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  const item = items[currentIndex];
  const q = item.question;
  const key = answerKey(item);
  const savedAnswer = answers[key];
  const hasPassage = Boolean(item.module.passage);
  const workspace = document.getElementById("study-workspace");
  workspace.classList.toggle("no-passage", !hasPassage);
  renderPassage(item.module);

  const promptHtml = q.type === "grammar_edit"
    ? escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>')
    : escapeHtml(q.prompt || "");

  const stage = document.getElementById("question-stage");
  stage.innerHTML = `
    <div class="question-topline">
      <span class="question-number">Question ${currentIndex + 1} of ${items.length}</span>
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
    <button class="btn ghost" id="prev-question" ${currentIndex === 0 ? "disabled" : ""}>&larr; Previous</button>
    <div class="spacer"></div>
    <button class="btn" id="next-question">${currentIndex === items.length - 1 ? (submitted ? "Back to first" : "Review before submit") : "Next"} &rarr;</button>
  `;
  document.getElementById("prev-question").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderCurrentQuestion();
    }
  });
  document.getElementById("next-question").addEventListener("click", () => {
    if (currentIndex < items.length - 1) currentIndex += 1;
    else if (submitted) currentIndex = 0;
    else {
      setTestStatus("You're at the end. Review answers or submit when ready.");
      currentIndex = 0;
    }
    renderCurrentQuestion();
  });

  updateProgress();
  stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderPassage(module) {
  const mount = document.getElementById("passage-mount");
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
    container.innerHTML = `<div class="options-list" role="radiogroup" aria-label="Answer choices">${q.options
      .map((opt) => `<button type="button" class="option-btn${optionClass}" data-opt="${escapeAttr(opt.id)}" role="radio" aria-checked="${savedAnswer === opt.id ? "true" : "false"}" ${submitted ? "disabled" : ""}><span class="opt-letter">${escapeHtml(opt.id.toUpperCase())}</span><span class="opt-text">${escapeHtml(opt.text)}</span></button>`)
      .join("")}</div>`;

    container.querySelectorAll(".option-btn").forEach((btn) => {
      if (!submitted && savedAnswer === btn.dataset.opt) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (submitted) return;
        answers[key] = btn.dataset.opt;
        container.querySelectorAll(".option-btn").forEach((b) => {
          b.classList.toggle("selected", b === btn);
          b.setAttribute("aria-checked", String(b === btn));
        });
        updateProgress();
        setTestStatus("Answer saved for this attempt.");
      });
    });
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<label class="question-detail" for="test-short-answer">Your answer</label><input id="test-short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}" ${submitted ? "disabled" : ""}>`;
    const input = container.querySelector("input");
    input.addEventListener("input", () => {
      answers[key] = input.value;
      updateProgress();
    });
  } else {
    container.innerHTML = `<label class="question-detail" for="test-written-answer">Your response</label><textarea id="test-written-answer" class="open-ended-input" placeholder="Write your response…" ${submitted ? "disabled" : ""}>${escapeHtml(savedAnswer || "")}</textarea>`;
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
  const explanation = stage.querySelector('[data-role="explanation"]');
  if (explanation && explanation.textContent.trim()) explanation.classList.add("visible");

  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const correct = new Set(q.correct || []);
    stage.querySelectorAll(".option-btn").forEach((btn) => {
      const isSelected = btn.dataset.opt === answer;
      const isCorrect = correct.has(btn.dataset.opt);
      btn.classList.toggle("selected", isSelected);
      btn.classList.toggle("correct", isCorrect);
      btn.classList.toggle("incorrect", isSelected && !isCorrect);
      btn.setAttribute("aria-checked", String(isSelected));
    });
  }
}

function updateProgress() {
  const answered = items.filter((item) => hasAnswer(answers[answerKey(item)])).length;
  const progressLabel = document.getElementById("progress-label");
  const answeredLabel = document.getElementById("answered-label");
  const fill = document.getElementById("progress-fill");
  if (progressLabel) progressLabel.textContent = `Question ${currentIndex + 1} of ${items.length}`;
  if (answeredLabel) answeredLabel.textContent = `${answered} answered`;
  if (fill) fill.style.width = `${((currentIndex + 1) / items.length) * 100}%`;
}

function hasAnswer(value) {
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

const TIMER_LABELS = {
  auto: "Timed",
  "600": "10 min",
  "900": "15 min",
  "1200": "20 min",
  "1800": "30 min",
  none: "No timer",
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
      : TIMER_LABELS[timerMode] || "Timed";
    panel.querySelectorAll("[data-timer-value]").forEach((b) => b.classList.toggle("active", b.dataset.timerValue === timerMode));
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
    const bar = document.getElementById("timer-bar");
    if (timerMode === "none") bar.classList.add("hidden");
    else {
      bar.classList.remove("hidden", "low");
      updateClock();
      if (!submitted) startTimer();
    }
  }

  if (timerMode === "none") document.getElementById("timer-bar").classList.add("hidden");
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
  const bar = document.getElementById("timer-bar");
  if (!clock || !bar) return;
  const m = Math.max(0, Math.floor(remainingSeconds / 60));
  const s = Math.max(0, remainingSeconds % 60);
  clock.textContent = `${m}:${String(s).padStart(2, "0")}`;
  bar.classList.toggle("low", remainingSeconds <= 60 && remainingSeconds > 0);
}

function submitTest(timedOut = false) {
  if (submitted) return;
  const unanswered = items.filter((item) => !hasAnswer(answers[answerKey(item)])).length;
  if (!timedOut && unanswered) {
    const ok = confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Submit anyway?`);
    if (!ok) return;
  }

  submitted = true;
  clearInterval(timerHandle);
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitted";

  const result = scoreTest();
  const writtenCount = items.filter((item) => !isAutoGraded(item.question)).length;
  const resultsMount = document.getElementById("results-mount");
  resultsMount.innerHTML = `
    <div class="score-banner" role="status">
      <div>
        <div class="question-number">${timedOut ? "Time ended · auto-submitted" : "Test submitted"}</div>
        <div style="font-size:1.05rem; font-weight:700; margin-top:3px">Auto-graded score</div>
        ${writtenCount ? `<div style="font-size:.85rem; color:var(--color-ink-soft); margin-top:4px">${writtenCount} written response${writtenCount === 1 ? "" : "s"} excluded from this score and ready for self-review.</div>` : ""}
      </div>
      <div class="score-num" style="font-size:1.4rem; font-weight:700">${result.earned} / ${result.total}</div>
    </div>`;

  setTestStatus("Review mode: correct answers and explanations are now visible.");
  renderCurrentQuestion();
  resultsMount.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
