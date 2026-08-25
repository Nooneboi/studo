/*
  progress.js — Phase 4I progress workspace
  -----------------------------------------
  Compact, easy to scan, and navigable from a persistent shortcut rail.
*/

const progressView = document.getElementById("progress-view");
let curriculumRoutes = null;
init();

async function init() {
  try {
    curriculumRoutes = CurriculumRoutes.build(await Data.loadCurriculum());
  } catch (_) {
    curriculumRoutes = null;
  }
  renderProgress();
}

function renderProgress() {
  const summary = Learning.getSummary();
  const erHistory = getErHistory();
  const mockHistory = getMockHistory();
  const latestChecks = latestSkillCheckBySkill();

  if (!summary.attempts && !erHistory.length && !mockHistory.length) {
    progressView.innerHTML = `
      <div class="progress-workspace empty">
        ${sidebarHtml({ showCore: false })}
        <section class="progress-empty progress-empty-compact">
          <div class="page-kicker">Progress</div>
          <h1>Start with a few questions.</h1>
          <p>Your skills and review list will appear here.</p>
          <div class="progress-empty-actions">
            <a class="btn" href="practice.html">Start Practice</a>
          </div>
          ${dataBackupHtml()}
        </section>
      </div>`;
    wireDataActions();
    return;
  }

  const recommendation = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes().slice(0, 8);

  progressView.innerHTML = `
    <div class="progress-workspace">
      ${sidebarHtml({ showMock: mockHistory.length > 0, showEr: erHistory.length > 0 })}

      <div class="progress-dashboard">
        <header class="progress-dashboard-head" id="progress-top">
          <div>
            <div class="page-kicker">Learning profile</div>
            <h1>Progress</h1>
          </div>
          <a class="progress-head-action" href="train.html">Train me →</a>
        </header>

        <section id="overview-section" class="progress-metrics" aria-label="Progress overview">
          ${metric(summary.attempts, "Answered")}
          ${metric(`${summary.accuracy}%`, "Accuracy")}
          ${metric(summary.activeMistakes, "Need review")}
          ${metric(summary.dueReviews, "Reviews ready")}
        </section>

        <section id="next-section" class="progress-focus" aria-label="Next actions">
          <div class="progress-focus-block">
            <span class="progress-mini-label">Review</span>
            <h2>${summary.dueReviews ? `${summary.dueReviews} ready now` : "Nothing due yet"}</h2>
            <a href="train.html">Build a review session →</a>
          </div>
          ${recommendation ? recommendationBlock(recommendation) : ""}
        </section>

        <section id="skills-section" class="progress-table-section" aria-labelledby="skills-heading">
          <div class="progress-table-heading">
            <h2 id="skills-heading">Skills</h2>
            <span>${summary.skills.length} tracked</span>
          </div>
          <p class="progress-er-note">Skill signals reflect your Chee Skool practice history, not a GED score.</p>
          <div class="progress-skill-table">
            <div class="progress-skill-head" aria-hidden="true">
              <span>Skill</span><span>Correct</span><span>Signal</span><span>Status</span>
            </div>
            ${summary.skills.map((skill) => skillRow(skill, latestChecks.get(skill.id))).join("")}
          </div>
        </section>

        ${mockHistory.length ? mockHistoryHtml(mockHistory) : ""}
        ${erHistory.length ? erHistoryHtml(erHistory) : ""}

        <section id="mistakes-section" class="progress-table-section" aria-labelledby="review-heading">
          <div class="progress-table-heading">
            <h2 id="review-heading">Review list</h2>
            <span>${mistakes.length} shown</span>
          </div>
          ${mistakes.length ? `<div class="progress-review-list">${mistakes.map(mistakeRow).join("")}</div>` : `<div class="progress-quiet-state">No active review items.</div>`}
        </section>

        ${dataBackupHtml()}
        <div class="progress-bottom-actions">
          <button class="btn ghost small" type="button" id="clear-learning-history">Clear learning history</button>
        </div>
      </div>
    </div>`;

  const clearBtn = document.getElementById("clear-learning-history");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear Chee Skool's skill signals and review history on this device?")) return;
      Learning.clearLearningHistory();
      if (window.StudoSafeStorage) window.StudoSafeStorage.remove("sq:skill-check-history:v1");
      else localStorage.removeItem("sq:skill-check-history:v1");
      renderProgress();
    });
  }
  wireDataActions();
}

function dataBackupHtml() {
  return `
    <section class="progress-data-actions" aria-label="Learning data backup">
      <div><strong>Learning data</strong><span>Stored only on this device.</span></div>
      <div>
        <button class="btn ghost small" type="button" id="backup-learning-data">Download backup</button>
        <button class="btn ghost small" type="button" id="restore-learning-data">Restore backup</button>
        <input id="restore-learning-file" type="file" accept="application/json,.json" hidden>
      </div>
    </section>`;
}

