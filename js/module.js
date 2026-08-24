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
const guidedRetryUsed = new Set();

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
  const safeReturn = safeLocalReturn(requestedReturn);
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

function isGuidedLearningModule() {
  const practiceTags = currentQuiz?.contentMeta?.curriculum?.practiceTags || [];
  return practiceTags.includes("active-learning");
}

function learningStageFor(q) {
  return ["guided", "apply", "independent"].includes(q?.learningStage) ? q.learningStage : "apply";
}

function guidedHelperText(q) {
  if (q.type === "select_text") return `Choose one ${q.interaction?.selectionMode || "text area"} in the passage.`;
  if (q.type === "drag_sort") return q.interaction?.presentation === "choice_rows" ? "Choose one option for each statement." : "Move each card into the matching group.";
  if (q.type === "drag_order") return "Put the ideas in the order the question asks for.";
  return "";
}

function renderShell() {
  const hasPassage = Boolean(currentQuiz.passage);
  const guided = isGuidedLearningModule();

  viewEl.innerHTML = `
    <div class="study-shell study-shell-clean${guided ? " guided-learning-workspace" : ""}">
      <section class="study-workspace ${hasPassage ? "" : "no-passage"}${guided ? " guided-learning-workspace" : ""}" id="study-workspace">
        ${hasPassage ? passagePanelHtml() : ""}
        <article class="question-panel${guided ? " guided-task-panel" : ""}" aria-label="Question workspace">
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
        Object.keys(confidenceSelections).forEach((key) => delete confidenceSelections[key]);
        guidedRetryUsed.clear();
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
  const guided = isGuidedLearningModule();
  const passageTitle = guided ? (currentQuiz.contentMeta?.passage?.title || currentQuiz.title) : currentQuiz.title;
  const meta = guided
    ? [currentQuiz.topic, `${activeQuestions().length} questions`].filter(Boolean).join(" · ")
    : currentQuiz.description || [currentQuiz.topic, `${activeQuestions().length} questions`].filter(Boolean).join(" · ");
  const basePassageMarkup = renderPassageParagraphs(currentQuiz.passage);
  const savedPassage = Store.getPassageHighlights ? Store.getPassageHighlights(currentQuiz.id) : "";
  const passageMarkup = savedPassage ? sanitizeHighlightMarkup(savedPassage, basePassageMarkup) : basePassageMarkup;
  return `
    <aside class="reading-column" aria-label="Reading passage">
      <header class="passage-heading">
        <h1>${escapeHtml(passageTitle)}</h1>
        ${meta ? `<p>${escapeHtml(meta.replace(/\s+-\s+/g, " · "))}</p>` : ""}
      </header>
      <div class="selection-mode-bar" data-role="selection-mode-bar" hidden aria-live="polite"></div>
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
  const drafts = Store.getInteractionDrafts ? Store.getInteractionDrafts(currentQuiz.id) : {};
  const notes = Store.getNotes(currentQuiz.id);
  const highlights = Store.getHighlights(currentQuiz.id);
  const savedAnswer = answers[q.id];
  const draftAnswer = drafts[q.id] || "";
  const grammarInline = q.type === "grammar_edit" && window.QuestionInteractions?.grammarEditMode(q) === "inline";
  const basePromptHtml = grammarInline ? "" : escapeHtml(q.prompt);
  const promptHtml = highlights[q.id] && basePromptHtml ? sanitizeHighlightMarkup(highlights[q.id], basePromptHtml) : basePromptHtml;

  const guided = isGuidedLearningModule();
  const stageName = learningStageFor(q);
  const helperText = guided ? guidedHelperText(q) : "";
  const guidedNextLocked = guided && !savedAnswer;

  stage.innerHTML = `
    ${guided ? `<div class="guided-stage-line"><span>${currentIndex + 1} of ${items.length}</span><span aria-hidden="true">·</span><strong>${escapeHtml(stageName.toUpperCase())}</strong></div>` : `<div class="question-topline question-topline-clean"><span class="question-number">Question ${currentIndex + 1} of ${items.length}</span></div>`}
    <div class="q-prompt" data-role="prompt">${promptHtml}</div>
    ${helperText ? `<p class="guided-helper">${escapeHtml(helperText)}</p>` : ""}
    <div data-role="answer-area"></div>
    ${isAutoGraded(q) && !guided ? confidencePanelHtml(q, confidenceSelections[q.id] || null) : ""}
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
  if (promptEl && promptEl.textContent.trim()) {
    promptEl.addEventListener("mouseup", () => handleHighlight(promptEl, q.id, false));
    promptEl.addEventListener("click", (event) => removeHighlightOnClick(event, promptEl, q.id, false));
  }

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

  renderPassageForQuestion(q, savedAnswer || draftAnswer);
  renderAnswerArea(q, stage.querySelector('[data-role="answer-area"]'), savedAnswer, draftAnswer);

  footer.innerHTML = `
    <button class="question-nav-btn secondary" id="prev-question" ${currentIndex === 0 ? "disabled" : ""}>Previous</button>
    <span class="question-footer-position">${currentIndex + 1} / ${items.length}</span>
    <button class="question-nav-btn primary" id="next-question" ${guidedNextLocked ? "disabled" : ""}>${currentIndex === items.length - 1 ? "Finish" : "Next"}</button>
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
    select_text: "Select text",
    drag_sort: "Sort",
    drag_order: "Order",
    fill_blank: "Short answer",
    open_ended: "Open response",
    extended_response: "Extended response",
  }[type] || "";
}

