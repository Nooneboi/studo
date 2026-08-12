/*
  module.js
  ---------
  Runs the module player (module.html): one passage, its questions,
  and their explanations. Loaded via ?quiz=<file>.

  Question types supported:
   - multiple_choice     standard MC
   - evidence_based       MC where options are quoted excerpts
   - grammar_edit          a sentence with a {{blank}} the learner fixes
   - fill_blank            free-text fill in
   - open_ended             free-text, not auto-graded

  Learner controls (delete/restore, change answer, highlight, notes)
  all save to this device only via storage.js.
*/

const viewEl = document.getElementById("module-view");
let currentQuiz = null;
let notesModeOn = false;
let timers = {};

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("quiz");
  if (!file) {
    viewEl.innerHTML = `<div class="empty-state">No module selected. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }
  try {
    currentQuiz = await Data.loadQuiz(file);
    currentQuiz._file = file;
  } catch (e) {
    viewEl.innerHTML = `<div class="empty-state">Couldn't load that module (${escapeHtml(file)}). <a href="practice.html">Back to Practice</a></div>`;
    return;
  }
  render();
}

function render() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat");
  const backHref = cat ? `category.html?subject=rla&cat=${encodeURIComponent(cat)}` : "practice.html";

  const exitLink = document.getElementById("focus-exit");
  if (exitLink) exitLink.href = backHref;
  const titleEl = document.getElementById("focus-title");
  if (titleEl) titleEl.textContent = currentQuiz.title;

  const deleted = new Set(Store.getDeleted(currentQuiz.id));
  const answers = Store.getAnswers(currentQuiz.id);
  const notes = Store.getNotes(currentQuiz.id);
  const highlights = Store.getHighlights(currentQuiz.id);

  const hasPassage = !!currentQuiz.passage;
  const wrapEl = document.querySelector(".focus-wrap");
  if (wrapEl) wrapEl.classList.toggle("has-passage", hasPassage);

  const passageHtml = hasPassage
    ? `<div class="card"><h3>Passage</h3><p class="passage-text">${escapeHtml(currentQuiz.passage)}</p></div>`
    : "";

  const sourceHtml = currentQuiz.source
    ? `<div class="source-credit">${escapeHtml(currentQuiz.source)}</div>`
    : "";

  const questionListHtml = `<div id="question-list"${hasPassage ? "" : ' style="margin-top:var(--space-4)"'}></div>`;

  // With a passage: passage pinned on the left, questions scroll on
  // the right — no scrolling back up to reread it. Without one
  // (grammar edit, open-ended sets), just a single column.
  const bodyHtml = hasPassage
    ? `<div class="passage-split">
         <div class="passage-pane">${passageHtml}${sourceHtml}</div>
         <div class="questions-pane">${questionListHtml}</div>
       </div>`
    : `${passageHtml}${sourceHtml}${questionListHtml}`;

  viewEl.innerHTML = `
    <h1>${escapeHtml(currentQuiz.title)}</h1>
    <p class="lede">${escapeHtml(currentQuiz.description || "")}</p>
    <div class="meta-row" style="margin-bottom:var(--space-4)">
      ${currentQuiz.difficulty ? `<span class="tag difficulty-pill">${escapeHtml(currentQuiz.difficulty)}</span>` : ""}
    </div>

    <div class="toolbar">
      <button id="notes-toggle" class="btn ghost small toggle-btn">Note mode: off</button>
      <button id="reset-btn" class="btn ghost small">Reset my progress</button>
      <div class="spacer"></div>
      <span id="score-pill" class="tag"></span>
    </div>

    ${bodyHtml}
  `;

  document.getElementById("notes-toggle").addEventListener("click", () => {
    notesModeOn = !notesModeOn;
    document.getElementById("notes-toggle").textContent = `Note mode: ${notesModeOn ? "on" : "off"}`;
    document.getElementById("notes-toggle").classList.toggle("active", notesModeOn);
    document.querySelectorAll(".notes-panel").forEach((p) => p.classList.toggle("visible", notesModeOn));
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Clear your answers, notes, highlights, and deleted questions for this module?")) {
      Store.resetQuiz(currentQuiz.id);
      render();
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

  const promptText = q.type === "grammar_edit" ? renderGrammarPrompt(q, savedHighlightHtml) : (savedHighlightHtml || escapeHtml(q.prompt));

  card.innerHTML = `
    <div class="q-head">
      <div>
        <div class="q-meta">
          <span class="tag">${index + 1} &middot; ${q.points || 1} pt</span>
          ${q.time ? `<span class="tag time timer-pill" data-role="timer">${q.time}s</span>` : ""}
          ${questionTypeLabel(q.type) ? `<span class="tag">${questionTypeLabel(q.type)}</span>` : ""}
        </div>
      </div>
      <div class="q-actions">
        <button class="remove-btn" data-action="delete">${isDeleted ? "restore" : "remove"}</button>
      </div>
    </div>
    <p class="q-prompt" data-role="prompt">${promptText}</p>
    <div data-role="answer-area"></div>
    <div class="explanation-box" data-role="explanation">${escapeHtml(q.explanation || "")}</div>
    <div class="notes-panel ${notesModeOn ? "visible" : ""}" data-role="notes">
      <textarea placeholder="Your notes on this question...">${escapeHtml(savedNote || "")}</textarea>
    </div>
  `;

  card.querySelector('[data-action="delete"]').addEventListener("click", () => {
    const nowDeleted = !card.classList.contains("is-deleted");
    card.classList.toggle("is-deleted", nowDeleted);
    Store.setDeleted(currentQuiz.id, q.id, nowDeleted);
    card.querySelector('[data-action="delete"]').textContent = nowDeleted ? "restore" : "remove";
  });

  card.querySelector('[data-role="notes"] textarea').addEventListener("input", (e) => {
    Store.setNote(currentQuiz.id, q.id, e.target.value);
  });

  const promptEl = card.querySelector('[data-role="prompt"]');
  promptEl.addEventListener("mouseup", () => handleHighlight(promptEl, q.id));

  const answerArea = card.querySelector('[data-role="answer-area"]');
  renderAnswerArea(q, answerArea, savedAnswer);

  if (q.time) startTimer(card, q);

  return card;
}

function questionTypeLabel(type) {
  return {
    evidence_based: "Evidence-based",
    grammar_edit: "Grammar edit",
    extended_response: "Extended response",
  }[type];
}

function renderGrammarPrompt(q, savedHighlightHtml) {
  if (savedHighlightHtml) return savedHighlightHtml;
  const escaped = escapeHtml(q.prompt || "");
  return escaped.replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>');
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
    return;
  }
  selection.removeAllRanges();
  Store.setHighlights(currentQuiz.id, questionId, promptEl.innerHTML);
}

