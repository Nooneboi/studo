/*
  module.js — Studo practice workspace (v2)
  ------------------------------------------
  One question at a time, with the passage kept visible beside it.
  Practice remains untimed: per-question time values are presented only as
  suggested pacing, never as a countdown. Answers, notes, highlights, and
  mastered questions still use the existing local Store API.
*/

const viewEl = document.getElementById("module-view");
let currentQuiz = null;
let currentIndex = 0;
let notesOpen = false;

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");
  if (!file) {
    viewEl.innerHTML = `<div class="empty-state">No module selected. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  try {
    currentQuiz = await Data.loadQuiz(file);
  } catch (e) {
    viewEl.innerHTML = `<div class="empty-state">Couldn't load this module. <a href="practice.html">Back to Practice</a></div>`;
    return;
  }

  const cat = currentQuiz.category || "reading";
  const topic = currentQuiz.topic || "";
  const backHref = topic
    ? `category.html?category=${encodeURIComponent(cat)}&topic=${encodeURIComponent(topic)}`
    : `practice.html`;

  const exitLink = document.getElementById("focus-exit");
  if (exitLink) exitLink.href = backHref;
  const titleEl = document.getElementById("focus-title");
  if (titleEl) titleEl.textContent = currentQuiz.title;

  currentIndex = firstAvailableIndex();
  renderShell();
  renderCurrentQuestion();
}

function activeQuestions() {
  const mastered = new Set(Store.getDeleted(currentQuiz.id));
  return currentQuiz.questions
    .map((question, originalIndex) => ({ question, originalIndex }))
    .filter(({ question }) => !mastered.has(question.id));
}

function firstAvailableIndex() {
  return activeQuestions().length ? 0 : -1;
}

function renderShell() {
  const hasPassage = Boolean(currentQuiz.passage);
  const difficulty = currentQuiz.difficulty
    ? `<span class="tag difficulty-pill">${escapeHtml(currentQuiz.difficulty)}</span>`
    : "";
  const topic = currentQuiz.topic
    ? `<span class="tag">${escapeHtml(currentQuiz.topic)}</span>`
    : "";

  viewEl.innerHTML = `
    <div class="study-shell">
      <section class="study-heading" aria-labelledby="module-heading">
        <div>
          <h1 id="module-heading">${escapeHtml(currentQuiz.title)}</h1>
          ${currentQuiz.description ? `<p class="lede">${escapeHtml(currentQuiz.description)}</p>` : ""}
        </div>
        <div class="study-meta">
          ${topic}${difficulty}
          <div class="study-progress" aria-label="Module progress">
            <div class="study-progress-row"><span id="progress-label">Question</span><span id="answered-label"></span></div>
            <div class="study-progress-track" aria-hidden="true"><div class="study-progress-fill" id="progress-fill"></div></div>
          </div>
        </div>
      </section>

      <div class="study-actions" aria-label="Practice controls">
        <button id="notes-toggle" class="btn ghost small" aria-pressed="false">Notes</button>
        <button id="reset-btn" class="btn ghost small">Reset progress</button>
        <div class="spacer"></div>
        <span class="study-status" id="study-status" aria-live="polite"></span>
      </div>

      <section class="study-workspace ${hasPassage ? "" : "no-passage"}" id="study-workspace">
        ${hasPassage ? passagePanelHtml() : ""}
        <article class="question-panel" aria-label="Question workspace">
          <div id="question-stage" class="question-stage"></div>
          <div class="question-footer" id="question-footer"></div>
        </article>
      </section>
    </div>
  `;

  document.getElementById("notes-toggle").addEventListener("click", () => {
    notesOpen = !notesOpen;
    const btn = document.getElementById("notes-toggle");
    btn.setAttribute("aria-pressed", String(notesOpen));
    btn.classList.toggle("active", notesOpen);
    renderCurrentQuestion({ preserveFocus: true });
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Clear answers, notes, highlights, and mastered questions for this module?")) {
      Store.resetQuiz(currentQuiz.id);
      currentIndex = 0;
      notesOpen = false;
      document.getElementById("notes-toggle").setAttribute("aria-pressed", "false");
      renderCurrentQuestion();
    }
  });
}

function passagePanelHtml() {
  return `
    <aside class="reading-panel" aria-label="Reading passage">
      <div class="panel-kicker"><span>Passage</span><span>Read at your pace</span></div>
      <div class="reading-scroll">
        <div class="passage-text">${escapeHtml(currentQuiz.passage)}</div>
      </div>
      ${currentQuiz.source ? `<div class="source-credit">${escapeHtml(currentQuiz.source)}</div>` : ""}
    </aside>
  `;
}

