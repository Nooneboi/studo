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
let highlightMode = false;
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
  if (titleEl) titleEl.textContent = "Practice";

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
  return currentQuiz.questions.map((question, originalIndex) => ({ question, originalIndex }));
}

function firstAvailableIndex() {
  return activeQuestions().length ? 0 : -1;
}

function renderShell() {
  const hasPassage = Boolean(currentQuiz.passage);

  viewEl.innerHTML = `
    <div class="study-shell study-shell-clean">
      <section class="study-workspace ${hasPassage ? "" : "no-passage"}" id="study-workspace">
        ${hasPassage ? passagePanelHtml() : ""}
        <article class="question-panel" aria-label="Question workspace">
          <div id="question-stage" class="question-stage"></div>
          <div class="question-footer" id="question-footer"></div>
        </article>
      </section>
    </div>
  `;

  const notesBtn = document.getElementById("notes-toggle");
  if (notesBtn) {
    notesBtn.addEventListener("click", () => {
      notesOpen = !notesOpen;
      notesBtn.setAttribute("aria-pressed", String(notesOpen));
      notesBtn.classList.toggle("active", notesOpen);
      renderCurrentQuestion({ preserveFocus: true });
      closeToolsMenu();
    });
  }

  const highlightBtn = document.getElementById("highlight-toggle");
  if (highlightBtn) {
    highlightBtn.addEventListener("click", () => {
      highlightMode = !highlightMode;
      highlightBtn.setAttribute("aria-pressed", String(highlightMode));
      highlightBtn.classList.toggle("active", highlightMode);
      setToolStatus(highlightMode ? "Select text in the passage or question." : "Highlighting off.");
      closeToolsMenu();
    });
  }

  const passageEl = viewEl.querySelector(".passage-text");
  if (passageEl) {
    passageEl.addEventListener("mouseup", () => handleHighlight(passageEl, "__passage__", true));
    passageEl.addEventListener("click", (event) => removeHighlightOnClick(event, passageEl, "__passage__", true));
  }

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Clear answers, notes, and highlights for this practice?")) {
        Store.resetQuiz(currentQuiz.id);
        currentIndex = 0;
        notesOpen = false;
        highlightMode = false;
        if (highlightBtn) {
          highlightBtn.setAttribute("aria-pressed", "false");
          highlightBtn.classList.remove("active");
        }
        if (notesBtn) {
          notesBtn.setAttribute("aria-pressed", "false");
          notesBtn.classList.remove("active");
        }
        renderCurrentQuestion();
      }
      closeToolsMenu();
    });
  }

}

function closeToolsMenu() {
  const menu = document.querySelector(".focus-tools-menu");
  if (menu) menu.open = false;
}

function displayBrandText(value) {
  return String(value || "").replace(/\bStudo\b/g, "Chee Skool");
}

function passagePanelHtml() {
  const meta = currentQuiz.description || [currentQuiz.topic, `${activeQuestions().length} questions`].filter(Boolean).join(" · ");
  const basePassageMarkup = renderPassageParagraphs(currentQuiz.passage);
  const savedPassage = Store.getPassageHighlights ? Store.getPassageHighlights(currentQuiz.id) : "";
  const passageMarkup = savedPassage ? sanitizeHighlightMarkup(savedPassage, basePassageMarkup) : basePassageMarkup;
  return `
    <aside class="reading-column" aria-label="Reading passage">
      <header class="passage-heading">
        <h1>${escapeHtml(currentQuiz.title)}</h1>
        ${meta ? `<p>${escapeHtml(meta.replace(/\s+-\s+/g, " · "))}</p>` : ""}
      </header>
      <section class="reading-panel reading-panel-clean">
        <div class="reading-scroll">
          <div class="passage-text passage-numbered">${passageMarkup}</div>
        </div>
        ${currentQuiz.source ? `<div class="source-credit">${currentQuiz.sourceUrl ? `<a href="${escapeAttr(safeHref(currentQuiz.sourceUrl))}" target="_blank" rel="noopener">${escapeHtml(displayBrandText(currentQuiz.source))}</a>` : escapeHtml(displayBrandText(currentQuiz.source))}</div>` : ""}
      </section>
    </aside>
  `;
}

