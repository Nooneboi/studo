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
let currentModuleFile = null;
let questionOpenedAt = Date.now();
const confidenceSelections = {};

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file") || params.get("quiz");
  currentModuleFile = file;
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
  const requestedReturn = params.get("return");
  const safeReturn = requestedReturn && !/^(?:https?:)?\/\//i.test(requestedReturn) && !/^javascript:/i.test(requestedReturn)
    ? requestedReturn
    : null;
  const backHref = safeReturn || (topic
    ? `category.html?cat=${encodeURIComponent(cat)}&topic=${encodeURIComponent(topic)}`
    : `practice.html`);

  const exitLink = document.getElementById("focus-exit");
  if (exitLink) exitLink.href = backHref;
  const titleEl = document.getElementById("focus-title");
  if (titleEl) titleEl.textContent = currentQuiz.title;

  const requestedQuestion = params.get("question");
  const available = activeQuestions();
  const requestedIndex = requestedQuestion
    ? available.findIndex(({ question }) => question.id === requestedQuestion)
    : -1;
  currentIndex = requestedIndex >= 0 ? requestedIndex : firstAvailableIndex();
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
      ${currentQuiz.source ? `<div class="source-credit">${currentQuiz.sourceUrl ? `<a href="${escapeAttr(currentQuiz.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(currentQuiz.source)} ↗</a>` : escapeHtml(currentQuiz.source)}</div>` : ""}
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
  questionOpenedAt = Date.now();
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
    ${isAutoGraded(q) ? confidencePanelHtml(q, confidenceSelections[q.id] || null) : ""}
    <div class="explanation-box" data-role="explanation"></div>
    <div class="learning-feedback" data-role="learning-feedback" aria-live="polite"></div>
    <details class="mistake-reason" data-role="mistake-reason">
      <summary>Why did I miss this? <span>Optional</span></summary>
      <div class="mistake-reason-options">
        <button type="button" class="mistake-reason-btn" data-reason="misread">Misread the question</button>
        <button type="button" class="mistake-reason-btn" data-reason="evidence">Couldn't find the evidence</button>
        <button type="button" class="mistake-reason-btn" data-reason="two_choices">Between two answers</button>
        <button type="button" class="mistake-reason-btn" data-reason="guess">Guessed</button>
        <button type="button" class="mistake-reason-btn" data-reason="careless">Careless mistake</button>
      </div>
    </details>
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

  stage.querySelectorAll('[data-confidence]').forEach((btn) => {
    btn.addEventListener('click', () => {
      confidenceSelections[q.id] = btn.dataset.confidence;
      stage.querySelectorAll('[data-confidence]').forEach((b) => b.classList.toggle('active', b === btn));
      setStatus(`Confidence noted: ${btn.textContent}.`, false);
    });
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

function confidencePanelHtml(q, selectedConfidence) {
  return `
    <div class="confidence-inline" data-role="confidence-panel" aria-label="Optional certainty before answering">
      <div class="confidence-options">
        ${['sure', 'unsure', 'guessing'].map((id) => `
          <button
            type="button"
            class="confidence-btn${selectedConfidence === id ? ' active' : ''}"
            data-confidence="${id}"
          >${confidenceLabel(id)}</button>
        `).join('')}
      </div>
    </div>`;
}

function confidenceLabel(id) {
  return { sure: 'Sure', unsure: 'Unsure', guessing: 'Guessing' }[id] || id;
}

function finalizeConfidenceUi(questionId) {
  const panel = document.querySelector('[data-role="confidence-panel"]');
  if (!panel) return;
  panel.hidden = true;
}

function buildExplanationHtml(q, selectedAnswer) {
  const hasSelected = selectedAnswer != null && selectedAnswer !== '';
  const auto = isAutoGraded(q);
  const correct = auto && hasSelected ? isCorrectAnswer(q, selectedAnswer) : null;
  const correctOption = getCorrectOption(q);
  const selectedOption = getOptionById(q, selectedAnswer);
  const summary = q.explanation || '';
  const rule = q.rule || defaultRuleForQuestion(q);
  const wrongReason = !correct && auto && hasSelected ? distractorReasonForAnswer(q, selectedAnswer) : '';
  const evidence = q.evidenceExcerpt || q.evidence || '';
  const selectedDisplay = selectedOption ? answerDisplay(q, selectedOption) : '';
  const correctDisplay = correctOption ? answerDisplay(q, correctOption) : '';

  if (!summary && !rule && !evidence && !hasSelected) return '';

  const breakdown = [
    !correct && wrongReason ? `
      <div class="answer-breakdown-row">
        <span>Your answer</span>
        <p>${selectedDisplay ? `<strong>${escapeHtml(selectedDisplay)}</strong> — ` : ''}${escapeHtml(wrongReason)}</p>
      </div>` : '',
    evidence ? `
      <div class="answer-breakdown-row">
        <span>Evidence</span>
        <p>${escapeHtml(evidence)}</p>
      </div>` : '',
    rule ? `
      <div class="answer-breakdown-row">
        <span>Tip</span>
        <p>${escapeHtml(rule)}</p>
      </div>` : ''
  ].filter(Boolean).join('');

  return `
    <div class="answer-review ${correct === false ? 'is-wrong' : correct === true ? 'is-right' : ''}">
      <div class="answer-review-head">
        <strong>${correct === true ? 'Correct' : correct === false ? 'Not quite' : 'Review'}</strong>
        ${auto && hasSelected && correct === false && correctDisplay ? `<span>Correct answer: ${escapeHtml(correctDisplay)}</span>` : ''}
      </div>
      ${summary ? `<p class="answer-review-why"><span>Why</span>${escapeHtml(summary)}</p>` : ''}
      ${breakdown ? `
        <details class="answer-breakdown">
          <summary>See answer breakdown</summary>
          <div class="answer-breakdown-body">${breakdown}</div>
        </details>` : ''}
    </div>`;
}
function getCorrectOption(q) {
  if (!Array.isArray(q.options)) return null;
  const correctIds = new Set(q.correct || []);
  return q.options.find((opt) => correctIds.has(opt.id)) || null;
}

function getOptionById(q, optionId) {
  if (!Array.isArray(q.options)) return null;
  return q.options.find((opt) => opt.id === optionId) || null;
}

function answerDisplay(q, opt) {
  if (!opt) {
    if (typeof q.correct === 'string') return q.correct;
    return 'See explanation';
  }
  return `${String(opt.id || '').toUpperCase()}. ${opt.text}`;
}

function distractorReasonForAnswer(q, selectedAnswer) {
  const opt = getOptionById(q, selectedAnswer);
  if (!opt) {
    if (q.type === 'fill_blank') return 'This answer does not match the expected term or form.';
    return '';
  }
  return opt.whyWrong || distractorReasonFromType(opt.distractorType, q) || 'It sounds plausible, but it does not best meet what the question is asking.';
}

function distractorReasonFromType(type, q) {
  return {
    mentioned_not_supported: 'This idea appears in the text, but it is not directly supported in the way the question requires.',
    too_broad: 'This answer is broader than the passage supports.',
    too_narrow: 'This answer focuses on only one detail and misses the larger point.',
    opposite_claim: 'This answer goes against what the passage or sentence is actually saying.',
    location_homophone: 'This word refers to a place, so it does not fit the sentence grammatically.',
    contraction_homophone: 'This means a shortened form such as “they are,” so it does not work as a possessive.',
    possessive_pronoun_form: 'This form stands alone, but the sentence needs a word placed directly before the noun.',
  }[type] || '';
}

function defaultRuleForQuestion(q) {
  if (q.type === 'evidence_based') return 'For evidence questions, choose the line that most directly proves the answer—not just a sentence that mentions the topic.';
  if (q.type === 'multiple_choice' && currentQuiz?.category === 'reading') return 'For reading questions, match the answer to what the text supports, not simply what sounds reasonable.';
  if (q.type === 'grammar_edit') return 'Check the job the word or verb must do in the sentence before choosing the answer that sounds familiar.';
  if (q.type === 'fill_blank') return 'Make sure the answer fits both the meaning and the exact form the sentence needs.';
  return '';
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
    const groupName = `practice-answer-${q.id}`;
    container.innerHTML = `<fieldset class="options-list" aria-label="Answer choices">${q.options
      .map((opt) => `<label class="answer-choice${optionClass}" data-opt="${escapeAttr(opt.id)}"><input class="answer-radio" type="radio" name="${escapeAttr(groupName)}" value="${escapeAttr(opt.id)}" ${savedAnswer === opt.id ? "checked" : ""}><span class="choice-letter">${escapeHtml(opt.id.toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`)
      .join("")}</fieldset>`;

    container.querySelectorAll(".answer-radio").forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        Store.setAnswer(currentQuiz.id, q.id, radio.value);
        const correct = isCorrectAnswer(q, radio.value);
        const learningResult = typeof Learning !== "undefined"
          ? Learning.recordAttempt({
              module: { ...currentQuiz, file: currentModuleFile },
              question: q,
              answer: radio.value,
              correct,
              mode: "practice",
              elapsedMs: Date.now() - questionOpenedAt,
              file: currentModuleFile,
              confidence: confidenceSelections[q.id] || null,
            })
          : null;
        revealChoiceFeedback(container, q, radio.value);
        showExplanation(radio.value);
        showLearningFeedback(learningResult, correct);
        setupMistakeReason(q, correct, learningResult);
        finalizeConfidenceUi(q.id);
        lockChoiceInputs(container);
        questionOpenedAt = Date.now();
        updateAnswerStatus();
      });
    });
    if (savedAnswer) {
      revealChoiceFeedback(container, q, savedAnswer);
      showExplanation(savedAnswer);
      finalizeConfidenceUi(q.id);
      lockChoiceInputs(container);
    }
  } else if (q.type === "fill_blank") {
    container.innerHTML = `<label class="question-detail" for="short-answer">Your answer</label><input id="short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}">`;
    const input = container.querySelector("input");
    input.addEventListener("input", () => Store.setAnswer(currentQuiz.id, q.id, input.value));
    input.addEventListener("blur", () => {
      if (input.value.trim()) {
        if (typeof q.correct === "string" && typeof Learning !== "undefined") {
          const correct = isCorrectAnswer(q, input.value);
          const learningResult = Learning.recordAttempt({
            module: { ...currentQuiz, file: currentModuleFile },
            question: q,
            answer: input.value,
            correct,
            mode: "practice",
            elapsedMs: Date.now() - questionOpenedAt,
            file: currentModuleFile,
            confidence: confidenceSelections[q.id] || null,
          });
          showLearningFeedback(learningResult, correct);
          setupMistakeReason(q, correct, learningResult);
          finalizeConfidenceUi(q.id);
          questionOpenedAt = Date.now();
        }
        showExplanation(input.value);
        updateAnswerStatus();
      }
    });
    if (savedAnswer) {
      showExplanation(savedAnswer);
      finalizeConfidenceUi(q.id);
    }
  } else {
    container.innerHTML = `<label class="question-detail" for="written-answer">Your response</label><textarea id="written-answer" class="open-ended-input" placeholder="Write your response…">${escapeHtml(savedAnswer || "")}</textarea>`;
    const ta = container.querySelector("textarea");
    ta.addEventListener("input", () => {
      Store.setAnswer(currentQuiz.id, q.id, ta.value);
      updateAnswerStatus();
    });
    ta.addEventListener("blur", () => {
      if (ta.value.trim()) showExplanation(ta.value);
    });
    if (savedAnswer) showExplanation(savedAnswer);
  }

  function showExplanation(selectedAnswer = savedAnswer) {
    const box = document.querySelector('[data-role="explanation"]');
    if (!box) return;
    box.innerHTML = buildExplanationHtml(q, selectedAnswer);
    if (box.textContent.trim()) box.classList.add('visible');
  }
}

