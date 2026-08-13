/*
  test.js
  -------
  Runs a timed test (test.html?subject=rla&category=reading|writing|
  language_conventions|all). Pulls every question from the matching
  modules, keeps their passages grouped together, and runs a single
  overall countdown instead of per-question timers. Explanations stay
  hidden until the test is submitted (or time runs out).

  Answers here are kept in memory only for this sitting — a timed
  test is meant to be a one-shot simulation, not something you'd
  expect to resume days later.
*/

const CATEGORY_LABELS = {
  reading: "Reading",
  writing: "Writing and Analysis",
  language_conventions: "Language Conventions",
  all: "Full RLA",
};

const viewEl = document.getElementById("test-view");
let sections = []; // [{ module, questions }]
let answers = {};
let remainingSeconds = 0;
let autoSeconds = 0; // the auto-computed duration, kept so "Auto" can be re-selected later
let timerMode = "auto"; // "auto" | seconds-as-string | "none"
let timerHandle = null;
let submitted = false;

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
  if (category !== "all") {
    modules = modules.filter((m) => (m.category || "reading") === category);
  }
  modules = modules.filter((m) => (m.questions || []).length);

  if (!modules.length) {
    viewEl.innerHTML = `<div class="empty-state">No questions available for this test. <a href="quiz.html">Back to Quiz</a></div>`;
    return;
  }

  sections = modules.map((m) => ({ module: m, questions: m.questions }));
  autoSeconds = sections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + (q.time || 30), 0),
    0
  );
  timerMode = localStorage.getItem("sq:timerMode") || "auto";
  remainingSeconds = secondsForMode(timerMode);

  renderShell(category);
  renderSections();
  if (timerMode !== "none") startTimer();
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

function renderShell(category) {
  const label = CATEGORY_LABELS[category] || "RLA";

  const titleEl = document.getElementById("focus-title");
  if (titleEl) titleEl.textContent = `${label} Test`;
  const exitLink = document.getElementById("focus-exit");
  if (exitLink) {
    exitLink.addEventListener("click", (e) => {
      if (!submitted) {
        const ok = confirm("Leave now and your answers on this attempt won't be saved. Leave anyway?");
        if (!ok) e.preventDefault();
      }
    });
  }

  viewEl.innerHTML = `
    <h1>${label} Test</h1>
    <p class="lede">Answer everything, then hit submit — your score and every explanation unlock right after.</p>

    <div id="results-mount"></div>

    <div class="test-timer-bar" id="timer-bar">
      <span>Time remaining</span>
      <span class="clock" id="clock"></span>
    </div>

    <div id="sections-mount"></div>

    <div style="text-align:right; margin-top:var(--space-4)">
      <button id="submit-btn" class="btn">Submit test</button>
    </div>
  `;
  document.getElementById("submit-btn").addEventListener("click", () => submitTest());
  setupTimerPicker();
}

const TIMER_LABELS = {
  auto: "Timed (auto)",
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

  function updateLabel() {
    label.textContent =
      timerMode === "custom" ? `${Math.round(secondsForMode("custom") / 60)} min` : TIMER_LABELS[timerMode] || "Timed (auto)";
    panel.querySelectorAll("[data-timer-value]").forEach((b) => {
      b.classList.toggle("active", b.dataset.timerValue === timerMode);
    });
  }
  updateLabel();

  btn.addEventListener("click", () => panel.classList.toggle("hidden"));
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      panel.classList.add("hidden");
    }
  });

  panel.querySelectorAll("[data-timer-value]").forEach((optBtn) => {
    optBtn.addEventListener("click", () => {
      timerMode = optBtn.dataset.timerValue;
      localStorage.setItem("sq:timerMode", timerMode);
      updateLabel();
      applyTimerMode();
      panel.classList.add("hidden");
    });
  });

  applyCustomBtn.addEventListener("click", applyCustom);
  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyCustom();
  });
  function applyCustom() {
    const minutes = parseInt(customInput.value, 10);
    if (minutes > 0) {
      localStorage.setItem("sq:customMinutes", minutes);
      timerMode = "custom";
      localStorage.setItem("sq:timerMode", timerMode);
      updateLabel();
      applyTimerMode();
      panel.classList.add("hidden");
    }
  }

  function applyTimerMode() {
    remainingSeconds = secondsForMode(timerMode);
    clearInterval(timerHandle);
    const bar = document.getElementById("timer-bar");
    if (timerMode === "none") {
      bar.classList.add("hidden");
    } else {
      bar.classList.remove("hidden");
      bar.classList.remove("low");
      updateClock();
      if (!submitted) startTimer();
    }
  }
  if (timerMode === "none") document.getElementById("timer-bar").classList.add("hidden");
}