function renderGrammarPrompt(q, savedHighlightHtml) {
  if (savedHighlightHtml) return savedHighlightHtml;
  return escapeHtml(q.prompt || "").replace(/\{\{blank\}\}/g, '<span class="grammar-blank">_____</span>');
}

function confidencePanelHtml(q, selectedConfidence, hidden = false) {
  return `
    <div class="confidence-inline" data-role="confidence-panel"${hidden ? " hidden" : ""} aria-label="Optional certainty before answering">
      ${isGuidedLearningModule() ? '<span class="guided-confidence-label">How sure are you?</span>' : ''}
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
  const I = window.QuestionInteractions;
  const sharedType = Boolean(I?.SUPPORTED_TYPES?.has(q.type));
  const selectedDisplay = sharedType ? I.formatAnswer(q, selectedAnswer) : (selectedOption ? answerDisplay(q, selectedOption) : '');
  const correctDisplay = sharedType ? I.formatAnswer(q, q.correct) : (correctOption ? answerDisplay(q, correctOption) : '');

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
  const correctIds = new Set(Array.isArray(q.correct) ? q.correct : [q.correct].filter(Boolean));
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
  if (q.type === 'grammar_edit') return 'Check what the sentence needs—agreement, punctuation, clarity, or structure—before choosing the edit.';
  if (q.type === 'select_text') return 'Choose the exact sentence or phrase that most directly proves the idea in the question.';
  if (q.type === 'drag_sort') return 'Sort by the role each detail plays, not just whether the detail is true.';
  if (q.type === 'drag_order') return 'Order the ideas by the relationship asked for—such as chronology, cause and effect, or argument structure.';
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
  const commonNode = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  if (commonNode?.closest?.("mark.hl")) return;
  if (commonNode?.closest?.(".select-text-target")) {
    setToolStatus("Use the selectable sentence or phrase as the answer target; highlighting stays separate.");
    return;
  }
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

function renderPassageForQuestion(q, selectedAnswer = "") {
  const passageEl = viewEl.querySelector(".passage-text");
  const selectionBar = viewEl.querySelector('[data-role="selection-mode-bar"]');
  if (!passageEl || !currentQuiz?.passage) return;
  const guidedSelect = isGuidedLearningModule() && q.type === "select_text";
  if (selectionBar) {
    selectionBar.hidden = !guidedSelect;
    selectionBar.textContent = guidedSelect ? `SELECT ONE ${(q.interaction?.selectionMode || "text area").toUpperCase()}` : "";
  }

  if (q.type !== "select_text" || !window.QuestionInteractions) {
    const basePassageMarkup = renderPassageParagraphs(currentQuiz.passage);
    const savedPassage = Store.getPassageHighlights ? Store.getPassageHighlights(currentQuiz.id) : "";
    passageEl.innerHTML = savedPassage ? sanitizeHighlightMarkup(savedPassage, basePassageMarkup) : basePassageMarkup;
    return;
  }

  const targets = q.interaction?.targets || [];
  const paragraphs = String(currentQuiz.passage || "").trim().split(/\n\s*\n+/).filter(Boolean);
  passageEl.innerHTML = paragraphs.map((paragraph, index) => {
    const segments = window.QuestionInteractions.segmentTextTargets(paragraph, targets);
    const content = segments.map((segment) => {
      if (segment.kind !== "target") return escapeHtml(segment.text);
      const selected = String(selectedAnswer || "") === String(segment.id);
      return `<button type="button" class="select-text-target${guidedSelect ? " selection-candidate" : ""}${selected ? " selected" : ""}" data-select-target="${escapeAttr(segment.id)}" aria-pressed="${selected ? "true" : "false"}">${escapeHtml(segment.text)}</button>`;
    }).join("");
    return `<p class="passage-paragraph"><span class="passage-paragraph-number">${index + 1}</span><span>${content}</span></p>`;
  }).join("");
}

function interactionDraft(questionId) {
  if (!Store.getInteractionDrafts) return "";
  return Store.getInteractionDrafts(currentQuiz.id)[questionId] || "";
}

function saveInteractionDraft(questionId, value) {
  if (Store.setInteractionDraft) Store.setInteractionDraft(currentQuiz.id, questionId, value);
}

function clearInteractionDraft(questionId) {
  if (Store.clearInteractionDraft) Store.clearInteractionDraft(currentQuiz.id, questionId);
}

function recordPracticeAttempt(q, answer, correct) {
  if (typeof Learning === "undefined") return null;
  return Learning.recordAttempt({
    module: { ...currentQuiz, file: currentModuleFile },
    question: q,
    answer,
    correct,
    mode: "practice",
    elapsedMs: Date.now() - questionOpenedAt,
    file: currentModuleFile,
    confidence: confidenceSelections[q.id] || null,
  });
}

function showQuestionExplanation(q, selectedAnswer) {
  const box = document.querySelector('[data-role="explanation"]');
  if (!box) return;
  box.innerHTML = buildExplanationHtml(q, selectedAnswer);
  box.classList.toggle("visible", Boolean(box.textContent.trim()));
}

function lockInteractionControls(q, container) {
  container.classList.add("answer-locked");
  container.querySelectorAll("button, select").forEach((control) => { control.disabled = true; });
  container.querySelectorAll("[draggable='true']").forEach((item) => {
    item.draggable = false;
    item.setAttribute("aria-grabbed", "false");
  });
  if (q.type === "select_text") {
    viewEl.querySelectorAll("[data-select-target]").forEach((target) => { target.disabled = true; });
  }
}

function unlockGuidedNext() {
  if (!isGuidedLearningModule()) return;
  const next = document.getElementById("next-question");
  if (next) next.disabled = false;
}

function submitInteractiveAnswer(q, answer, container) {
  const I = window.QuestionInteractions;
  if (!I) return false;
  const canonical = I.canonicalizeAnswer(q, answer);
  if (!I.hasCompleteAnswer(q, canonical)) return false;

  const correct = I.isCorrect(q, canonical);
  const firstGuidedMiss = isGuidedLearningModule()
    && learningStageFor(q) === 'guided'
    && !correct
    && !guidedRetryUsed.has(q.id);

  if (firstGuidedMiss) {
    guidedRetryUsed.add(q.id);
    const box = document.querySelector('[data-role="explanation"]');
    if (box) {
      box.innerHTML = `<div class="guided-retry-feedback"><strong>Not quite.</strong><p>${escapeHtml(q.hint || 'Recheck the passage and try once more.')}</p><span>Try once more.</span></div>`;
      box.classList.add('visible');
    }
    setStatus('Not quite — try once more before seeing the full explanation.', false);
    return false;
  }

  Store.setAnswer(currentQuiz.id, q.id, canonical);
  clearInteractionDraft(q.id);
  const learningResult = recordPracticeAttempt(q, canonical, correct);
  showQuestionExplanation(q, canonical);
  showLearningFeedback(learningResult, correct);
  setupMistakeReason(q, correct, learningResult);
  finalizeConfidenceUi(q.id);
  lockInteractionControls(q, container);
  unlockGuidedNext();
  setStatus(correct ? "Correct — review the explanation, then continue." : "Not quite — review the explanation before continuing.");
  questionOpenedAt = Date.now();
  updateAnswerStatus();
  return true;
}

function optionSelectHtml(q, selected, className, label) {
  return `<select class="${className}" aria-label="${escapeAttr(label)}"><option value="">Select an answer…</option>${(q.options || []).map((opt) => `<option value="${escapeAttr(opt.id)}" ${String(selected || "") === String(opt.id) ? "selected" : ""}>${escapeHtml(opt.text)}</option>`).join("")}</select>`;
}

function renderGrammarEditAnswer(q, container, savedAnswer, draftAnswer) {
  const I = window.QuestionInteractions;
  const mode = I?.grammarEditMode(q) || "revision";
  let selected = savedAnswer || draftAnswer || "";
  const checkDisabled = !selected || Boolean(savedAnswer);

  if (mode === "inline") {
    const parts = I.splitGrammarPrompt(q);
    container.innerHTML = `
      <div class="embedded-edit-question inline-mode">
        <div class="embedded-edit-prompt">${escapeHtml(parts.before)}${optionSelectHtml(q, selected, "practice-edit-select", "Choose the best edit")}${escapeHtml(parts.after)}</div>
        <button class="btn interaction-check" type="button" ${checkDisabled ? "disabled" : ""}>Check answer</button>
        <div class="interaction-live-status" aria-live="polite"></div>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="embedded-edit-question revision-mode">
        <label class="practice-edit-field"><span>Choose the best revision</span>${optionSelectHtml(q, selected, "practice-edit-select", "Choose the best revision")}</label>
        <button class="btn interaction-check" type="button" ${checkDisabled ? "disabled" : ""}>Check answer</button>
        <div class="interaction-live-status" aria-live="polite"></div>
      </div>`;
  }

  const select = container.querySelector(".practice-edit-select");
  const check = container.querySelector(".interaction-check");
  const live = container.querySelector(".interaction-live-status");

  if (!savedAnswer) {
    select?.addEventListener("change", () => {
      selected = select.value;
      saveInteractionDraft(q.id, selected);
      check.disabled = !selected;
      if (live) live.textContent = selected ? "Edit selected. Check your answer when ready." : "Choose an edit.";
    });
    check?.addEventListener("click", () => submitInteractiveAnswer(q, selected, container));
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function renderGuidedMultipleChoiceAnswer(q, container, savedAnswer, draftAnswer) {
  let selected = savedAnswer || draftAnswer || "";
  const groupName = `guided-practice-answer-${q.id}`;
  container.innerHTML = `
    <fieldset class="options-list guided-options-list" aria-label="Answer choices">${(q.options || [])
      .map((opt) => `<label class="answer-choice" data-opt="${escapeAttr(opt.id)}"><input class="answer-radio" type="radio" name="${escapeAttr(groupName)}" value="${escapeAttr(opt.id)}" ${selected === opt.id ? "checked" : ""}><span class="choice-letter">${escapeHtml(opt.id.toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`)
      .join("")}</fieldset>
    <div class="guided-primary-action">
      <button class="btn interaction-check" type="button" ${selected && !savedAnswer ? "" : "disabled"}>Check answer</button>
    </div>
    <div class="interaction-live-status" aria-live="polite"></div>`;

  const check = container.querySelector('.interaction-check');
  const live = container.querySelector('.interaction-live-status');

  if (!savedAnswer) {
    container.querySelectorAll('.answer-radio').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        selected = radio.value;
        saveInteractionDraft(q.id, selected);
        if (check) check.disabled = false;
        if (live) live.textContent = 'Answer selected.';
      });
    });
    check?.addEventListener('click', () => {
      if (!selected) return;
      const finalized = submitInteractiveAnswer(q, selected, container);
      if (finalized) {
        revealChoiceFeedback(container, q, selected);
        lockChoiceInputs(container);
      }
    });
  } else {
    revealChoiceFeedback(container, q, savedAnswer);
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockChoiceInputs(container);
  }
}

function renderGuidedSelectTextAnswer(q, container, savedAnswer, draftAnswer) {
  let selected = savedAnswer || draftAnswer || "";
  container.innerHTML = `
    <div class="guided-primary-action">
      <button class="btn interaction-check" type="button" ${selected && !savedAnswer ? "" : "disabled"}>Check answer</button>
    </div>
    <div class="interaction-live-status sr-only" aria-live="polite"></div>`;

  const check = container.querySelector('.interaction-check');
  const live = container.querySelector('.interaction-live-status');
  const targetButtons = [...viewEl.querySelectorAll('[data-select-target]')];

  const applySelection = (id, announce = true) => {
    selected = id;
    targetButtons.forEach((target) => {
      const active = target.dataset.selectTarget === selected;
      target.classList.toggle('selected', active);
      target.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (!savedAnswer) {
      saveInteractionDraft(q.id, selected);
      if (check) check.disabled = !selected;
    }
    if (announce && selected && live) live.textContent = 'Sentence selected. Check your answer when ready.';
  };

  if (selected) applySelection(selected, false);
  if (!savedAnswer) {
    targetButtons.forEach((target) => target.addEventListener('click', () => applySelection(target.dataset.selectTarget)));
    check?.addEventListener('click', () => submitInteractiveAnswer(q, selected, container));
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function guidedZonePresentation(zone) {
  const label = String(zone?.label || 'Category');
  const known = {
    'Helps explain the main point': ['Key to main idea', 'Connects to the whole passage'],
    'Mostly a supporting detail': ['Specific detail', 'True, but not central'],
    'Too narrow / just a detail': ['Too narrow', 'Just one detail'],
    'Too broad or unsupported': ['Too broad', 'Adds or overstates'],
    'Fits the whole passage': ['Fits the passage', 'Covers the whole text'],
  };
  const [title, note] = known[label] || [label, 'Choose this category'];
  return { title, note };
}

function renderGuidedChoiceRows(q, container, savedAnswer, draftAnswer) {
  const I = window.QuestionInteractions;
  const assignments = I.parseSort(savedAnswer || draftAnswer || '');
  const zones = q.interaction?.zones || [];
  const items = q.interaction?.items || [];
  const correctAssignments = I.parseSort(q.correct || '');

  const zoneButtons = (item) => zones.map((zone) => {
    const label = guidedZonePresentation(zone);
    const active = assignments[item.id] === zone.id;
    const isCorrect = Boolean(savedAnswer) && correctAssignments[item.id] === zone.id;
    const isWrong = Boolean(savedAnswer) && active && !isCorrect;
    const classes = [
      'guided-choice-option',
      active ? 'active' : '',
      isCorrect ? 'correct-answer' : '',
      isWrong ? 'incorrect-answer' : '',
    ].filter(Boolean).join(' ');
    return `<button type="button" class="${classes}" data-choice-zone="${escapeAttr(zone.id)}" aria-pressed="${active ? 'true' : 'false'}" aria-label="${escapeAttr(`${label.title}: ${item.text}`)}" ${savedAnswer ? 'disabled' : ''}>${escapeHtml(label.title)}</button>`;
  }).join('');

  container.innerHTML = `
    <section class="guided-choice-grid" aria-label="Classification activity">
      ${items.map((item) => `
        <article class="guided-choice-row" data-classify-item="${escapeAttr(item.id)}" data-zone-count="${zones.length}">
          <p class="guided-choice-statement">${escapeHtml(item.text)}</p>
          <div class="guided-choice-options" role="group" aria-label="Choose a category for this statement">
            ${zoneButtons(item)}
          </div>
        </article>`).join('')}
    </section>
    <div class="guided-primary-action">
      <button class="btn interaction-check" type="button" ${I.hasCompleteAnswer(q, I.serializeSort(assignments)) && !savedAnswer ? '' : 'disabled'}>Check answer</button>
    </div>
    <div class="interaction-live-status" aria-live="polite"></div>`;

  const check = container.querySelector('.interaction-check');
  const live = container.querySelector('.interaction-live-status');

  const updateCompleteness = () => {
    const canonical = I.serializeSort(assignments);
    if (!savedAnswer) saveInteractionDraft(q.id, canonical);
    const complete = I.hasCompleteAnswer(q, canonical);
    if (check) check.disabled = Boolean(savedAnswer) || !complete;
    return complete;
  };

  if (!savedAnswer) {
    container.querySelectorAll('[data-classify-item]').forEach((row) => {
      const itemId = row.dataset.classifyItem;
      row.querySelectorAll('[data-choice-zone]').forEach((button) => {
        button.addEventListener('click', () => {
          assignments[itemId] = button.dataset.choiceZone;
          row.querySelectorAll('[data-choice-zone]').forEach((peer) => {
            const active = peer === button;
            peer.classList.toggle('active', active);
            peer.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          const complete = updateCompleteness();
          if (live) live.textContent = complete ? 'All statements answered. Check your answers when ready.' : 'Choice saved.';
        });
      });
    });
    check?.addEventListener('click', () => {
      const finalized = submitInteractiveAnswer(q, I.serializeSort(assignments), container);
      if (!finalized) return;
      const correct = I.parseSort(q.correct || '');
      container.querySelectorAll('[data-classify-item]').forEach((row) => {
        const itemId = row.dataset.classifyItem;
        row.querySelectorAll('[data-choice-zone]').forEach((button) => {
          const zoneId = button.dataset.choiceZone;
          const selected = assignments[itemId] === zoneId;
          button.classList.toggle('correct-answer', correct[itemId] === zoneId);
          button.classList.toggle('incorrect-answer', selected && correct[itemId] !== zoneId);
        });
      });
    });
    updateCompleteness();
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function renderGuidedDragSortAnswer(q, container, savedAnswer, draftAnswer) {
  if (q.interaction?.presentation === 'choice_rows') {
    renderGuidedChoiceRows(q, container, savedAnswer, draftAnswer);
    return;
  }
  renderDragSortAnswer(q, container, savedAnswer, draftAnswer);
}

function renderSelectTextAnswer(q, container, savedAnswer, draftAnswer) {
  let selected = savedAnswer || draftAnswer || "";
  container.innerHTML = `
    <div class="select-text-instructions">Select one highlighted ${escapeHtml(q.interaction?.selectionMode || "text area")} in the passage.</div>
    <button class="btn interaction-check" type="button" ${selected && !savedAnswer ? "" : "disabled"}>Check answer</button>
    <div class="interaction-live-status" aria-live="polite"></div>`;

  const check = container.querySelector(".interaction-check");
  const live = container.querySelector(".interaction-live-status");
  const targetButtons = [...viewEl.querySelectorAll("[data-select-target]")];

  const applySelection = (id, announce = true) => {
    selected = id;
    targetButtons.forEach((target) => {
      const active = target.dataset.selectTarget === selected;
      target.classList.toggle("selected", active);
      target.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (!savedAnswer) {
      saveInteractionDraft(q.id, selected);
      if (check) check.disabled = !selected;
    }
    if (announce && live) {
      const target = (q.interaction?.targets || []).find((item) => item.id === selected);
      live.textContent = target ? `Selected: ${target.text}` : "Selection updated.";
    }
  };

  if (selected) applySelection(selected, false);
  if (!savedAnswer) {
    targetButtons.forEach((target) => target.addEventListener("click", () => applySelection(target.dataset.selectTarget)));
    check?.addEventListener("click", () => submitInteractiveAnswer(q, selected, container));
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function renderDragSortAnswer(q, container, savedAnswer, draftAnswer) {
  const I = window.QuestionInteractions;
  const assignments = I.parseSort(savedAnswer || draftAnswer || "");
  const zones = q.interaction?.zones || [];
  const items = q.interaction?.items || [];

  container.innerHTML = `
    <div class="drag-sort-board">
      <section class="drag-zone drag-bank" data-sort-zone="__bank__" aria-label="Unsorted statements">
        <h3>Statements to sort</h3>
        <div class="drag-zone-list" data-sort-list="__bank__"></div>
      </section>
      <div class="drag-zone-grid">
        ${zones.map((zone) => `<section class="drag-zone" data-sort-zone="${escapeAttr(zone.id)}" aria-label="${escapeAttr(zone.label)}"><h3>${escapeHtml(zone.label)}</h3><div class="drag-zone-list" data-sort-list="${escapeAttr(zone.id)}"></div></section>`).join("")}
      </div>
    </div>
    <button class="btn interaction-check" type="button" ${I.hasCompleteAnswer(q, I.serializeSort(assignments)) && !savedAnswer ? "" : "disabled"}>Check answer</button>
    <div class="interaction-live-status" aria-live="polite"></div>`;

  const check = container.querySelector(".interaction-check");
  const live = container.querySelector(".interaction-live-status");

  const cardHtml = (item) => `<article class="drag-card" draggable="${savedAnswer ? "false" : "true"}" aria-grabbed="false" data-drag-item="${escapeAttr(item.id)}">
      <p>${escapeHtml(item.text)}</p>
      <div class="drag-card-destinations" aria-label="Move this statement">
        ${zones.map((zone) => `<button type="button" data-sort-destination="${escapeAttr(zone.id)}" ${assignments[item.id] === zone.id || savedAnswer ? "disabled" : ""}>${escapeHtml(zone.label)}</button>`).join("")}
      </div>
    </article>`;

  items.forEach((item) => {
    const zoneId = assignments[item.id] || "__bank__";
    const list = container.querySelector(`[data-sort-list="${cssEscape(zoneId)}"]`) || container.querySelector('[data-sort-list="__bank__"]');
    list.insertAdjacentHTML("beforeend", cardHtml(item));
  });

  const updateCompleteness = () => {
    const canonical = I.serializeSort(assignments);
    if (!savedAnswer) saveInteractionDraft(q.id, canonical);
    if (check) check.disabled = Boolean(savedAnswer) || !I.hasCompleteAnswer(q, canonical);
  };

  const moveCard = (itemId, zoneId, announce = true) => {
    if (savedAnswer || !zones.some((zone) => zone.id === zoneId)) return;
    assignments[itemId] = zoneId;
    const card = container.querySelector(`[data-drag-item="${cssEscape(itemId)}"]`);
    const list = container.querySelector(`[data-sort-list="${cssEscape(zoneId)}"]`);
    if (card && list) list.appendChild(card);
    if (card) {
      card.querySelectorAll("[data-sort-destination]").forEach((button) => {
        button.disabled = button.dataset.sortDestination === zoneId;
      });
    }
    updateCompleteness();
    if (announce && live) {
      const item = items.find((entry) => entry.id === itemId);
      const zone = zones.find((entry) => entry.id === zoneId);
      live.textContent = `Moved ${item?.text || "item"} to ${zone?.label || zoneId}.`;
    }
  };

  if (!savedAnswer) {
    container.querySelectorAll("[data-sort-destination]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-drag-item]");
        moveCard(card?.dataset.dragItem, button.dataset.sortDestination);
      });
    });
    container.querySelectorAll("[data-drag-item]").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        card.setAttribute("aria-grabbed", "true");
        event.dataTransfer?.setData("text/plain", card.dataset.dragItem);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => card.setAttribute("aria-grabbed", "false"));
    });
    container.querySelectorAll("[data-sort-zone]").forEach((zone) => {
      if (zone.dataset.sortZone === "__bank__") return;
      zone.addEventListener("dragover", (event) => event.preventDefault());
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        const itemId = event.dataTransfer?.getData("text/plain");
        if (itemId) moveCard(itemId, zone.dataset.sortZone);
      });
    });
    check?.addEventListener("click", () => submitInteractiveAnswer(q, I.serializeSort(assignments), container));
    updateCompleteness();
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function renderDragOrderAnswer(q, container, savedAnswer, draftAnswer) {
  const I = window.QuestionInteractions;
  const authored = (q.interaction?.items || []).map((item) => item.id);
  let order = I.parseOrder(savedAnswer || draftAnswer || "");
  if (order.length !== authored.length || !authored.every((id) => order.includes(id))) order = [...authored];
  const items = new Map((q.interaction?.items || []).map((item) => [item.id, item]));

  container.innerHTML = `
    <div class="drag-order-list" data-order-list></div>
    <button class="btn interaction-check" type="button" ${savedAnswer ? "disabled" : ""}>Check answer</button>
    <div class="interaction-live-status" aria-live="polite"></div>`;
  const list = container.querySelector("[data-order-list]");
  const check = container.querySelector(".interaction-check");
  const live = container.querySelector(".interaction-live-status");

  const persistDraft = () => {
    if (!savedAnswer) saveInteractionDraft(q.id, I.serializeOrder(order));
  };

  const drawRows = (focusId = null) => {
    list.innerHTML = order.map((id, index) => {
      const item = items.get(id) || { id, text: id };
      return `<article class="drag-order-row" draggable="${savedAnswer ? "false" : "true"}" aria-grabbed="false" data-order-item="${escapeAttr(id)}">
        <div><span class="order-number">${index + 1}</span><span>${escapeHtml(item.text)}</span></div>
        <div class="order-controls">
          <button type="button" class="order-control" data-order-up aria-label="Move ${escapeAttr(item.text)} up" ${index === 0 || savedAnswer ? "disabled" : ""}>↑</button>
          <button type="button" class="order-control" data-order-down aria-label="Move ${escapeAttr(item.text)} down" ${index === order.length - 1 || savedAnswer ? "disabled" : ""}>↓</button>
        </div>
      </article>`;
    }).join("");

    if (!savedAnswer) {
      list.querySelectorAll("[data-order-up], [data-order-down]").forEach((button) => {
        button.addEventListener("click", () => {
          const row = button.closest("[data-order-item]");
          const itemId = row.dataset.orderItem;
          order = I.moveOrder(order, itemId, button.hasAttribute("data-order-up") ? -1 : 1);
          persistDraft();
          if (live) live.textContent = `Moved ${items.get(itemId)?.text || "item"}.`;
          drawRows(itemId);
        });
      });

      list.querySelectorAll("[data-order-item]").forEach((row) => {
        row.addEventListener("dragstart", (event) => {
          row.setAttribute("aria-grabbed", "true");
          event.dataTransfer?.setData("text/plain", row.dataset.orderItem);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        row.addEventListener("dragend", () => row.setAttribute("aria-grabbed", "false"));
        row.addEventListener("dragover", (event) => event.preventDefault());
        row.addEventListener("drop", (event) => {
          event.preventDefault();
          const dragged = event.dataTransfer?.getData("text/plain");
          const target = row.dataset.orderItem;
          if (!dragged || dragged === target) return;
          const from = order.indexOf(dragged);
          const to = order.indexOf(target);
          if (from < 0 || to < 0) return;
          order.splice(from, 1);
          order.splice(to, 0, dragged);
          persistDraft();
          if (live) live.textContent = `Moved ${items.get(dragged)?.text || "item"}.`;
          drawRows(dragged);
        });
      });
    }

    if (focusId) list.querySelector(`[data-order-item="${cssEscape(focusId)}"] [data-order-up]:not(:disabled), [data-order-item="${cssEscape(focusId)}"] [data-order-down]:not(:disabled)`)?.focus();
  };

  drawRows();
  if (!savedAnswer) {
    check?.addEventListener("click", () => submitInteractiveAnswer(q, I.serializeOrder(order), container));
  } else {
    showQuestionExplanation(q, savedAnswer);
    finalizeConfidenceUi(q.id);
    lockInteractionControls(q, container);
  }
}

function renderAnswerArea(q, container, savedAnswer, draftAnswer = "") {
  const guided = isGuidedLearningModule();
  if (guided && ["multiple_choice", "evidence_based"].includes(q.type)) {
    renderGuidedMultipleChoiceAnswer(q, container, savedAnswer, draftAnswer);
    return;
  }
  if (["multiple_choice", "evidence_based"].includes(q.type)) {
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
        const learningResult = recordPracticeAttempt(q, radio.value, correct);
        revealChoiceFeedback(container, q, radio.value);
        showQuestionExplanation(q, radio.value);
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
      showQuestionExplanation(q, savedAnswer);
      finalizeConfidenceUi(q.id);
      lockChoiceInputs(container);
    }
    return;
  }

  if (q.type === "grammar_edit") {
    renderGrammarEditAnswer(q, container, savedAnswer, draftAnswer);
    return;
  }
  if (q.type === "select_text") {
    if (guided) renderGuidedSelectTextAnswer(q, container, savedAnswer, draftAnswer);
    else renderSelectTextAnswer(q, container, savedAnswer, draftAnswer);
    return;
  }
  if (q.type === "drag_sort") {
    if (guided) renderGuidedDragSortAnswer(q, container, savedAnswer, draftAnswer);
    else renderDragSortAnswer(q, container, savedAnswer, draftAnswer);
    return;
  }
  if (q.type === "drag_order") {
    renderDragOrderAnswer(q, container, savedAnswer, draftAnswer);
    return;
  }

  if (q.type === "fill_blank") {
    container.innerHTML = `<label class="question-detail" for="short-answer">Your answer</label><input id="short-answer" type="text" class="fill-blank-input" autocomplete="off" placeholder="Type your answer" value="${escapeAttr(savedAnswer || "")}">`;
    const input = container.querySelector("input");
    input.addEventListener("input", () => Store.setAnswer(currentQuiz.id, q.id, input.value));
    input.addEventListener("blur", () => {
      if (input.value.trim()) {
        if (typeof q.correct === "string" && typeof Learning !== "undefined") {
          const correct = isCorrectAnswer(q, input.value);
          const learningResult = recordPracticeAttempt(q, input.value, correct);
          showLearningFeedback(learningResult, correct);
          setupMistakeReason(q, correct, learningResult);
          finalizeConfidenceUi(q.id);
          questionOpenedAt = Date.now();
        }
        showQuestionExplanation(q, input.value);
        updateAnswerStatus();
      }
    });
    if (savedAnswer) {
      showQuestionExplanation(q, savedAnswer);
      finalizeConfidenceUi(q.id);
    }
    return;
  }

  container.innerHTML = `<label class="question-detail" for="written-answer">Your response</label><textarea id="written-answer" class="open-ended-input" placeholder="Write your response…">${escapeHtml(savedAnswer || "")}</textarea>`;
  const ta = container.querySelector("textarea");
  ta.addEventListener("input", () => {
    Store.setAnswer(currentQuiz.id, q.id, ta.value);
    updateAnswerStatus();
  });
  ta.addEventListener("blur", () => {
    if (ta.value.trim()) showQuestionExplanation(q, ta.value);
  });
  if (savedAnswer) showQuestionExplanation(q, savedAnswer);
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/(["\\])/g, "\\$1");
}

function lockChoiceInputs(container) {
  container.querySelectorAll('.answer-radio').forEach((radio) => {
    radio.disabled = true;
  });
  container.classList.add('answer-locked');
}

function revealChoiceFeedback(container, q, selectedId) {
  const correctIds = new Set(Array.isArray(q.correct) ? q.correct : [q.correct].filter(Boolean));
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
  if (window.QuestionInteractions?.SUPPORTED_TYPES?.has(q.type)) return true;
  return q.type === "fill_blank" && typeof q.correct === "string";
}

function isCorrectAnswer(q, answer) {
  if (answer == null || answer === "") return false;
  if (window.QuestionInteractions?.SUPPORTED_TYPES?.has(q.type)) return window.QuestionInteractions.isCorrect(q, answer);
  if (q.type === "fill_blank" && typeof q.correct === "string") {
    return String(answer).trim().toLowerCase() === q.correct.trim().toLowerCase();
  }
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


function safeLocalReturn(requestedReturn) {
  if (!requestedReturn) return null;
  try {
    const parsed = new URL(requestedReturn, window.location.href);
    if (parsed.origin !== window.location.origin || parsed.protocol !== window.location.protocol) return null;
    const file = parsed.pathname.split("/").pop() || "";
    if (!/^[A-Za-z0-9._-]+\.html$/.test(file)) return null;
    return `${file}${parsed.search}${parsed.hash}`;
  } catch (_) {
    return null;
  }
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