function renderAnswerArea(q, container, savedAnswer) {
  if (q.type === "multiple_choice" || q.type === "evidence_based" || q.type === "grammar_edit") {
    const optionClass = q.type === "evidence_based" ? " evidence-option" : "";
    container.innerHTML = `<div class="options-list">${q.options
      .map((opt) => `<button class="option-btn${optionClass}" data-opt="${opt.id}">${escapeHtml(opt.text)}</button>`)
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
    container.innerHTML = `<input type="text" class="fill-blank-input" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}">`;
    const input = container.querySelector("input");
    input.addEventListener("change", () => {
      Store.setAnswer(currentQuiz.id, q.id, input.value);
      showExplanation(container);
      updateScorePill();
    });
  } else if (q.type === "open_ended" || q.type === "extended_response") {
    container.innerHTML = `<textarea class="open-ended-input" placeholder="Write your response">${escapeHtml(savedAnswer || "")}</textarea>`;
    const ta = container.querySelector("textarea");
    ta.addEventListener("change", () => {
      Store.setAnswer(currentQuiz.id, q.id, ta.value);
      showExplanation(container);
      updateScorePill();
    });
  }
}

function markSelected(clickedBtn, container, q) {
  container.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("selected", "correct", "incorrect"));
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
    total = 0,
    answeredCount = 0,
    remainingCount = 0;
  const autoGradedTypes = ["multiple_choice", "evidence_based", "grammar_edit"];
  currentQuiz.questions.forEach((q) => {
    if (deleted.has(q.id)) return;
    total += q.points || 1;
    remainingCount += 1;
    if (answers[q.id]) answeredCount += 1;
    if (autoGradedTypes.includes(q.type) && answers[q.id] && (q.correct || []).includes(answers[q.id])) {
      earned += q.points || 1;
    }
  });
  const pill = document.getElementById("score-pill");
  if (pill) pill.textContent = `${answeredCount} / ${remainingCount} answered \u00b7 ${earned} / ${total} pts`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