function wireDataActions() {
  const backupBtn = document.getElementById("backup-learning-data");
  const restoreBtn = document.getElementById("restore-learning-data");
  const restoreInput = document.getElementById("restore-learning-file");
  if (backupBtn) backupBtn.addEventListener("click", downloadLearningBackup);
  if (restoreBtn && restoreInput) restoreBtn.addEventListener("click", () => restoreInput.click());
  if (restoreInput) restoreInput.addEventListener("change", restoreLearningBackup);
}

function downloadLearningBackup() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sq:")) data[key] = localStorage.getItem(key);
    }
  } catch (_) {
    alert("This browser is not allowing access to saved learning data.");
    return;
  }
  const payload = {
    format: "studo-local-backup",
    version: 1,
    release: window.STUDO_RELEASE || "unknown",
    exportedAt: new Date().toISOString(),
    data
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chee-skool-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function restoreLearningBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.format !== "studo-local-backup" || payload?.version !== 1 || !payload.data || typeof payload.data !== "object") {
      throw new Error("Not a Chee Skool backup file");
    }
    const entries = Object.entries(payload.data);
    if (entries.some(([key, value]) => !key.startsWith("sq:") || typeof value !== "string")) {
      throw new Error("Backup contains invalid data");
    }
    if (!confirm("Restore this backup? Current Chee Skool learning data on this device will be replaced.")) return;
    const existing = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sq:")) existing.push(key);
    }
    existing.forEach((key) => localStorage.removeItem(key));
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
    location.reload();
  } catch (error) {
    console.error(error);
    alert("That backup could not be restored. No learning data was changed.");
  }
}

function sidebarHtml({ showCore = true, showMock = false, showEr = false } = {}) {
  const coreLinks = showCore ? `
          <a href="#overview-section"><span class="rail-dot"></span>Overview</a>
          <a href="#next-section"><span class="rail-dot"></span>Next</a>
          <a href="#skills-section"><span class="rail-dot"></span>Skills</a>
          <a href="#mistakes-section"><span class="rail-dot"></span>Review</a>` : "";
  const mockLink = showMock ? `<a href="#mock-section"><span class="rail-dot"></span>Mock Tests</a>` : "";
  const erLink = showEr ? `<a href="#er-section"><span class="rail-dot"></span>Extended Response</a>` : "";
  return `
    <aside class="progress-rail" aria-label="Progress shortcuts">
      <div class="progress-rail-inner">
        <div class="progress-rail-title">Progress</div>
        <nav>${coreLinks}${mockLink}${erLink}</nav>
        <div class="progress-rail-links">
          <a href="train.html">Train</a>
          <a href="practice.html">Practice</a>
        </div>
      </div>
    </aside>`;
}


