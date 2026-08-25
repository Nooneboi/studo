/* Studo RLA Mock/Test V2 — strict fixed-form flow with refresh-safe recovery. */
const MOCK_PREFIX = "sq:rlaMock:";
const MOCK_HISTORY_KEY = "sq:rlaMockAttempts";
const MOCK_ACTIVE_KEY = "sq:rlaMock:activeId";
const CATEGORY_LABELS = { reading: "Reading", arguments: "Arguments", language_conventions: "Language" };
const REPORTING_CATEGORY_LABELS = { "1": "Text Features & Technique", "2": "Evidence & Arguments", "3": "Language Conventions" };
const params = new URLSearchParams(location.search);
const attemptId = params.get("attempt") || "";
const viewEl = document.getElementById("mock-view");
const flagBtn = document.getElementById("flag-btn");
const reviewBtn = document.getElementById("section-review-btn");
let attempt = null;
let modules = [];
let moduleMap = new Map();
let timerHandle = null;
let reviewing = false;

initMock();

async function initMock() {
  if (!attemptId) return renderFatal("No mock attempt was selected.");
  attempt = loadAttempt(attemptId);
  if (!attempt) return renderFatal("This mock attempt could not be recovered on this device.");
  try {
    modules = await Data.loadAllQuizzes();
    moduleMap = new Map(modules.map((m) => [m.id, m]));
    syncErCompletion();
    enforceExpiredStage();
    wireTopControls();
    renderStage();
  } catch (error) {
    console.error(error);
    renderFatal("Chee Skool could not load the questions for this mock.");
  }
}

function wireTopControls() {
  document.getElementById("mock-exit")?.addEventListener("click", (event) => {
    if (attempt.completedAt) return;
    if (!confirm("Leave the mock? Your saved attempt will remain on this device and the active section clock will keep running.")) event.preventDefault();
  });
  flagBtn?.addEventListener("click", toggleCurrentFlag);
  reviewBtn?.addEventListener("click", () => renderSectionReview());
}

function renderStage() {
  stopTimer();
  reviewing = false;
  syncErCompletion();
  if (attempt.stage === "part1" || attempt.stage === "part3" || attempt.stage === "objective") return renderObjectiveStage();
  if (attempt.stage === "er") return renderErStage();
  if (attempt.stage === "break") return renderBreakStage();
  if (attempt.stage === "results") return renderResults();
  renderFatal("This mock has an unknown saved stage.");
}

function currentObjectiveStage() {
  if (attempt.stage === "objective") return attempt.objective;
  return attempt[attempt.stage];
}