function renderCurrentQuestion(options = {}) {
  const items = activeQuestions();
  const stage = document.getElementById("question-stage");
  const footer = document.getElementById("question-footer");
  if (!stage || !footer) return;

  if (!items.length) {
    stage.innerHTML = `
      <div class="module-complete">
        <div class="question-number">Module complete</div>
        <h2>Everything is marked mastered.</h2>
        <p>You can reset the module if you want to run through the questions again.</p>
        <button class="btn" id="complete-reset">Practice again</button>
      </div>`;
    footer.innerHTML = "";
    document.getElementById("complete-reset").addEventListener("click", () => {
      Store.resetQuiz(currentQuiz.id);
      currentIndex = 0;
      renderCurrentQuestion();
    });
    updateProgress([], 0);
    return;
  }

  currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  const { question: q } = items[currentIndex];
  const answers = Store.getAnswers(currentQuiz.id);
  const notes = Store.getNotes(currentQuiz.id);
  const highlights = Store.getHighlights(currentQuiz.id);
  const savedAnswer = answers[q.id];
  const promptHtml = q.type === "grammar_edit"
    ? renderGrammarPrompt(q, highlights[q.id])
    : (highlights[q.id] || escapeHtml(q.prompt));

  stage.innerHTML = `
    <div class="question-topline">
      <span class="question-number">Question ${currentIndex + 1} of ${items.length}</span>
      <span class="question-detail">${questionDetail(q)}</span>
    </div>
    <div class="q-prompt" data-role="prompt">${promptHtml}</div>
    <div data-role="answer-area"></div>
    <div class="explanation-box" data-role="explanation">${escapeHtml(q.explanation || "")}</div>
    <div class="notes-panel ${notesOpen ? "visible" : ""}" data-role="notes">
      <label class="question-detail" for="question-note">Private note for this question</label>
      <textarea id="question-note" placeholder="Write a note to yourself…">${escapeHtml(notes[q.id] || "")}</textarea>
    </div>
  `;

  const promptEl = stage.querySelector('[data-role="prompt"]');
  promptEl.addEventListener("mouseup", () => handleHighlight(promptEl, q.id));

  stage.querySelector('[data-role="notes"] textarea').addEventListener("input", (e) => {
    Store.setNote(currentQuiz.id, q.id, e.target.value);
  });

  renderAnswerArea(q, stage.querySelector('[data-role="answer-area"]'), savedAnswer);

  footer.innerHTML = `
    <button class="btn ghost" id="prev-question" ${currentIndex === 0 ? "disabled" : ""}>&larr; Previous</button>
    <button class="btn ghost master-btn" id="master-question" aria-pressed="false">Mark mastered</button>
    <div class="spacer"></div>
    <button class="btn" id="next-question">${currentIndex === items.length - 1 ? "Finish" : "Next"} &rarr;</button>
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
    } else {
      showCompletionSummary();
    }
  });
  document.getElementById("master-question").addEventListener("click", () => {
    Store.setDeleted(currentQuiz.id, q.id, true);
    const nextItems = activeQuestions();
    if (currentIndex >= nextItems.length) currentIndex = Math.max(0, nextItems.length - 1);
    setStatus("Marked as mastered.");
    renderCurrentQuestion();
  });

  updateProgress(items, currentIndex);
  updateAnswerStatus();
  if (!options.preserveFocus) stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function questionDetail(q) {
  const parts = [];
  if (q.points) parts.push(`${q.points} ${q.points === 1 ? "point" : "points"}`);
  if (q.time) parts.push(`suggested ${q.time}s`);
  const type = questionTypeLabel(q.type);
  if (type) parts.push(type);
  return parts.join(" · ");
}

function questionTypeLabel(type) {
  return {
    multiple_choice: "Multiple choice",
    evidence_based: "Evidence based",
    grammar_edit: "Grammar edit",
    fill_blank: "Short answer",
    open_ended: "Open response",
    extended_response: "Extended response",
  }[type] || "";
}

function renderGrammarPrompt(q, savedHighlightHtml) {
  if (savedHighlightHtml) return savedHighlightHtml;
  return escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>');
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
  setStatus("Highlight saved on this device.");
}

function renderAnswerArea(q, container, savedAnswer) {
  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) {
    const optionClass = q.type === "evidence_based" ? " evidence-option" : "";
    container.innerHTML = `<div class="options-list" role="radiogroup" aria-label="Answer choices">${q.options
      .map((opt) => `<button type="button" class="option-btn${optionClass}" data-opt="${escapeAttr(opt.id)}" role="radio" aria-checked="false"><span class="opt-letter">${escapeHtml(opt.id.toUpperCase())}</span><span class="opt-text">${escapeHtml(opt.text)}</span></button>`)
      .join("")}</div>`;

    container.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        Store.setAnswer(currentQuiz.id, q.id, btn.dataset.opt);
        revealChoiceFeedback(container, q, btn.dataset.opt);
        showExplanation();
        updateAnswerStatus();
      });
    });
    if (savedAnswer) {
      revealChoiceFeedback(container, q, savedAnswer);
      showExplanation();
    }
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<label class="question-detail" for="short-answer">Your answer</label><input id="short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}">`;
    const input = container.querySelector("input");
    input.addEventListener("input", () => Store.setAnswer(currentQuiz.id, q.id, input.value));
    input.addEventListener("blur", () => {
      if (input.value.trim()) {
        showExplanation();
        updateAnswerStatus();
      }
    });
    if (savedAnswer) showExplanation();
  } else {
    container.innerHTML = `<label class="question-detail" for="written-answer">Your response</label><textarea id="written-answer" class="open-ended-input" placeholder="Write your response…">${escapeHtml(savedAnswer || "")}</textarea>`;
    const ta = container.querySelector("textarea");
    ta.addEventListener("input", () => {
      Store.setAnswer(currentQuiz.id, q.id, ta.value);
      updateAnswerStatus();
    });
    ta.addEventListener("blur", () => {
      if (ta.value.trim()) showExplanation();
    });
    if (savedAnswer) showExplanation();
  }

  function showExplanation() {
    const box = document.querySelector('[data-role="explanation"]');
    if (box && box.textContent.trim()) box.classList.add("visible");
  }
}

