/*
  quiz.js
  -------
  Runs the quiz page:
   1. Loads data/index.json to list available quizzes.
   2. When a quiz is picked, loads its JSON file and renders questions.
   3. Handles answering, scoring, per-question timers, explanations.
   4. Handles learner controls: delete question, change answer,
      highlight text, and per-question notes — all saved locally
      via storage.js (nothing leaves the learner's browser).
*/

const quizListEl = document.getElementById("quiz-list");
const quizViewEl = document.getElementById("quiz-view");
const pickerViewEl = document.getElementById("picker-view");

let currentQuiz = null;
let notesModeOn = false;
let timers = {}; // questionId -> interval id

init();

async function init() {
  try {
    const res = await fetch("data/index.json");
    const list = await res.json();
    await renderPicker(list);
  } catch (e) {
    quizListEl.innerHTML = `<p>Couldn't load the quiz list. Make sure data/index.json exists.</p>`;
  }

  const params = new URLSearchParams(window.location.search);
  const quizFile = params.get("quiz");
  if (quizFile) loadQuiz(quizFile);
}

const HUES = ["teal", "amber", "coral", "plum"];

async function renderPicker(list) {
  if (!list.length) {
    quizListEl.innerHTML = `<div class="empty-state">No quizzes yet. Add one from the Builder page.</div>`;
    return;
  }

  // Pull each quiz file so cards can show a real question count and
  // time estimate, and whether the learner already has progress saved.
  const cards = await Promise.all(
    list.map(async (entry, i) => {
      let questionCount = "?";
      let minutes = null;
      try {
        const res = await fetch(`data/${entry.file}`);
        const quiz = await res.json();
        questionCount = quiz.questions?.length ?? "?";
        const totalSeconds = (quiz.questions || []).reduce((sum, q) => sum + (q.time || 30), 0);
        minutes = Math.max(1, Math.round(totalSeconds / 60));
      } catch (e) {
        /* fall back to unknowns if a quiz file is missing/broken */
      }
      const quizId = entry.file.replace(/\.json$/, "");
      const hasProgress = Object.keys(Store.getAnswers(quizId)).length > 0;
      const hue = HUES[i % HUES.length];

      return `
        <div class="quiz-card hue-${hue}">
          <div class="emblem">&#9670;</div>
          <h3>${escapeHtml(entry.title)}</h3>
          <p class="desc">${escapeHtml(entry.description || "")}</p>
          <div class="meta-row">
            <span class="tag">${questionCount} question${questionCount === 1 ? "" : "s"}</span>
            ${minutes ? `<span class="tag">~${minutes} min</span>` : ""}
            ${hasProgress ? `<span class="tag">In progress</span>` : ""}
          </div>
          <div class="cta-row">
            <a class="btn small" href="?quiz=${encodeURIComponent(entry.file)}">${hasProgress ? "Continue" : "Start"}</a>
          </div>
        </div>`;
    })
  );

  quizListEl.innerHTML = cards.join("");
}

async function loadQuiz(file) {
  try {
    const res = await fetch(`data/${file}`);
    currentQuiz = await res.json();
  } catch (e) {
    quizViewEl.innerHTML = `<p>Couldn't load that quiz (${escapeHtml(file)}).</p>`;
    quizViewEl.classList.remove("hidden");
    pickerViewEl.classList.add("hidden");
    return;
  }
  pickerViewEl.classList.add("hidden");
  quizViewEl.classList.remove("hidden");
  renderQuiz();
}

function renderQuiz() {
  const deleted = new Set(Store.getDeleted(currentQuiz.id));
  const answers = Store.getAnswers(currentQuiz.id);
  const notes = Store.getNotes(currentQuiz.id);
  const highlights = Store.getHighlights(currentQuiz.id);

  const passageHtml = currentQuiz.passage
    ? `<div class="card" style="margin-bottom:var(--space-4)"><h3>Passage</h3><p>${escapeHtml(
        currentQuiz.passage
      )}</p></div>`
    : "";

  quizViewEl.innerHTML = `
    <a href="quiz.html" class="btn ghost small" style="margin-bottom:var(--space-4)">&larr; All quizzes</a>
    <h1>${escapeHtml(currentQuiz.title)}</h1>
    <p class="lede">${escapeHtml(currentQuiz.description || "")}</p>

    <div class="toolbar">
      <button id="notes-toggle" class="btn ghost small toggle-btn">Note mode: off</button>
      <button id="reset-btn" class="btn ghost small">Reset my progress</button>
      <div class="spacer"></div>
      <span id="score-pill" class="tag"></span>
    </div>

    ${passageHtml}
    <div id="question-list"></div>
  `;

  document.getElementById("notes-toggle").addEventListener("click", () => {
    notesModeOn = !notesModeOn;
    document.getElementById("notes-toggle").textContent = `Note mode: ${notesModeOn ? "on" : "off"}`;
    document.getElementById("notes-toggle").classList.toggle("active", notesModeOn);
    document.querySelectorAll(".notes-panel").forEach((p) => p.classList.toggle("visible", notesModeOn));
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Clear your answers, notes, highlights, and deleted questions for this quiz?")) {
      Store.resetQuiz(currentQuiz.id);
      renderQuiz();
    }
  });

  const listEl = document.getElementById("question-list");
  currentQuiz.questions.forEach((q, i) => {
    const card = buildQuestionCard(q, i, deleted.has(q.id), answers[q.id], notes[q.id], highlights[q.id]);
    listEl.appendChild(card);
  });

  updateScorePill();
}