function getMockHistory() {
  try {
    const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:rlaMockAttempts", "[]") : localStorage.getItem("sq:rlaMockAttempts");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function mockHistoryHtml(history) {
  return `
    <section id="mock-section" class="progress-table-section" aria-labelledby="mock-progress-heading">
      <div class="progress-table-heading">
        <div><span class="progress-mini-label">Independent practice evidence</span><h2 id="mock-progress-heading">Full RLA Mock</h2></div>
        <span>${history.length} ${history.length === 1 ? "attempt" : "attempts"}</span>
      </div>
      <p class="progress-er-note">Objective scores are auto-graded raw Chee Skool results. Extended Response trait levels, when present, are separate Self-review.</p>
      <div class="progress-er-list">${history.slice(0, 8).map(mockAttemptRow).join("")}</div>
    </section>`;
}

function mockAttemptRow(item) {
  const score = item.objectiveScore || {};
  const er = item.erSelfReview || {};
  const erText = [er.argument, er.organization, er.english].every((value) => Number.isInteger(value))
    ? ` · ER Self-review ${er.argument}/${er.organization}/${er.english}`
    : "";
  const href = `test.html?attempt=${encodeURIComponent(item.attemptId || "")}`;
  const formId = item.formId || null;
  const reportingCategories = item.reportingCategories || score.reportingCategories || {};
  const labels = { "1": "Text Features & Technique", "2": "Evidence & Arguments", "3": "Language Conventions" };
  const categoryText = Object.entries(reportingCategories).map(([key, bucket]) => `${labels[key] || key} ${bucket.correct ?? 0}/${bucket.total ?? 0}`).join(" · ");
  return `
    <a class="progress-er-row" href="${escapeAttr(href)}"${formId ? ` data-form-id="${escapeAttr(formId)}"` : ""}>
      <span><strong>${escapeHtml(item.label || "Full RLA Mock")}</strong><small>Objective ${escapeHtml(score.correct ?? 0)}/${escapeHtml(score.total ?? 0)} · ${escapeHtml(score.accuracy ?? 0)}%${escapeHtml(erText)}${categoryText ? `<br>${escapeHtml(categoryText)}` : ""}</small></span>
      <span class="progress-er-score"><small>Raw objective</small><strong>${escapeHtml(score.accuracy ?? 0)}%</strong></span>
      <b>→</b>
    </a>`;
}

function getErHistory() {
  try {
    const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:er:history", "[]") : localStorage.getItem("sq:er:history");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function erHistoryHtml(history) {
  return `
    <section id="er-section" class="progress-table-section" aria-labelledby="er-progress-heading">
      <div class="progress-table-heading">
        <div><span class="progress-mini-label">Self-review</span><h2 id="er-progress-heading">Extended Response</h2></div>
        <span>${history.length} ${history.length === 1 ? "attempt" : "attempts"}</span>
      </div>
      <p class="progress-er-note">Trait scores below are your own provisional self-review. They are kept separate from objective skill mastery.</p>
      <div class="progress-er-list">
        ${history.slice(0, 8).map(erAttemptRow).join("")}
      </div>
    </section>`;
}

function erAttemptRow(item) {
  const scores = item.selfScores || {};
  const scoreText = [scores.argument, scores.organization, scores.english].every((value) => Number.isInteger(value))
    ? `${scores.argument}/${scores.organization}/${scores.english}`
    : "Not scored";
  const modeLabel = item.mode === "timed" ? "Timed 45 min" : "Untimed";
  const status = item.revisionComplete ? "Reviewed + revised" : "Review pending";
  const href = `extended-response.html?prompt=${encodeURIComponent(item.promptId || "")}&mode=${encodeURIComponent(item.mode || "untimed")}&return=${encodeURIComponent("progress.html")}`;
  return `
    <a class="progress-er-row" href="${escapeAttr(href)}">
      <span><strong>${escapeHtml(item.promptTitle || "Extended Response")}</strong><small>${escapeHtml(modeLabel)} · ${escapeHtml(status)}</small></span>
      <span class="progress-er-score"><small>Self-review T1/T2/T3</small><strong>${escapeHtml(scoreText)}</strong></span>
      <b>→</b>
    </a>`;
}

function metric(value, label) {
  return `<div class="progress-metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function recommendationBlock(skill) {
  return `
    <div class="progress-focus-block">
      <span class="progress-mini-label">Next skill</span>
      <h2>${escapeHtml(skill.label)}</h2>
      <div class="progress-focus-meta"><strong>${skill.score}%</strong><span>${escapeHtml(skill.status)}</span></div>
      <a href="${escapeAttr(practiceHref(skill))}">Open skill →</a>
    </div>`;
}

function skillRow(skill, latestCheck = null) {
  return `
    <a class="progress-skill-row" href="${escapeAttr(practiceHref(skill))}">
      <span class="progress-skill-name"><small>${escapeHtml(Learning.categoryLabel(skill.category))}</small><strong>${escapeHtml(skill.label)}</strong></span>
      <span>${skill.correct}/${skill.attempts}</span>
      <span class="progress-signal-cell">
        <small>Practice signal</small>
        <span class="progress-signal-meter"><i><b style="width:${Math.max(0, Math.min(100, skill.score))}%"></b></i><strong>${skill.score}%</strong></span>
        ${latestCheck ? `<span class="progress-check-result"><small>Latest Skill Check</small><strong>${escapeHtml(latestCheck.correct)}/${escapeHtml(latestCheck.total)}</strong></span>` : ""}
      </span>
      <span class="progress-status ${statusClass(skill.status)}">${escapeHtml(skill.status)}</span>
    </a>`;
}

function getSkillCheckHistory() {
  try {
    const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get("sq:skill-check-history:v1", "[]") : localStorage.getItem("sq:skill-check-history:v1");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function latestSkillCheckBySkill() {
  const out = new Map();
  for (const item of getSkillCheckHistory()) {
    if (item?.skillId && !out.has(item.skillId)) out.set(item.skillId, item);
  }
  return out;
}

function mistakeRow(mistake) {
  const href = mistake.sourceMode === "skill_check"
    ? practiceHref(mistake)
    : mistake.moduleFile
      ? `module.html?quiz=${encodeURIComponent(mistake.moduleFile)}&question=${encodeURIComponent(mistake.questionId)}&return=${encodeURIComponent("progress.html")}`
      : practiceHref(mistake);
  return `
    <a class="progress-review-row" href="${escapeAttr(href)}">
      <span><strong>${escapeHtml(mistake.skillLabel || mistake.topic)}</strong><small>${escapeHtml(mistake.moduleTitle || Learning.categoryLabel(mistake.category))}</small></span>
      <span>${mistake.wrongCount} wrong</span>
      <b>→</b>
    </a>`;
}

function practiceHref(item) {
  const skillId = item?.id || item?.skillId;
  if (skillId && curriculumRoutes) return curriculumRoutes.hrefForSkill(skillId);
  return "practice.html";
}

function statusClass(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
