/* Mock/Test V2 landing page — starts/resumes fixed full forms and objective format practice. */
const MOCK_ACTIVE_KEY = "sq:rlaMock:activeId";
const MOCK_PREFIX = "sq:rlaMock:";
const MOCK_HISTORY_KEY = "sq:rlaMockAttempts";
const statusEl = document.getElementById("mock-status");

initMockLanding();

async function initMockLanding() {
  try {
    renderResume();
    document.getElementById("start-full-mock")?.addEventListener("click", () => startAttempt("full"));
    document.getElementById("start-objective-test")?.addEventListener("click", () => startAttempt("objective"));
  } catch (error) {
    console.error(error);
    setStatus("RLA test practice could not be initialized on this device.");
  }
}

async function startAttempt(mode) {
  try {
    const [modules, blueprintRes, promptsRes] = await Promise.all([
      Data.loadAllQuizzes(),
      fetch("data/generated/mock-blueprint.json", { cache: "no-store" }),
      fetch("data/generated/mock-er-prompts.json", { cache: "no-store" })
    ]);
    if (!blueprintRes.ok || !promptsRes.ok) throw new Error("Mock data failed to load");
    const blueprint = await blueprintRes.json();
    const prompts = (await promptsRes.json()).prompts || [];
    const seed = `${Date.now()}-${Math.random()}`;
    let generated;
    let attempt;
    if (mode === "objective") {
      generated = MockEngine.generateObjectivePractice({ modules, blueprint, seed });
      attempt = MockEngine.createObjectiveAttempt(generated, blueprint, Date.now());
    } else {
      generated = MockEngine.generateFullMock({ modules, prompts, blueprint, seed, history: loadHistory() });
      attempt = MockEngine.createAttempt(generated, blueprint, Date.now());
    }
    saveAttempt(attempt);
    setValue(MOCK_ACTIVE_KEY, attempt.attemptId);
    location.href = `test.html?attempt=${encodeURIComponent(attempt.attemptId)}`;
  } catch (error) {
    console.error(error);
    setStatus("Chee Skool could not load a valid fixed Full RLA Mock from the current mock bank.");
  }
}

function renderResume() {
  const id = getValue(MOCK_ACTIVE_KEY);
  const attempt = id ? loadAttempt(id) : null;
  const mount = document.getElementById("mock-resume");
  if (!mount || !attempt || attempt.completedAt) return;
  const label = attempt.mode === "objective" ? "Objective practice test" : "Full RLA Mock";
  mount.hidden = false;
  mount.innerHTML = `<div><span class="mock-option-label">In progress</span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(stageLabel(attempt.stage))}</small></div><a class="btn small" href="test.html?attempt=${encodeURIComponent(attempt.attemptId)}">Resume</a>`;
}

function stageLabel(stage) {
  return ({ part1: "Part 1", er: "Extended Response", break: "Break", part3: "Part 3", objective: "Objective section", results: "Results" })[stage] || "In progress";
}

function loadHistory() { try { const x = JSON.parse(getValue(MOCK_HISTORY_KEY) || "[]"); return Array.isArray(x) ? x : []; } catch (_) { return []; } }

function loadAttempt(id) {
  try { return JSON.parse(getValue(`${MOCK_PREFIX}${id}`) || "null"); } catch (_) { return null; }
}
function saveAttempt(attempt) { setValue(`${MOCK_PREFIX}${attempt.attemptId}`, JSON.stringify(attempt)); }
function getValue(key) { return window.StudoSafeStorage ? window.StudoSafeStorage.get(key) : localStorage.getItem(key); }
function setValue(key, value) { return window.StudoSafeStorage ? window.StudoSafeStorage.set(key, value) : localStorage.setItem(key, value); }
function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function escapeHtml(value) { const d = document.createElement("div"); d.textContent = String(value ?? ""); return d.innerHTML; }