function renderSections() {
  const mount = document.getElementById("sections-mount");
  mount.innerHTML = "";

  const wrapEl = document.querySelector(".focus-wrap");
  if (wrapEl) wrapEl.classList.toggle("has-passage", sections.some((s) => s.module.passage));

  sections.forEach((section) => {
    const hasPassage = !!section.module.passage;
    const container = document.createElement("div");
    container.style.marginBottom = "var(--space-4)";

    if (hasPassage) {
      container.className = "passage-split";
      container.innerHTML = `
        <div class="passage-pane">
          <div class="card">
            <h3>${escapeHtml(section.module.title)}</h3>
            <p class="passage-text">${escapeHtml(section.module.passage)}</p>
          </div>
        </div>
        <div class="questions-pane"><div class="card" id="q-holder-${section.module.id}"></div></div>
      `;
      mount.appendChild(container);
      const holder = container.querySelector(`#q-holder-${CSS.escape(section.module.id)}`);
      section.questions.forEach((q, i) => holder.appendChild(buildQuestionBlock(q, i)));
    } else {
      container.className = "card";
      container.innerHTML = `<h3 style="margin-bottom:4px">${escapeHtml(section.module.title)}</h3>`;
      section.questions.forEach((q, i) => container.appendChild(buildQuestionBlock(q, i)));
      mount.appendChild(container);
    }
  });
}

function buildQuestionBlock(q, index) {
  const block = document.createElement("div");
  block.className = "question-card test-question";
  block.style.borderTop = "1px solid var(--color-line)";
  block.style.paddingTop = "var(--space-3)";
  block.dataset.qid = q.id;

  const promptHtml =
    q.type === "grammar_edit"
      ? escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>')
      : escapeHtml(q.prompt);

  block.innerHTML = `
    <p class="q-prompt">${index + 1}. ${promptHtml}</p>
    <div data-role="answer-area"></div>
    <div class="explanation-box" data-role="explanation">${escapeHtml(q.explanation || "")}</div>
  `;

  renderAnswerArea(q, block.querySelector('[data-role="answer-area"]'));
  return block;
}

function renderAnswerArea(q, container) {
  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const optionClass = q.type === "evidence_based" ? " evidence-option" : "";
    container.innerHTML = `<div class="options-list">${q.options
      .map((opt) => `<button class="option-btn${optionClass}" data-opt="${opt.id}"><span class="opt-radio"></span><span class="opt-letter">${opt.id.toUpperCase()}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></button>`)
      .join("")}</div>`;
    container.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (submitted) return;
        answers[q.id] = btn.dataset.opt;
        container.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<input type="text" class="fill-blank-input" placeholder="Type your answer">`;
    container.querySelector("input").addEventListener("input", (e) => {
      answers[q.id] = e.target.value;
    });
  } else {
    container.innerHTML = `<textarea class="open-ended-input" placeholder="Write your response"></textarea>`;
    container.querySelector("textarea").addEventListener("input", (e) => {
      answers[q.id] = e.target.value;
    });
  }
}

function startTimer() {
  updateClock();
  timerHandle = setInterval(() => {
    remainingSeconds -= 1;
    updateClock();
    if (remainingSeconds <= 0) {
      submitTest(true);
    }
  }, 1000);
}

function updateClock() {
  const clock = document.getElementById("clock");
  const bar = document.getElementById("timer-bar");
  if (!clock) return;
  const m = Math.max(0, Math.floor(remainingSeconds / 60));
  const s = Math.max(0, remainingSeconds % 60);
  clock.textContent = `${m}:${String(s).padStart(2, "0")}`;
  if (remainingSeconds <= 30) bar.classList.add("low");
}

function submitTest(timedOut) {
  if (submitted) return;
  submitted = true;
  clearInterval(timerHandle);

  document.querySelectorAll(".test-question").forEach((el) => el.classList.add("locked"));
  document.querySelectorAll(".explanation-box").forEach((el) => {
    if (el.textContent.trim()) el.classList.add("visible");
  });
  document.querySelectorAll(".option-btn").forEach((btn) => {
    const qid = btn.closest(".test-question").dataset.qid;
    const q = findQuestion(qid);
    const isCorrect = (q.correct || []).includes(btn.dataset.opt);
    if (btn.dataset.opt === answers[qid]) btn.classList.add(isCorrect ? "correct" : "incorrect");
    else if (isCorrect) btn.classList.add("correct");
  });
  document.getElementById("submit-btn").setAttribute("disabled", "true");

  const { earned, total } = scoreTest();
  const resultsMount = document.getElementById("results-mount");
  resultsMount.innerHTML = `
    <div class="results-banner">
      <div>
        <div style="font-family:var(--font-mono); font-size:.75rem; text-transform:uppercase; opacity:.7">
          ${timedOut ? "Time's up — auto-submitted" : "Submitted"}
        </div>
        <div style="font-size:1.1rem; font-weight:600">Your results</div>
      </div>
      <div class="score-num">${earned} / ${total}</div>
    </div>
  `;
  resultsMount.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findQuestion(qid) {
  for (const section of sections) {
    const q = section.questions.find((q) => q.id === qid);
    if (q) return q;
  }
  return null;
}

function scoreTest() {
  const autoGraded = ["multiple_choice", "evidence_based", "grammar_edit"];
  let earned = 0,
    total = 0;
  sections.forEach((section) => {
    section.questions.forEach((q) => {
      total += q.points || 1;
      if (autoGraded.includes(q.type) && answers[q.id] && (q.correct || []).includes(answers[q.id])) {
        earned += q.points || 1;
      }
    });
  });
  return { earned, total };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