function buildQuestionCard(q, index, isDeleted, savedAnswer, savedNote, savedHighlightHtml) {
  const card = document.createElement("div");
  card.className = "card question-card" + (isDeleted ? " is-deleted" : "");
  card.dataset.qid = q.id;

  const promptHtml = savedHighlightHtml || escapeHtml(q.prompt);

  card.innerHTML = `
    <div class="q-head">
      <div>
        <div class="q-meta">
          <span class="tag">${index + 1} &middot; ${q.points || 1} pt</span>
          ${q.time ? `<span class="tag time timer-pill" data-role="timer">${q.time}s</span>` : ""}
        </div>
      </div>
      <div class="q-actions">
        <button class="remove-btn" data-action="delete">${isDeleted ? "restore" : "remove"}</button>
      </div>
    </div>
    <p class="q-prompt" data-role="prompt">${promptHtml}</p>
    <div data-role="answer-area"></div>
    <div class="explanation-box" data-role="explanation">${escapeHtml(q.explanation || "")}</div>
    <div class="notes-panel ${notesModeOn ? "visible" : ""}" data-role="notes">
      <textarea placeholder="Your notes on this question...">${escapeHtml(savedNote || "")}</textarea>
    </div>
  `;

  // Delete / restore
  card.querySelector('[data-action="delete"]').addEventListener("click", () => {
    const nowDeleted = !card.classList.contains("is-deleted");
    card.classList.toggle("is-deleted", nowDeleted);
    Store.setDeleted(currentQuiz.id, q.id, nowDeleted);
    card.querySelector('[data-action="delete"]').textContent = nowDeleted ? "restore" : "remove";
  });

  // Notes
  card.querySelector('[data-role="notes"] textarea').addEventListener("input", (e) => {
    Store.setNote(currentQuiz.id, q.id, e.target.value);
  });

  // Highlighting: select text inside the prompt, release the mouse to highlight it
  const promptEl = card.querySelector('[data-role="prompt"]');
  promptEl.addEventListener("mouseup", () => handleHighlight(promptEl, q.id));

  // Answer area, per type
  const answerArea = card.querySelector('[data-role="answer-area"]');
  renderAnswerArea(q, answerArea, savedAnswer);

  // Timer
  if (q.time) startTimer(card, q);

  return card;
}

function handleHighlight(promptEl, questionId) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !promptEl.contains(selection.anchorNode)) return;
  const range = selection.getRangeAt(0);
  const mark = document.createElement("mark");
  mark.className = "hl";
  try {
    range.surroundContents(mark);
  } catch (e) {
    return; // selection spanned partial nodes; skip rather than corrupt markup
  }
  selection.removeAllRanges();
  Store.setHighlights(currentQuiz.id, questionId, promptEl.innerHTML);
}

function renderAnswerArea(q, container, savedAnswer) {
  if (q.type === "multiple_choice") {
    container.innerHTML = `<div class="options-list">${q.options
      .map(
        (opt) =>
          `<button class="option-btn" data-opt="${opt.id}">${escapeHtml(opt.text)}</button>`
      )
      .join("")}</div>`;

    container.querySelectorAll(".option-btn").forEach((btn) => {
      if (savedAnswer === btn.dataset.opt) markSelected(btn, container, q);
      btn.addEventListener("click", () => {
        Store.setAnswer(currentQuiz.id, q.id, btn.dataset.opt);
        markSelected(btn, container, q);
        showExplanation(container);
        updateScorePill();
      });
    });
    if (savedAnswer) showExplanation(container);
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<input type="text" class="fill-blank-input" placeholder="Type your answer" value="${escapeAttr(
      savedAnswer || ""
    )}">`;
    const input = container.querySelector("input");
    input.addEventListener("change", () => {
      Store.setAnswer(currentQuiz.id, q.id, input.value);
      showExplanation(container);
      updateScorePill();
    });
  } else if (q.type === "open_ended") {
    container.innerHTML = `<textarea class="open-ended-input" placeholder="Write your answer">${escapeHtml(
      savedAnswer || ""
    )}</textarea>`;
    const ta = container.querySelector("textarea");
    ta.addEventListener("change", () => {
      Store.setAnswer(currentQuiz.id, q.id, ta.value);
      showExplanation(container);
      updateScorePill();
    });
  }
}

function markSelected(clickedBtn, container, q) {
  container.querySelectorAll(".option-btn").forEach((b) => {
    b.classList.remove("selected", "correct", "incorrect");
  });
  const isCorrect = (q.correct || []).includes(clickedBtn.dataset.opt);
  clickedBtn.classList.add("selected", isCorrect ? "correct" : "incorrect");
}

function showExplanation(container) {
  const card = container.closest(".question-card");
  const box = card.querySelector('[data-role="explanation"]');
  if (box.textContent.trim()) box.classList.add("visible");
}

function startTimer(card, q) {
  const pill = card.querySelector('[data-role="timer"]');
  if (!pill) return;
  let remaining = q.time;
  clearInterval(timers[q.id]);
  timers[q.id] = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(timers[q.id]);
      pill.textContent = "0s";
      pill.classList.add("low");
      return;
    }
    pill.textContent = `${remaining}s`;
    if (remaining <= 5) pill.classList.add("low");
  }, 1000);
}

function updateScorePill() {
  if (!currentQuiz) return;
  const answers = Store.getAnswers(currentQuiz.id);
  const deleted = new Set(Store.getDeleted(currentQuiz.id));
  let earned = 0,
    total = 0;
  currentQuiz.questions.forEach((q) => {
    if (deleted.has(q.id)) return;
    total += q.points || 1;
    if (q.type === "multiple_choice" && answers[q.id] && (q.correct || []).includes(answers[q.id])) {
      earned += q.points || 1;
    }
  });
  const pill = document.getElementById("score-pill");
  if (pill) pill.textContent = `${earned} / ${total} pts (auto-graded questions)`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