function renderPassageParagraphs(text) {
  const paragraphs = String(text || "").trim().split(/\n\s*\n+/).filter(Boolean);
  if (paragraphs.length <= 1) return `<p class="passage-paragraph"><span class="passage-paragraph-number">1</span><span>${escapeHtml(text || "")}</span></p>`;
  return paragraphs.map((paragraph, index) => `
    <p class="passage-paragraph">
      <span class="passage-paragraph-number">${index + 1}</span>
      <span>${escapeHtml(paragraph)}</span>
    </p>`).join("");
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
        <h2>No questions are available.</h2>
        <p>Reset this practice if you want to clear saved work on this device.</p>
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
  const basePromptHtml = q.type === "grammar_edit" ? renderGrammarPrompt(q, null) : escapeHtml(q.prompt);
  const promptHtml = highlights[q.id] ? sanitizeHighlightMarkup(highlights[q.id], basePromptHtml) : basePromptHtml;

  stage.innerHTML = `
    <div class="question-topline question-topline-clean">
      <span class="question-number">Question ${currentIndex + 1} of ${items.length}</span>
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
      <small class="notes-save-status">Saved automatically on this device.</small>
    </div>
  `;

  const promptEl = stage.querySelector('[data-role="prompt"]');
  promptEl.addEventListener("mouseup", () => handleHighlight(promptEl, q.id, false));
  promptEl.addEventListener("click", (event) => removeHighlightOnClick(event, promptEl, q.id, false));

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
    <button class="question-nav-btn secondary" id="prev-question" ${currentIndex === 0 ? "disabled" : ""}>Previous</button>
    <span class="question-footer-position">${currentIndex + 1} / ${items.length}</span>
    <button class="question-nav-btn primary" id="next-question">${currentIndex === items.length - 1 ? "Finish" : "Next"}</button>
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

function sanitizeHighlightMarkup(savedHtml, fallbackHtml) {
  const saved = document.createElement("template");
  const fallback = document.createElement("template");
  saved.innerHTML = String(savedHtml || "");
  fallback.innerHTML = String(fallbackHtml || "");
  if (saved.content.textContent !== fallback.content.textContent) return fallbackHtml;

  const allowed = new Set(["P", "SPAN", "MARK", "BR"]);
  const classAllowlist = new Set(["passage-paragraph", "passage-paragraph-number", "grammar-blank", "hl"]);
  [...saved.content.querySelectorAll("*")].forEach((el) => {
    if (!allowed.has(el.tagName)) {
      el.replaceWith(document.createTextNode(el.textContent || ""));
      return;
    }
    const safeClasses = [...el.classList].filter((name) => classAllowlist.has(name));
    [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
    if (safeClasses.length) el.className = safeClasses.join(" ");
    if (el.tagName === "MARK" && !safeClasses.includes("hl")) el.className = "hl";
  });
  return saved.innerHTML;
}

function handleHighlight(container, questionId, isPassage = false) {
  if (!highlightMode) return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return;
  const range = selection.getRangeAt(0);
  if (range.commonAncestorContainer.parentElement?.closest("mark.hl")) return;
  const mark = document.createElement("mark");
  mark.className = "hl";
  try {
    range.surroundContents(mark);
  } catch (e) {
    setToolStatus("Select text within one paragraph to highlight it.");
    return;
  }
  selection.removeAllRanges();
  saveHighlightMarkup(container, questionId, isPassage);
  setStatus("Highlight saved on this device.");
  setToolStatus("Highlight saved. Click a highlight to remove it.");
}

function removeHighlightOnClick(event, container, questionId, isPassage = false) {
  if (!highlightMode) return;
  const mark = event.target.closest?.("mark.hl");
  if (!mark || !container.contains(mark)) return;
  const parent = mark.parentNode;
  while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
  parent.removeChild(mark);
  parent.normalize();
  saveHighlightMarkup(container, questionId, isPassage);
  setToolStatus("Highlight removed.");
}

function saveHighlightMarkup(container, questionId, isPassage) {
  if (isPassage && Store.setPassageHighlights) Store.setPassageHighlights(currentQuiz.id, container.innerHTML);
  else Store.setHighlights(currentQuiz.id, questionId, container.innerHTML);
}

function setToolStatus(message) {
  const el = document.getElementById("focus-tool-status");
  if (el) el.textContent = message || "";
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
  const fill = document.getElementById("progress-fill");
  if (fill && items.length) fill.style.width = `${((index + 1) / items.length) * 100}%`;
}

function updateAnswerStatus() {
  updateProgress(activeQuestions(), currentIndex);
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
    <button class="question-nav-btn secondary" id="review-first">Review from start</button>
    <span class="question-footer-position">Complete</span>
    <a class="question-nav-btn primary" href="${escapeAttr(document.getElementById("focus-exit").href)}">Back to practice</a>`;
  document.getElementById("review-first").addEventListener("click", () => {
    currentIndex = 0;
    renderCurrentQuestion();
  });

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


function safeHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "#";
  if (raw.startsWith("#")) return raw;
  try {
    const parsed = new URL(raw, window.location.href);
    if (!["http:", "https:"].includes(parsed.protocol)) return "#";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return parsed.href;
    return raw;
  } catch (_) {
    return "#";
  }
}