function lockChoiceInputs(container) {
  container.querySelectorAll('.answer-radio').forEach((radio) => {
    radio.disabled = true;
  });
  container.classList.add('answer-locked');
}

function revealChoiceFeedback(container, q, selectedId) {
  const correctIds = new Set(q.correct || []);
  container.querySelectorAll(".answer-choice").forEach((choice) => {
    const selected = choice.dataset.opt === selectedId;
    const correct = correctIds.has(choice.dataset.opt);
    choice.classList.toggle("selected", selected);
    choice.classList.toggle("correct", correct);
    choice.classList.toggle("incorrect", selected && !correct);
    const radio = choice.querySelector(".answer-radio");
    if (radio) radio.checked = selected;
  });

  if (correctIds.has(selectedId)) setStatus("Correct — review the explanation, then continue.");
  else setStatus("Not quite — the correct answer is shown. Review why before continuing.");
}

function showLearningFeedback(result, correct) {
  const el = document.querySelector('[data-role="learning-feedback"]');
  if (!el || !result?.skill) return;
  el.innerHTML = correct
    ? `<span class="learning-feedback-mark" aria-hidden="true">✓</span><span>Practice recorded</span>`
    : `<span class="learning-feedback-mark" aria-hidden="true">↺</span><span>Added to review</span>`;
  el.classList.add("visible", correct ? "is-correct" : "is-review");
}

function setupMistakeReason(question, correct, learningResult) {
  const panel = document.querySelector('[data-role="mistake-reason"]');
  if (!panel) return;
  panel.classList.toggle("visible", !correct);
  panel.open = false;
  if (correct || typeof Learning === "undefined") return;

  const key = learningResult?.mistake?.questionKey || Learning.questionKey(currentQuiz, question);
  const current = learningResult?.mistake?.reason || null;
  panel.querySelectorAll("[data-reason]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.reason === current);
    btn.addEventListener("click", () => {
      Learning.setMistakeReason(key, btn.dataset.reason);
      panel.querySelectorAll("[data-reason]").forEach((b) => b.classList.toggle("active", b === btn));
      setStatus("Reason saved to your mistake book.");
    });
  });
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