function renderObjectiveStage() {
  const stage = currentObjectiveStage();
  if (!stage) return renderFatal("This objective section is missing.");
  if (!stage.startedAt) { stage.startedAt = Date.now(); saveAttempt(); }
  const remaining = MockEngine.remainingSeconds(stage, Date.now());
  if (remaining <= 0 && !stage.submittedAt) return submitObjectiveStage(true);

  showTopControls(true);
  const label = attempt.stage === "part1" ? "Part 1" : attempt.stage === "part3" ? "Part 3" : "Objective Practice";
  setText("mock-part-label", label);
  setText("mock-title", attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock");
  stage.currentIndex = Math.max(0, Math.min(Number(stage.currentIndex || 0), stage.items.length - 1));
  const item = stage.items[stage.currentIndex];
  const module = moduleMap.get(item.moduleId);
  const q = (module?.questions || []).find((x) => x.id === item.questionId);
  if (!module || !q) return renderFatal("One selected mock question could not be loaded.");
  const key = MockEngine.objectiveItemKey(item);
  const saved = stage.answers?.[key] || "";
  const hasPassage = Boolean(module.passage);

  viewEl.innerHTML = `
    <section class="study-workspace mock-objective-workspace${hasPassage ? "" : " no-passage"}">
      <div>${hasPassage ? passageHtml(module, q, saved) : ""}</div>
      <article class="question-panel" aria-label="Mock question">
        <div class="question-stage">
          <div class="mock-question-meta">${escapeHtml(CATEGORY_LABELS[item.category] || item.category)} · ${escapeHtml(module.title || "Question")}</div>
          <div class="q-prompt">${mockPromptHtml(q)}</div>
          <div data-role="answer-area">${answerAreaHtml(q, saved, stage.currentIndex)}</div>
        </div>
        <div class="question-footer">
          <button class="question-nav-btn secondary" id="mock-prev" type="button" ${stage.currentIndex === 0 ? "disabled" : ""}>Previous</button>
          <span class="question-footer-position">${stage.currentIndex + 1} / ${stage.items.length}</span>
          <button class="question-nav-btn primary" id="mock-next" type="button">${stage.currentIndex === stage.items.length - 1 ? "Review section" : "Next"}</button>
        </div>
      </article>
    </section>`;

  bindObjectiveInteraction(q, saved, stage, key);
  document.getElementById("mock-prev")?.addEventListener("click", () => { if (stage.currentIndex > 0) { stage.currentIndex -= 1; saveAttempt(); renderObjectiveStage(); } });
  document.getElementById("mock-next")?.addEventListener("click", () => {
    if (stage.currentIndex < stage.items.length - 1) { stage.currentIndex += 1; saveAttempt(); renderObjectiveStage(); }
    else renderSectionReview();
  });
  updateObjectiveHeader();
  startObjectiveTimer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mockPromptHtml(q) {
  const I = window.QuestionInteractions;
  if (q.type === "grammar_edit" && I?.grammarEditMode(q) === "inline") return "";
  return escapeHtml(q.prompt || "");
}

function mockOptionSelectHtml(q, saved, label) {
  return `<select class="mock-edit-select" aria-label="${escapeAttr(label)}"><option value="">Select an answer…</option>${(q.options || []).map((opt) => `<option value="${escapeAttr(opt.id)}" ${String(saved || "") === String(opt.id) ? "selected" : ""}>${escapeHtml(opt.text)}</option>`).join("")}</select>`;
}

function answerAreaHtml(q, saved, index) {
  const I = window.QuestionInteractions;
  if (["multiple_choice", "evidence_based"].includes(q.type)) {
    return `<fieldset class="options-list" aria-label="Answer choices">${(q.options || []).map((opt) => `<label class="answer-choice"><input class="answer-radio" type="radio" name="mock-answer-${index}" value="${escapeAttr(opt.id)}" ${saved === opt.id ? "checked" : ""}><span class="choice-letter">${escapeHtml(String(opt.id).toUpperCase())}.</span><span class="opt-text">${escapeHtml(opt.text)}</span></label>`).join("")}</fieldset>`;
  }

  if (q.type === "grammar_edit") {
    const mode = I?.grammarEditMode(q) || "revision";
    if (mode === "inline") {
      const parts = I.splitGrammarPrompt(q);
      return `<div class="embedded-edit-question inline-mode mock-inline-edit"><div class="embedded-edit-prompt">${escapeHtml(parts.before)}${mockOptionSelectHtml(q, saved, "Choose the best edit")}${escapeHtml(parts.after)}</div></div>`;
    }
    return `<label class="mock-edit-field"><span>Choose the best revision</span>${mockOptionSelectHtml(q, saved, "Choose the best revision")}</label>`;
  }

  if (q.type === "select_text") {
    return `<div class="select-text-instructions">Select one ${escapeHtml(q.interaction?.selectionMode || "text area")} directly in the passage.</div><div class="interaction-live-status" aria-live="polite"></div>`;
  }

  if (q.type === "drag_sort") {
    const assignments = I?.parseSort(saved || "") || {};
    const zones = q.interaction?.zones || [];
    const items = q.interaction?.items || [];
    const itemHtml = (item) => `<article class="drag-card" draggable="true" aria-grabbed="false" data-drag-item="${escapeAttr(item.id)}"><p>${escapeHtml(item.text)}</p><div class="drag-card-destinations" aria-label="Move this statement">${zones.map((zone) => `<button type="button" data-sort-destination="${escapeAttr(zone.id)}" ${assignments[item.id] === zone.id ? "disabled" : ""}>${escapeHtml(zone.label)}</button>`).join("")}</div></article>`;
    const bankItems = items.filter((item) => !assignments[item.id]).map(itemHtml).join("");
    return `<div class="drag-sort-board"><section class="drag-zone drag-bank" data-sort-zone="__bank__" aria-label="Unsorted statements"><h3>Statements to sort</h3><div class="drag-zone-list" data-sort-list="__bank__">${bankItems}</div></section><div class="drag-zone-grid">${zones.map((zone) => `<section class="drag-zone" data-sort-zone="${escapeAttr(zone.id)}" aria-label="${escapeAttr(zone.label)}"><h3>${escapeHtml(zone.label)}</h3><div class="drag-zone-list" data-sort-list="${escapeAttr(zone.id)}">${items.filter((item) => assignments[item.id] === zone.id).map(itemHtml).join("")}</div></section>`).join("")}</div></div><div class="interaction-live-status" aria-live="polite"></div>`;
  }

  if (q.type === "drag_order") {
    const authored = (q.interaction?.items || []).map((item) => item.id);
    let order = I?.parseOrder(saved || "") || [];
    if (order.length !== authored.length || !authored.every((id) => order.includes(id))) order = [...authored];
    const itemMap = new Map((q.interaction?.items || []).map((item) => [item.id, item]));
    return `<div class="drag-order-list" data-order-list>${order.map((id, position) => { const item = itemMap.get(id) || { id, text:id }; return `<article class="drag-order-row" draggable="true" aria-grabbed="false" data-order-item="${escapeAttr(id)}"><div><span class="order-number">${position + 1}</span><span>${escapeHtml(item.text)}</span></div><div class="order-controls"><button type="button" class="order-control" data-order-up aria-label="Move ${escapeAttr(item.text)} up" ${position === 0 ? "disabled" : ""}>↑</button><button type="button" class="order-control" data-order-down aria-label="Move ${escapeAttr(item.text)} down" ${position === order.length - 1 ? "disabled" : ""}>↓</button></div></article>`; }).join("")}</div><div class="interaction-live-status" aria-live="polite"></div>`;
  }

  return `<div class="empty-state">This question cannot be displayed in the current mock.</div>`;
}

function passageHtml(module, q = null, saved = "") {
  const paragraphs = String(module.passage || "").trim().split(/\n\s*\n+/).filter(Boolean);
  const I = window.QuestionInteractions;
  const passageBody = paragraphs.map((paragraph, i) => {
    if (q?.type !== "select_text" || !I) return `<p class="passage-paragraph"><span class="passage-paragraph-number">${i + 1}</span><span>${escapeHtml(paragraph)}</span></p>`;
    const segments = I.segmentTextTargets(paragraph, q.interaction?.targets || []);
    const content = segments.map((segment) => {
      if (segment.kind !== "target") return escapeHtml(segment.text);
      const selected = String(saved || "") === String(segment.id);
      return `<button type="button" class="select-text-target${selected ? " selected" : ""}" data-select-target="${escapeAttr(segment.id)}" aria-pressed="${selected ? "true" : "false"}">${escapeHtml(segment.text)}</button>`;
    }).join("");
    return `<p class="passage-paragraph"><span class="passage-paragraph-number">${i + 1}</span><span>${content}</span></p>`;
  }).join("");
  return `<aside class="reading-column test-reading-column" aria-label="Source passage"><header class="passage-heading passage-heading-test"><h1>${escapeHtml(module.title)}</h1><p>${escapeHtml(module.description || "")}</p></header><section class="reading-panel reading-panel-clean"><div class="reading-scroll"><div class="passage-text passage-numbered">${passageBody}</div></div>${module.source ? `<div class="source-credit">${escapeHtml(module.source)}</div>` : ""}</section></aside>`;
}

function persistObjectiveAnswer(stage, key, q, value) {
  const I = window.QuestionInteractions;
  const canonical = I?.canonicalizeAnswer ? I.canonicalizeAnswer(q, value) : String(value ?? "").trim();
  if (canonical) stage.answers[key] = canonical;
  else delete stage.answers[key];
  saveAttempt();
  updateObjectiveHeader();
}

function bindObjectiveInteraction(q, saved, stage, key) {
  const I = window.QuestionInteractions;
  viewEl.querySelectorAll(".answer-radio").forEach((radio) => radio.addEventListener("change", () => {
    if (!radio.checked || stage.locked) return;
    persistObjectiveAnswer(stage, key, q, radio.value);
  }));

  viewEl.querySelectorAll(".mock-edit-select").forEach((select) => select.addEventListener("change", () => {
    if (stage.locked) return;
    persistObjectiveAnswer(stage, key, q, select.value);
  }));

  if (q.type === "select_text") {
    const live = viewEl.querySelector(".interaction-live-status");
    const targets = [...viewEl.querySelectorAll("[data-select-target]")];
    targets.forEach((target) => target.addEventListener("click", () => {
      if (stage.locked) return;
      const id = target.dataset.selectTarget;
      targets.forEach((button) => {
        const active = button.dataset.selectTarget === id;
        button.classList.toggle("selected", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      persistObjectiveAnswer(stage, key, q, id);
      const authored = (q.interaction?.targets || []).find((entry) => entry.id === id);
      if (live) live.textContent = authored ? `Selected: ${authored.text}` : "Selection updated.";
    }));
  }

  if (q.type === "drag_sort" && I) bindMockDragSort(q, saved, stage, key);
  if (q.type === "drag_order" && I) bindMockDragOrder(q, saved, stage, key);
}

function bindMockDragSort(q, saved, stage, key) {
  const I = window.QuestionInteractions;
  const assignments = I.parseSort(saved || "");
  const zones = q.interaction?.zones || [];
  const items = q.interaction?.items || [];
  const live = viewEl.querySelector(".interaction-live-status");

  const moveCard = (itemId, zoneId) => {
    if (stage.locked || !itemId || !zones.some((zone) => zone.id === zoneId)) return;
    assignments[itemId] = zoneId;
    const card = viewEl.querySelector(`[data-drag-item="${cssEscape(itemId)}"]`);
    const list = viewEl.querySelector(`[data-sort-list="${cssEscape(zoneId)}"]`);
    if (card && list) list.appendChild(card);
    card?.querySelectorAll("[data-sort-destination]").forEach((button) => { button.disabled = button.dataset.sortDestination === zoneId; });
    persistObjectiveAnswer(stage, key, q, I.serializeSort(assignments));
    const item = items.find((entry) => entry.id === itemId);
    const zone = zones.find((entry) => entry.id === zoneId);
    if (live) live.textContent = `Moved ${item?.text || "item"} to ${zone?.label || zoneId}.`;
  };

  viewEl.querySelectorAll("[data-sort-destination]").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest("[data-drag-item]");
    moveCard(card?.dataset.dragItem, button.dataset.sortDestination);
  }));
  viewEl.querySelectorAll("[data-drag-item]").forEach((card) => {
    card.addEventListener("dragstart", (event) => { card.setAttribute("aria-grabbed", "true"); event.dataTransfer?.setData("text/plain", card.dataset.dragItem); if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"; });
    card.addEventListener("dragend", () => card.setAttribute("aria-grabbed", "false"));
  });
  viewEl.querySelectorAll("[data-sort-zone]").forEach((zone) => {
    if (zone.dataset.sortZone === "__bank__") return;
    zone.addEventListener("dragover", (event) => event.preventDefault());
    zone.addEventListener("drop", (event) => { event.preventDefault(); const itemId = event.dataTransfer?.getData("text/plain"); if (itemId) moveCard(itemId, zone.dataset.sortZone); });
  });
}

function bindMockDragOrder(q, saved, stage, key) {
  const I = window.QuestionInteractions;
  const authored = (q.interaction?.items || []).map((item) => item.id);
  let order = I.parseOrder(saved || "");
  if (order.length !== authored.length || !authored.every((id) => order.includes(id))) order = [...authored];
  const itemMap = new Map((q.interaction?.items || []).map((item) => [item.id, item]));
  const list = viewEl.querySelector("[data-order-list]");
  const live = viewEl.querySelector(".interaction-live-status");

  const persist = () => persistObjectiveAnswer(stage, key, q, I.serializeOrder(order));
  const draw = () => {
    if (!list) return;
    list.innerHTML = order.map((id, position) => { const item = itemMap.get(id) || { id, text:id }; return `<article class="drag-order-row" draggable="true" aria-grabbed="false" data-order-item="${escapeAttr(id)}"><div><span class="order-number">${position + 1}</span><span>${escapeHtml(item.text)}</span></div><div class="order-controls"><button type="button" class="order-control" data-order-up aria-label="Move ${escapeAttr(item.text)} up" ${position === 0 ? "disabled" : ""}>↑</button><button type="button" class="order-control" data-order-down aria-label="Move ${escapeAttr(item.text)} down" ${position === order.length - 1 ? "disabled" : ""}>↓</button></div></article>`; }).join("");
    list.querySelectorAll("[data-order-up], [data-order-down]").forEach((button) => button.addEventListener("click", () => {
      const row = button.closest("[data-order-item]");
      const id = row?.dataset.orderItem;
      order = I.moveOrder(order, id, button.hasAttribute("data-order-up") ? -1 : 1);
      persist();
      if (live) live.textContent = `Moved ${itemMap.get(id)?.text || "item"}.`;
      draw();
    }));
    list.querySelectorAll("[data-order-item]").forEach((row) => {
      row.addEventListener("dragstart", (event) => { row.setAttribute("aria-grabbed", "true"); event.dataTransfer?.setData("text/plain", row.dataset.orderItem); if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"; });
      row.addEventListener("dragend", () => row.setAttribute("aria-grabbed", "false"));
      row.addEventListener("dragover", (event) => event.preventDefault());
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        const dragged = event.dataTransfer?.getData("text/plain");
        const target = row.dataset.orderItem;
        if (!dragged || dragged === target) return;
        const from = order.indexOf(dragged); const to = order.indexOf(target);
        if (from < 0 || to < 0) return;
        order.splice(from, 1); order.splice(to, 0, dragged); persist();
        if (live) live.textContent = `Moved ${itemMap.get(dragged)?.text || "item"}.`;
        draw();
      });
    });
  };
  draw();
}

function toggleCurrentFlag() {
  if (!attempt || !["part1", "part3", "objective"].includes(attempt.stage) || reviewing) return;
  const stage = currentObjectiveStage();
  const item = stage.items[stage.currentIndex];
  const key = MockEngine.objectiveItemKey(item);
  stage.flags[key] = !stage.flags?.[key];
  saveAttempt();
  updateObjectiveHeader();
}

function updateObjectiveHeader() {
  if (!attempt || !["part1", "part3", "objective"].includes(attempt.stage)) return;
  const stage = currentObjectiveStage();
  const item = stage.items[stage.currentIndex];
  const key = MockEngine.objectiveItemKey(item);
  const answered = stage.items.filter((entry) => { const module = moduleMap.get(entry.moduleId); const question = (module?.questions || []).find((x) => x.id === entry.questionId); return objectiveAnswerComplete(question, stage.answers?.[MockEngine.objectiveItemKey(entry)]); }).length;
  setText("mock-progress", reviewing ? `Review · ${answered}/${stage.items.length} answered` : `Question ${stage.currentIndex + 1} of ${stage.items.length}`);
  const fill = document.getElementById("mock-progress-fill");
  if (fill) fill.style.width = `${reviewing ? 100 : ((stage.currentIndex + 1) / stage.items.length) * 100}%`;
  if (flagBtn) {
    const flagged = Boolean(stage.flags?.[key]);
    flagBtn.hidden = reviewing;
    flagBtn.classList.toggle("active", flagged);
    flagBtn.setAttribute("aria-pressed", String(flagged));
    flagBtn.textContent = flagged ? "Flagged" : "Flag for review";
  }
  if (reviewBtn) reviewBtn.hidden = reviewing;
}

function renderSectionReview() {
  if (!["part1", "part3", "objective"].includes(attempt.stage)) return;
  reviewing = true;
  const stage = currentObjectiveStage();
  const answered = stage.items.filter((item) => { const module = moduleMap.get(item.moduleId); const question = (module?.questions || []).find((x) => x.id === item.questionId); return objectiveAnswerComplete(question, stage.answers?.[MockEngine.objectiveItemKey(item)]); }).length;
  showTopControls(true);
  if (flagBtn) flagBtn.hidden = true;
  if (reviewBtn) reviewBtn.hidden = true;
  setText("mock-progress", `Review · ${answered}/${stage.items.length} answered`);
  viewEl.innerHTML = `<section class="test-review mock-section-review"><div class="test-review-head"><span class="question-number">Section review</span><h1>Check before you submit</h1><p>Answers stay hidden. Return to any unanswered or flagged question before locking this section.</p></div><div class="mock-navigator">${stage.items.map((item, index) => {
    const key = MockEngine.objectiveItemKey(item); const module = moduleMap.get(item.moduleId); const question = (module?.questions || []).find((x) => x.id === item.questionId); const isAnswered = objectiveAnswerComplete(question, stage.answers?.[key]); const isFlagged = Boolean(stage.flags?.[key]);
    return `<button type="button" class="mock-nav-cell${isAnswered ? " answered" : " unanswered"}${isFlagged ? " flagged" : ""}" data-index="${index}"><strong>${index + 1}</strong><span>${isFlagged ? "Flagged" : isAnswered ? "Answered" : "Unanswered"}</span></button>`;
  }).join("")}</div><div class="test-review-actions"><button class="question-nav-btn secondary" id="review-back" type="button">Back to questions</button><button class="question-nav-btn primary" id="review-submit" type="button">Submit section</button></div></section>`;
  viewEl.querySelectorAll("[data-index]").forEach((btn) => btn.addEventListener("click", () => { stage.currentIndex = Number(btn.dataset.index); saveAttempt(); renderObjectiveStage(); }));
  document.getElementById("review-back")?.addEventListener("click", () => renderObjectiveStage());
  document.getElementById("review-submit")?.addEventListener("click", () => submitObjectiveStage(false));
  startObjectiveTimer();
}

function submitObjectiveStage(timedOut) {
  stopTimer();
  const stage = currentObjectiveStage();
  if (!stage || stage.submittedAt) return;
  const unanswered = stage.items.filter((item) => { const module = moduleMap.get(item.moduleId); const question = (module?.questions || []).find((x) => x.id === item.questionId); return !objectiveAnswerComplete(question, stage.answers?.[MockEngine.objectiveItemKey(item)]); }).length;
  if (!timedOut && unanswered && !confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Submit this section anyway? You cannot return after submitting.`)) return;
  stage.submittedAt = new Date().toISOString();
  stage.locked = true;
  if (attempt.mode === "objective") return completeAttempt(timedOut);
  if (attempt.stage === "part1") {
    attempt.stage = "er";
    saveAttempt();
    renderStage();
  } else if (attempt.stage === "part3") completeAttempt(timedOut);
}

function renderErStage() {
  showTopControls(false);
  setText("mock-part-label", "Part 2");
  setText("mock-title", "Extended Response");
  setText("mock-clock", "45:00");
  const erState = loadMockErState();
  const hasDraft = Boolean(erState);
  viewEl.innerHTML = `<section class="mock-transition-screen"><span class="mock-option-label">Part 2 · 45 minutes</span><h1>Extended Response</h1><p>This Full RLA Mock uses one unseen paired-source writing prompt. The essay is not automatically scored; after submission, your three rubric traits remain clearly labeled as Self-review.</p><div class="mock-transition-notes"><span>Read both sources</span><span>Choose the better-supported argument</span><span>Use specific evidence</span></div><button class="btn" id="launch-er" type="button">${hasDraft ? "Continue Extended Response" : "Start Extended Response"}</button><p class="mock-disclaimer">The 45-minute ER clock starts when the writing workspace opens and continues across refreshes.</p></section>`;
  document.getElementById("launch-er")?.addEventListener("click", () => {
    if (!attempt.er.launchedAt) attempt.er.launchedAt = new Date().toISOString();
    saveAttempt();
    const ret = `test.html?attempt=${encodeURIComponent(attempt.attemptId)}`;
    location.href = `extended-response.html?prompt=${encodeURIComponent(attempt.er.promptId)}&mode=timed&attempt=${encodeURIComponent(attempt.attemptId)}&return=${encodeURIComponent(ret)}`;
  });
}

function syncErCompletion() {
  if (!attempt || attempt.mode === "objective" || attempt.stage !== "er") return;
  const erState = loadMockErState();
  if (erState?.submittedAt && !attempt.er.completedAt) {
    attempt.er.completedAt = erState.submittedAt;
    attempt.stage = "break";
    attempt.break.startedAt = Date.now();
    saveAttempt();
  }
}

function loadMockErState() {
  if (!attempt?.er?.promptId) return null;
  try { return JSON.parse(getValue(`sq:er:mock:${attempt.attemptId}:${attempt.er.promptId}`) || "null"); } catch (_) { return null; }
}

function renderBreakStage() {
  showTopControls(false);
  if (!attempt.break.startedAt) { attempt.break.startedAt = Date.now(); saveAttempt(); }
  setText("mock-part-label", "Break"); setText("mock-title", "10-minute break");
  viewEl.innerHTML = `<section class="mock-transition-screen"><span class="mock-option-label">Between Parts 2 and 3</span><h1>Take the intended break</h1><div class="mock-break-clock" id="break-clock">10:00</div><p>Part 3 keeps its full 65 minutes whether you use the whole break or continue early.</p><button class="btn secondary" id="continue-part3" type="button">Continue to Part 3 now</button></section>`;
  const update = () => {
    const elapsed = Math.floor((Date.now() - Number(attempt.break.startedAt)) / 1000);
    const remaining = Math.max(0, Number(attempt.break.seconds) - elapsed);
    setText("mock-clock", formatTime(remaining)); setText("break-clock", formatTime(remaining));
    if (remaining <= 0) startPart3();
  };
  update(); timerHandle = setInterval(update, 1000);
  document.getElementById("continue-part3")?.addEventListener("click", () => { if (confirm("Continue early? Part 3 will begin immediately with its full 65-minute timer.")) startPart3(); });
}

function startPart3() {
  if (attempt.stage !== "break") return;
  stopTimer(); attempt.break.completedAt = new Date().toISOString(); attempt.stage = "part3"; attempt.part3.startedAt = Date.now(); saveAttempt(); renderStage();
}

function completeAttempt(timedOut) {
  stopTimer();
  attempt.objectiveScore = MockEngine.scoreObjectiveAttempt(attempt, moduleMap);
  attempt.completedAt = new Date().toISOString();
  attempt.stage = "results";
  attempt.timedOut = Boolean(timedOut);
  saveAttempt();
  archiveAttempt();
  removeValue(MOCK_ACTIVE_KEY);
  renderResults();
}

function renderResults() {
  showTopControls(false);
  const score = attempt.objectiveScore || MockEngine.scoreObjectiveAttempt(attempt, moduleMap);
  setText("mock-part-label", "Results"); setText("mock-title", attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock"); setText("mock-clock", "Done");
  const erState = attempt.mode === "objective" ? null : loadMockErState();
  const erScores = erState?.selfScores || {};
  const erText = [erScores.argument, erScores.organization, erScores.english].every(Number.isInteger) ? `${erScores.argument} / ${erScores.organization} / ${erScores.english}` : "Not self-reviewed yet";
  const timeUsed = attempt.mode === "objective"
    ? [["Objective section", MockEngine.stageTimeUsedSeconds(attempt.objective)]]
    : [["Part 1", MockEngine.stageTimeUsedSeconds(attempt.part1)], ["Extended Response", erState ? MockEngine.stageTimeUsedSeconds({ seconds: 2700, startedAt: erState.startedAt, submittedAt: erState.submittedAt }) : null], ["Part 3", MockEngine.stageTimeUsedSeconds(attempt.part3)]];
  const skillRows = Object.values(score.skills || {}).sort((a, b) => a.accuracy - b.accuracy || b.total - a.total || a.label.localeCompare(b.label));
  const resultBuckets = attempt.mode === "objective" ? score.domains : score.reportingCategories;
  const resultLabels = attempt.mode === "objective" ? CATEGORY_LABELS : REPORTING_CATEGORY_LABELS;
  viewEl.innerHTML = `<section class="mock-results"><div class="page-kicker">Raw objective result</div><h1>${score.correct} / ${score.total} correct</h1><p class="mock-results-lede">${score.accuracy}% objective accuracy. This is raw Chee Skool practice evidence, not an official GED score or pass prediction.</p><div class="mock-results-grid">${Object.entries(resultBuckets || {}).map(([key, bucket]) => `<div><span>${escapeHtml(resultLabels[key] || key)}</span><strong>${bucket.correct}/${bucket.total}</strong><small>${bucket.accuracy}%</small></div>`).join("")}</div><div class="mock-result-details"><span><strong>${score.unanswered}</strong> unanswered</span><span><strong>${score.flagged}</strong> flagged at submission</span></div><div class="mock-time-used"><strong>Time used</strong>${timeUsed.map(([label, seconds]) => `<span>${escapeHtml(label)}: ${escapeHtml(seconds == null ? "Not recorded" : formatDuration(seconds))}</span>`).join("")}</div>${skillRows.length ? `<details class="mock-skill-review"><summary>Skill breakdown</summary><div class="mock-skill-grid">${skillRows.map((bucket) => `<div><span>${escapeHtml(bucket.label)}</span><strong>${bucket.correct}/${bucket.total}</strong><small>${bucket.accuracy}%</small></div>`).join("")}</div></details>` : ""}${attempt.mode === "objective" ? "" : `<section class="mock-er-result"><span class="mock-option-label">Extended Response · Self-review</span><h2>T1 / T2 / T3: ${escapeHtml(erText)}</h2><p>These trait levels are your own rubric review and are kept separate from the objective result.</p><a class="btn secondary small" href="extended-response.html?prompt=${encodeURIComponent(attempt.er.promptId)}&mode=timed&attempt=${encodeURIComponent(attempt.attemptId)}&return=${encodeURIComponent(`test.html?attempt=${attempt.attemptId}`)}">Review ER response</a></section>`}<details class="mock-answer-review"><summary>Review objective answers</summary><p class="mock-review-note">Answer explanations are available only after the test is complete.</p>${objectiveAnswerReviewHtml()}</details><div class="mock-results-actions"><a class="btn" href="quiz.html">Back to test practice</a><a class="btn secondary" href="progress.html">Open Progress</a></div></section>`;
}

function objectiveAnswerReviewHtml() {
  const stages = attempt.mode === "objective" ? [attempt.objective] : [attempt.part1, attempt.part3];
  const I = window.QuestionInteractions;
  let number = 0;
  return stages.flatMap((stage) => (stage?.items || []).map((item) => {
    number += 1;
    const module = moduleMap.get(item.moduleId);
    const q = (module?.questions || []).find((x) => x.id === item.questionId);
    if (!q) return "";
    const key = MockEngine.objectiveItemKey(item);
    const value = stage.answers?.[key];
    const supported = Boolean(I?.SUPPORTED_TYPES?.has(q.type));
    const isCorrect = supported ? I.isCorrect(q, value) : (value != null && String(value) === String(q.correct));
    const selected = (q.options || []).find((opt) => String(opt.id) === String(value));
    const yourAnswer = supported ? I.formatAnswer(q, value) : (selected?.text || String(value || "No answer"));
    const correctAnswer = supported ? I.formatAnswer(q, q.correct) : String(q.correct || "");
    const explanationText = q.explanation?.whyCorrect || (typeof q.explanation === "string" ? q.explanation : "Review the source and compare the evidence more closely.");
    const feedback = isCorrect ? explanationText : (selected?.whyWrong || explanationText);
    const status = !objectiveAnswerComplete(q, value) ? "Unanswered" : isCorrect ? "Correct" : "Incorrect";
    return `<article class="mock-review-item ${isCorrect ? "correct" : "incorrect"}"><div class="mock-review-heading"><span>Question ${number} · ${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}</span><strong>${status}</strong></div><h3>${escapeHtml(module?.title || "Question")}</h3><p>${escapeHtml(q.prompt || "")}</p><dl><div><dt>Your answer</dt><dd>${escapeHtml(yourAnswer)}</dd></div><div><dt>Correct answer</dt><dd>${escapeHtml(correctAnswer)}</dd></div></dl><p class="mock-review-feedback">${escapeHtml(feedback || "")}</p></article>`;
  })).join("");
}

function archiveAttempt() {
  const history = loadHistory();
  const entry = {
    ...MockEngine.sanitizeAttemptForHistory(attempt),
    mode: attempt.mode || "full",
    label: attempt.mode === "objective" ? "Objective RLA Practice Test" : "Full RLA Mock",
    formId: attempt.formId || null,
    reportingCategories: attempt.objectiveScore?.reportingCategories || null,
    timeUsed: attempt.mode === "objective" ? { objective: MockEngine.stageTimeUsedSeconds(attempt.objective) } : { part1: MockEngine.stageTimeUsedSeconds(attempt.part1), er: (() => { const erState = loadMockErState(); return erState ? MockEngine.stageTimeUsedSeconds({ seconds: 2700, startedAt: erState.startedAt, submittedAt: erState.submittedAt }) : null; })(), part3: MockEngine.stageTimeUsedSeconds(attempt.part3) },
    erSelfReview: attempt.mode === "objective" ? null : (loadMockErState()?.selfScores || null)
  };
  const next = [entry, ...history.filter((x) => x.attemptId !== entry.attemptId)].slice(0, 25);
  setValue(MOCK_HISTORY_KEY, JSON.stringify(next));
}

function loadHistory() { try { const x = JSON.parse(getValue(MOCK_HISTORY_KEY) || "[]"); return Array.isArray(x) ? x : []; } catch (_) { return []; } }

function startObjectiveTimer() {
  stopTimer();
  const stage = currentObjectiveStage();
  const update = () => {
    const remaining = MockEngine.remainingSeconds(stage, Date.now());
    setText("mock-clock", formatTime(remaining));
    document.getElementById("mock-clock")?.classList.toggle("urgent", remaining <= 300);
    if (remaining <= 0 && !stage.submittedAt) submitObjectiveStage(true);
  };
  update(); timerHandle = setInterval(update, 1000);
}

function enforceExpiredStage() {
  if (!["part1", "part3", "objective"].includes(attempt.stage)) return;
  const stage = currentObjectiveStage();
  if (stage && !stage.submittedAt && stage.startedAt && MockEngine.remainingSeconds(stage, Date.now()) <= 0) submitObjectiveStage(true);
}

function showTopControls(objective) {
  if (flagBtn) flagBtn.hidden = !objective;
  if (reviewBtn) reviewBtn.hidden = !objective;
  const fill = document.getElementById("mock-progress-fill"); if (fill && !objective) fill.style.width = "0%";
  if (!objective) setText("mock-progress", "");
}
function stopTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }
function saveAttempt() { setValue(`${MOCK_PREFIX}${attempt.attemptId}`, JSON.stringify(attempt)); }
function loadAttempt(id) { try { return JSON.parse(getValue(`${MOCK_PREFIX}${id}`) || "null"); } catch (_) { return null; } }
function getValue(key) { return window.StudoSafeStorage ? window.StudoSafeStorage.get(key) : localStorage.getItem(key); }
function setValue(key, value) { return window.StudoSafeStorage ? window.StudoSafeStorage.set(key, value) : localStorage.setItem(key, value); }
function removeValue(key) { return window.StudoSafeStorage ? window.StudoSafeStorage.remove(key) : localStorage.removeItem(key); }
function hasAnswer(value) { return typeof value === "string" ? Boolean(value.trim()) : value !== undefined && value !== null; }
function objectiveAnswerComplete(question, value) {
  const I = window.QuestionInteractions;
  if (question && I?.SUPPORTED_TYPES?.has(question.type)) return I.hasCompleteAnswer(question, value);
  return hasAnswer(value);
}
function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}
function formatTime(seconds) { const m = Math.floor(Math.max(0, seconds) / 60); const s = Math.max(0, seconds) % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; }
function formatDuration(seconds) { const m = Math.floor(Number(seconds || 0) / 60); const s = Number(seconds || 0) % 60; return `${m}m ${String(s).padStart(2, "0")}s`; }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function renderFatal(message) { stopTimer(); showTopControls(false); viewEl.innerHTML = `<section class="empty-state"><h1>Mock unavailable</h1><p>${escapeHtml(message)}</p><a class="btn" href="quiz.html">Back to test practice</a></section>`; }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g, "&quot;"); }