function revealChoiceFeedback(container, q, selectedId) {
  const correctIds = new Set(q.correct || []);
  container.querySelectorAll(".option-btn").forEach((btn) => {
    const selected = btn.dataset.opt === selectedId;
    const correct = correctIds.has(btn.dataset.opt);
    btn.classList.toggle("selected", selected);
    btn.classList.toggle("correct", correct);
    btn.classList.toggle("incorrect", selected && !correct);
    btn.setAttribute("aria-checked", String(selected));
  });

  if (correctIds.has(selectedId)) setStatus("Correct — review the explanation, then continue.");
  else setStatus("Not quite — the correct answer is shown. Review why before continuing.");
}

function updateProgress(items, index) {
  const progressLabel = document.getElementById("progress-label");
  const answeredLabel = document.getElementById("answered-label");
  const fill = document.getElementById("progress-fill");
  if (!progressLabel || !answeredLabel || !fill) return;

  if (!items.length) {
    progressLabel.textContent = "Complete";
    answeredLabel.textContent = "100%";
    fill.style.width = "100%";
    return;
  }

  const answers = Store.getAnswers(currentQuiz.id);
  const answered = items.filter(({ question }) => Boolean(answers[question.id])).length;
  progressLabel.textContent = `Question ${index + 1} of ${items.length}`;
  answeredLabel.textContent = `${answered} answered`;
  fill.style.width = `${((index + 1) / items.length) * 100}%`;
}

function updateAnswerStatus() {
  const items = activeQuestions();
  const answers = Store.getAnswers(currentQuiz.id);
  const answered = items.filter(({ question }) => Boolean(answers[question.id])).length;
  const auto = items.filter(({ question }) => isAutoGraded(question));
  let earned = 0;
  let total = 0;
  auto.forEach(({ question }) => {
    const pts = question.points || 1;
    total += pts;
    if (isCorrectAnswer(question, answers[question.id])) earned += pts;
  });
  const scoreText = total ? ` · ${earned}/${total} auto-graded pts` : "";
  setStatus(`${answered}/${items.length} answered${scoreText}`, false);
  updateProgress(items, currentIndex);
}

function isAutoGraded(q) {
  if (["multiple_choice", "evidence_based", "grammar_edit"].includes(q.type)) return true;
  return q.type === "fill_blank" && typeof q.correct === "string";
}

function isCorrectAnswer(q, answer) {
  if (!answer) return false;
  if (Array.isArray(q.correct)) return q.correct.includes(answer);
  if (typeof q.correct === "string") return answer.trim().toLowerCase() === q.correct.trim().toLowerCase();
  return false;
}

function showCompletionSummary() {
  const stage = document.getElementById("question-stage");
  const footer = document.getElementById("question-footer");
  const items = activeQuestions();
  const answers = Store.getAnswers(currentQuiz.id);
  const answered = items.filter(({ question }) => Boolean(answers[question.id])).length;
  stage.innerHTML = `
    <div class="module-complete">
      <div class="question-number">End of module</div>
      <h2>${answered === items.length ? "You reached every question." : "You reached the end."}</h2>
      <p>${answered} of ${items.length} questions have an answer saved on this device. You can review anything before leaving.</p>
    </div>`;
  footer.innerHTML = `
    <button class="btn ghost" id="review-first">Review from start</button>
    <div class="spacer"></div>
    <a class="btn" href="${escapeAttr(document.getElementById("focus-exit").href)}">Back to practice</a>`;
  document.getElementById("review-first").addEventListener("click", () => {
    currentIndex = 0;
    renderCurrentQuestion();
  });
  document.getElementById("progress-fill").style.width = "100%";
  document.getElementById("progress-label").textContent = "Review complete";
}

function setStatus(message, temporary = true) {
  const el = document.getElementById("study-status");
  if (!el) return;
  el.textContent = message;
  if (temporary) {
    clearTimeout(setStatus._timer);
    setStatus._timer = setTimeout(() => updateAnswerStatus(), 2200);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
