/* Extended Response V1 — paired-source drafting + transparent rubric self-review. */
const ER_SECONDS = 2700;
const HISTORY_KEY = "sq:er:history";
const params = new URLSearchParams(location.search);
const promptId = params.get("prompt") || "";
const taskId = params.get("task") || "";
const mode = params.get("mode") === "timed" ? "timed" : "untimed";
const mockAttemptId = params.get("attempt") || "";
const returnHref = safeReturn(params.get("return"));
const STATE_KEY = mockAttemptId ? `sq:er:mock:${mockAttemptId}:${promptId}` : `sq:er:${promptId}:${mode}`;
let prompt = null;
let productionTask = null;
let productionState = null;
let state = null;
let timerHandle = null;
let activeSource = "A";

init();

async function init() {
  document.getElementById("er-exit").href = returnHref;
  if (taskId) {
    await initProductionTask();
    return;
  }
  document.getElementById("er-mode-label").textContent = mode === "timed" ? "Timed practice" : "Untimed practice";
  try {
    const response = await fetch("data/generated/er-prompts.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Prompt bank returned ${response.status}`);
    const data = await response.json();
    prompt = (data.prompts || []).find((item) => item.id === promptId);
    if (!prompt) throw new Error("Prompt not found");
    state = loadState();
    renderWorkspace();
    wireWorkspace();
    updateTimer();
    if (mode === "timed" && !state.submittedAt && state.remainingSeconds > 0) {
      timerHandle = window.setInterval(updateTimer, 1000);
    }
  } catch (error) {
    console.error(error);
    document.getElementById("er-app").innerHTML = `<section class="er-error"><h1>This writing prompt could not be loaded.</h1><p>Return to Extended Response practice and choose another prompt.</p><a class="btn" href="${escapeAttr(returnHref)}">Back to practice</a></section>`;
  }
}


async function initProductionTask() {
  document.getElementById("er-mode-label").textContent = "Production Lab";
  document.getElementById("er-timer").textContent = "Untimed";
  try {
    const [taskResponse, promptResponse] = await Promise.all([
      fetch("data/generated/er-production-tasks.json", { cache: "no-store" }),
      fetch("data/generated/er-prompts.json", { cache: "no-store" }),
    ]);
    if (!taskResponse.ok) throw new Error(`Production task bank returned ${taskResponse.status}`);
    if (!promptResponse.ok) throw new Error(`Prompt bank returned ${promptResponse.status}`);
    const taskData = await taskResponse.json();
    const promptData = await promptResponse.json();
    productionTask = (taskData.tasks || []).find((item) => item.id === taskId);
    if (!productionTask) throw new Error("Production task not found");
    prompt = (promptData.prompts || []).find((item) => item.id === productionTask.promptId);
    if (!prompt) throw new Error("Referenced prompt not found");
    productionState = loadProductionState();
    renderProductionWorkspace();
    wireProductionWorkspace();
  } catch (error) {
    console.error(error);
    document.getElementById("er-app").innerHTML = `<section class="er-error"><h1>This Production Lab task could not be loaded.</h1><p>Return to Extended Response practice and choose another task.</p><a class="btn" href="${escapeAttr(returnHref)}">Back to practice</a></section>`;
  }
}

function productionStorageKey() {
  return `studo.er.production.${productionTask.id}`;
}

function loadProductionState() {
  const base = { draft: "", submittedAt: null, revisionComplete: false };
  const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(productionStorageKey()) : null;
  if (!raw) return base;
  try {
    const saved = JSON.parse(raw);
    return { ...base, ...saved };
  } catch (_) {
    return base;
  }
}

function saveProductionState() {
  if (window.StudoSafeStorage) window.StudoSafeStorage.set(productionStorageKey(), JSON.stringify(productionState));
}

function renderProductionWorkspace() {
  const app = document.getElementById("er-app");
  app.innerHTML = `
    <div class="er-heading er-production-heading">
      <div>
        <div class="page-kicker">Production Lab</div>
        <h1>${escapeHtml(productionTask.title)}</h1>
        <p>${escapeHtml(productionTask.instruction)}</p>
        ${productionTask.sourceFocus ? `<p class="er-production-focus"><strong>Focus:</strong> ${escapeHtml(productionTask.sourceFocus)}</p>` : ""}
      </div>
    </div>
    <div class="er-workspace er-production-workspace">
      <aside class="er-source-panel" aria-label="Source reading panel">
        <div class="er-source-tabs" role="tablist" aria-label="Sources">
          <button type="button" id="er-tab-a" class="er-source-tab active" role="tab" aria-selected="true">Source A</button>
          <button type="button" id="er-tab-b" class="er-source-tab" role="tab" aria-selected="false">Source B</button>
        </div>
        <article id="er-source-copy" class="er-source-copy"></article>
      </aside>
      <section class="er-writing-panel">
        <div class="er-editor-block er-production-editor">
          <div class="er-section-head">
            <div><span class="progress-mini-label">Focused writing</span><h2>Your response</h2></div>
            <span id="er-production-word-count">0 words</span>
          </div>
          <textarea id="er-production-draft" class="er-essay er-production-draft" rows="12" spellcheck="true" aria-label="Production Lab response" placeholder="Write only the part this task asks you to practice..."></textarea>
          <div class="er-editor-actions er-production-actions">
            <span class="er-save-note" id="er-production-save-note">Saved on this device</span>
            <button class="btn" id="er-production-submit" type="button">Submit for review</button>
          </div>
        </div>
        <div id="er-production-review"></div>
      </section>
    </div>`;
  activeSource = "A";
  renderSource();
  const draft = document.getElementById("er-production-draft");
  draft.value = productionState.draft || "";
  updateProductionWordCount();
  if (productionState.submittedAt) renderProductionReview();
}

function wireProductionWorkspace() {
  document.getElementById("er-tab-a").addEventListener("click", () => selectSource("A"));
  document.getElementById("er-tab-b").addEventListener("click", () => selectSource("B"));
  document.getElementById("er-production-draft").addEventListener("input", (event) => {
    productionState.draft = event.target.value;
    productionState.revisionComplete = false;
    saveProductionState();
    updateProductionWordCount();
    const note = document.getElementById("er-production-save-note");
    if (note) note.textContent = "Saved";
  });
  document.getElementById("er-production-submit").addEventListener("click", () => {
    productionState.draft = document.getElementById("er-production-draft").value;
    productionState.submittedAt = new Date().toISOString();
    productionState.revisionComplete = false;
    saveProductionState();
    renderProductionReview();
  });
}

function renderProductionReview() {
  const mount = document.getElementById("er-production-review");
  if (!mount || !productionState.submittedAt) return;
  mount.innerHTML = `
    <section class="er-review-panel er-production-review" aria-labelledby="er-production-review-title">
      <div class="er-section-head"><div><span class="progress-mini-label">Review</span><h2 id="er-production-review-title">Check, compare, revise</h2></div><span>No score</span></div>
      <div class="er-production-criteria">
        <h3>Success criteria</h3>
        <ul>${(productionTask.successCriteria || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <details class="er-model er-production-model" open>
        <summary>Compare with one model</summary>
        <div class="er-model-copy">${paragraphHtml(productionTask.modelResponse)}</div>
      </details>
      <div class="er-revision-box">
        <h3>Revise</h3>
        <ul>${(productionTask.revisionPrompts || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="er-review-actions er-production-review-actions">
        <button class="btn secondary" id="er-production-revise" type="button">Revise response</button>
        <label class="er-revision-check"><input type="checkbox" id="er-production-complete" ${productionState.revisionComplete ? "checked" : ""}> I revised or checked this response.</label>
      </div>
    </section>`;
  document.getElementById("er-production-revise").addEventListener("click", () => {
    const draft = document.getElementById("er-production-draft");
    draft.focus();
  });
  document.getElementById("er-production-complete").addEventListener("change", (event) => {
    productionState.revisionComplete = event.target.checked;
    saveProductionState();
  });
  mount.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProductionWordCount() {
  const words = String(document.getElementById("er-production-draft")?.value || "").trim().match(/\S+/g)?.length || 0;
  const mount = document.getElementById("er-production-word-count");
  if (mount) mount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
}

function defaultState() {
  const now = Date.now();
  return {
    essay: "",
    planner: { stronger: "", reason1: "", evidence1: "", reason2: "", evidence2: "", weakness: "" },
    startedAt: mode === "timed" ? now : null,
    remainingSeconds: mode === "timed" ? ER_SECONDS : null,
    submittedAt: null,
    selfScores: { argument: null, organization: null, english: null },
    revisionComplete: false,
    isRevising: false,
  };
}

function loadState() {
  const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(STATE_KEY) : null;
  if (!raw) return defaultState();
  try {
    const saved = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...saved,
      planner: { ...base.planner, ...(saved.planner || {}) },
      selfScores: { ...base.selfScores, ...(saved.selfScores || {}) },
    };
  } catch (_) {
    return defaultState();
  }
}

function saveState() {
  if (!state) return;
  if (window.StudoSafeStorage) window.StudoSafeStorage.set(STATE_KEY, JSON.stringify(state));
}

function renderWorkspace() {
  const app = document.getElementById("er-app");
  app.innerHTML = `
    <div class="er-heading">
      <div>
        <div class="page-kicker">Full Extended Response</div>
        <h1>${escapeHtml(prompt.title)}</h1>
        <p>${escapeHtml(prompt.prompt)}</p>
      </div>
      <button class="btn ghost small" id="er-planner-toggle" type="button" aria-expanded="true">Hide planner</button>
    </div>
    <div class="er-workspace">
      <aside class="er-source-panel" aria-label="Source reading panel">
        <div class="er-source-tabs" role="tablist" aria-label="Sources">
          <button type="button" id="er-tab-a" class="er-source-tab active" role="tab" aria-selected="true">Source A</button>
          <button type="button" id="er-tab-b" class="er-source-tab" role="tab" aria-selected="false">Source B</button>
        </div>
        <article id="er-source-copy" class="er-source-copy"></article>
      </aside>
      <section class="er-writing-panel">
        <div id="er-planner" class="er-planner" aria-label="Writing planner">
          <div class="er-section-head"><div><span class="progress-mini-label">Planner</span><h2>Map your argument</h2></div><span>Optional</span></div>
          <div class="er-planner-grid">
            ${plannerField("stronger", "Stronger argument", "Source A or Source B - and why?")}
            ${plannerField("reason1", "Reason 1", "First reason this argument is better supported")}
            ${plannerField("evidence1", "Evidence 1", "Specific evidence you can use")}
            ${plannerField("reason2", "Reason 2", "Second reason")}
            ${plannerField("evidence2", "Evidence 2", "Specific evidence you can use")}
            ${plannerField("weakness", "Other source", "Weakness, limitation, or unsupported claim")}
          </div>
        </div>
        <div class="er-editor-block">
          <div class="er-section-head">
            <div><span class="progress-mini-label">Response</span><h2>Your essay</h2></div>
            <span id="er-word-count">0 words</span>
          </div>
          <textarea id="er-essay" class="er-essay" rows="22" spellcheck="true" aria-label="Extended Response essay" placeholder="Write your source-based response here..."></textarea>
          <div id="er-time-up" class="er-time-up" hidden role="alert">Time is up. Your draft is saved. Submit it for self-review.</div>
          <div class="er-editor-actions">
            <span class="er-save-note" id="er-save-note">Saved on this device</span>
            <button class="btn" id="er-submit" type="button">Submit for self-review</button>
          </div>
        </div>
        <div id="er-review"></div>
      </section>
    </div>`;
  renderSource();
  const essay = document.getElementById("er-essay");
  essay.value = state.essay || "";
  Object.entries(state.planner || {}).forEach(([key, value]) => {
    const field = document.querySelector(`[data-planner="${key}"]`);
    if (field) field.value = value || "";
  });
  applyEditorLock();
  updateWordCount();
  if (state.submittedAt) renderReview();
}

function plannerField(key, label, placeholder) {
  return `<label class="er-planner-field"><span>${escapeHtml(label)}</span><textarea rows="3" data-planner="${escapeAttr(key)}" placeholder="${escapeAttr(placeholder)}"></textarea></label>`;
}

function wireWorkspace() {
  document.getElementById("er-tab-a").addEventListener("click", () => selectSource("A"));
  document.getElementById("er-tab-b").addEventListener("click", () => selectSource("B"));
  document.getElementById("er-planner-toggle").addEventListener("click", togglePlanner);
  document.getElementById("er-essay").addEventListener("input", (event) => {
    state.essay = event.target.value;
    saveState();
    updateWordCount();
    flashSaved();
  });
  document.querySelectorAll("[data-planner]").forEach((field) => field.addEventListener("input", (event) => {
    state.planner[event.target.dataset.planner] = event.target.value;
    saveState();
  }));
  document.getElementById("er-submit").addEventListener("click", submitResponse);
}

function selectSource(source) {
  activeSource = source;
  document.getElementById("er-tab-a").classList.toggle("active", source === "A");
  document.getElementById("er-tab-b").classList.toggle("active", source === "B");
  document.getElementById("er-tab-a").setAttribute("aria-selected", String(source === "A"));
  document.getElementById("er-tab-b").setAttribute("aria-selected", String(source === "B"));
  renderSource();
}

function renderSource() {
  const source = activeSource === "A" ? prompt.sourceA : prompt.sourceB;
  const paragraphs = String(source.text || "").split(/\n\s*\n/).filter(Boolean);
  document.getElementById("er-source-copy").innerHTML = `<div class="er-source-label">Source ${activeSource}</div><h2>${escapeHtml(source.title)}</h2>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}<small>${escapeHtml(String(source.attribution || "Original content by Chee Skool").replace(/\bStudo\b/g, "Chee Skool"))}</small>`;
}

function togglePlanner() {
  const panel = document.getElementById("er-planner");
  const button = document.getElementById("er-planner-toggle");
  const hidden = !panel.hidden;
  panel.hidden = hidden;
  button.textContent = hidden ? "Show planner" : "Hide planner";
  button.setAttribute("aria-expanded", String(!hidden));
}

function updateTimer() {
  const timer = document.getElementById("er-timer");
  if (!timer || !state) return;
  if (mode !== "timed") {
    timer.textContent = "Untimed";
    return;
  }
  if (!state.submittedAt && state.startedAt) {
    const elapsed = Math.floor((Date.now() - Number(state.startedAt)) / 1000);
    state.remainingSeconds = Math.max(0, ER_SECONDS - elapsed);
    saveState();
  }
  const remaining = Math.max(0, Number(state.remainingSeconds || 0));
  timer.textContent = formatTime(remaining);
  timer.classList.toggle("urgent", remaining <= 300);
  if (remaining === 0 && !state.submittedAt) {
    if (timerHandle) window.clearInterval(timerHandle);
    timerHandle = null;
    applyEditorLock();
  }
}

function applyEditorLock() {
  const essay = document.getElementById("er-essay");
  const submit = document.getElementById("er-submit");
  const timeUp = document.getElementById("er-time-up");
  const lockedByTime = mode === "timed" && Number(state.remainingSeconds) <= 0 && !state.submittedAt && !state.isRevising;
  const submitted = Boolean(state.submittedAt);
  essay.disabled = lockedByTime || submitted;
  timeUp.hidden = !lockedByTime;
  submit.disabled = submitted;
  submit.textContent = submitted ? "Submitted" : "Submit for self-review";
}

function submitResponse() {
  if (!state.essay.trim() && !(mockAttemptId && mode === "timed" && Number(state.remainingSeconds) <= 0)) {
    document.getElementById("er-essay").focus();
    return;
  }
  if (!state.submittedAt) state.submittedAt = new Date().toISOString();
  state.isRevising = false;
  if (timerHandle) window.clearInterval(timerHandle);
  timerHandle = null;
  saveState();
  upsertHistory();
  applyEditorLock();
  renderReview();
  document.getElementById("er-review").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderReview() {
  if (!state.submittedAt) return;
  const review = document.getElementById("er-review");
  review.innerHTML = `
    <section class="er-review-panel" aria-labelledby="er-review-title">
      <div class="page-kicker">Self-review</div>
      <h2 id="er-review-title">Score the evidence you can see in your response</h2>
      <p class="er-review-intro">These are your own provisional rubric judgments, not an automatic or official score. Use the checklist and model to revise.</p>
      <div class="er-traits">
        ${traitCard("argument", "Trait 1 - Argument & Evidence", ["I clearly chose the better-supported argument.", "I used specific evidence from the sources.", "I explained why the evidence supports my evaluation.", "I compared strengths or weaknesses across both sources."])}
        ${traitCard("organization", "Trait 2 - Development & Organization", ["My thesis controls the response.", "Each paragraph has a clear job.", "Evidence is followed by analysis, not dropped in without explanation.", "Transitions make the reasoning easy to follow."])}
        ${traitCard("english", "Trait 3 - Clarity & Standard English", ["My sentences are complete and understandable.", "Pronouns and verb forms are clear.", "Punctuation helps the reader follow the argument.", "I revised wording that was vague or repetitive."])}
      </div>
      <div class="er-revision-box"><h3>Revision questions</h3><ul>${(prompt.revisionPrompts || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      <details class="er-model" id="er-model"><summary>Compare with the model response</summary><div class="er-model-copy">${paragraphHtml(prompt.modelResponse)}</div>${annotationHtml(prompt.annotations || [])}</details>
      <div class="er-review-actions">
        <label class="er-revision-check"><input type="checkbox" id="er-revision-complete" ${state.revisionComplete ? "checked" : ""}> I revised or deliberately reviewed my response.</label>
        <button class="btn secondary" id="er-revise" type="button">Revise my response</button>
        ${mockAttemptId ? `<a class="btn" href="${escapeAttr(returnHref)}">Return to mock</a>` : ""}
      </div>
    </section>`;
  document.querySelectorAll("[data-trait-score]").forEach((input) => input.addEventListener("change", (event) => {
    state.selfScores[event.target.dataset.traitScore] = Number(event.target.value);
    saveState();
    upsertHistory();
  }));
  document.getElementById("er-revision-complete").addEventListener("change", (event) => {
    state.revisionComplete = event.target.checked;
    saveState();
    upsertHistory();
  });
  document.getElementById("er-revise").addEventListener("click", () => {
    state.submittedAt = null;
    state.revisionComplete = false;
    state.isRevising = true;
    if (mode === "timed") state.remainingSeconds = 0;
    saveState();
    document.getElementById("er-review").innerHTML = "";
    applyEditorLock();
    const essay = document.getElementById("er-essay");
    essay.disabled = false;
    essay.focus();
  });
}

function traitCard(key, title, checks) {
  const selected = state.selfScores?.[key];
  const scale = {
    0: "0 - Not yet: the trait is missing or too unclear to evaluate.",
    1: "1 - Partly: the trait appears, but support or control is uneven.",
    2: "2 - Clear: the trait is developed and consistently supported in the response.",
  };
  return `<fieldset class="er-trait"><legend>${escapeHtml(title)}</legend><ul>${checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><div class="er-score-scale"><strong>Weak vs. stronger:</strong><span>${escapeHtml(scale[0])}</span><span>${escapeHtml(scale[1])}</span><span>${escapeHtml(scale[2])}</span></div><div class="er-score-options" aria-label="${escapeAttr(title)} self-review score">${[0,1,2].map((score) => `<label title="${escapeAttr(scale[score])}"><input type="radio" name="score-${key}" data-trait-score="${key}" value="${score}" ${Number(selected) === score ? "checked" : ""}><span>${score}</span></label>`).join("")}</div><small>Choose the level your current draft actually demonstrates.</small></fieldset>`;
}

function annotationHtml(items) {
  if (!items.length) return "";
  return `<div class="er-annotations"><h3>Why the model works</h3><ol>${items.map((item) => `<li>${escapeHtml(typeof item === "string" ? item : item.note || item.text || JSON.stringify(item))}</li>`).join("")}</ol></div>`;
}

function paragraphHtml(text) {
  return String(text || "").split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function upsertHistory() {
  if (mockAttemptId) return;
  const history = loadHistory();
  const entry = {
    promptId: prompt.id,
    promptTitle: prompt.title,
    mode,
    submittedAt: state.submittedAt || new Date().toISOString(),
    selfScores: { ...state.selfScores },
    revisionComplete: Boolean(state.revisionComplete),
  };
  const filtered = history.filter((item) => !(item.promptId === entry.promptId && item.mode === entry.mode));
  filtered.unshift(entry);
  const bounded = filtered.slice(0, 50);
  if (window.StudoSafeStorage) window.StudoSafeStorage.set(HISTORY_KEY, JSON.stringify(bounded));
}

function loadHistory() {
  try {
    const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(HISTORY_KEY, "[]") : "[]";
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}

function updateWordCount() {
  const words = String(document.getElementById("er-essay")?.value || "").trim().match(/\S+/g)?.length || 0;
  const mount = document.getElementById("er-word-count");
  if (mount) mount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
}

function flashSaved() {
  const note = document.getElementById("er-save-note");
  if (!note) return;
  note.textContent = "Saved";
  window.clearTimeout(flashSaved.handle);
  flashSaved.handle = window.setTimeout(() => { note.textContent = "Saved on this device"; }, 900);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function safeReturn(raw) {
  if (!raw) return "domain.html?track=extended-response&domain=extended-response";
  try {
    const parsed = new URL(raw, location.href);
    return parsed.origin === location.origin ? `${parsed.pathname.split("/").pop()}${parsed.search}${parsed.hash}` : "practice.html";
  } catch (_) { return "practice.html"; }
}

function escapeHtml(value) { const div = document.createElement("div"); div.textContent = String(value ?? ""); return div.innerHTML; }
function escapeAttr(value) { return escapeHtml(value).replace(/"/g, "&quot;"); }
