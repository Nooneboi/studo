/*
  progress.js — Phase 4I progress workspace
  -----------------------------------------
  Compact, easy to scan, and navigable from a persistent shortcut rail.
*/

const progressView = document.getElementById("progress-view");
renderProgress();

function renderProgress() {
  const summary = Learning.getSummary();

  if (!summary.attempts) {
    progressView.innerHTML = `
      <div class="progress-workspace empty">
        ${sidebarHtml()}
        <section class="progress-empty progress-empty-compact">
          <div class="page-kicker">Progress</div>
          <h1>Start with a few questions.</h1>
          <p>Your skills and review list will appear here.</p>
          <div class="progress-empty-actions">
            <a class="btn" href="train.html">Start Train Me</a>
            <a class="btn secondary" href="practice.html">Open Practice</a>
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
      ${sidebarHtml()}

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
          <div class="progress-skill-table">
            <div class="progress-skill-head" aria-hidden="true">
              <span>Skill</span><span>Correct</span><span>Signal</span><span>Status</span>
            </div>
            ${summary.skills.map(skillRow).join("")}
          </div>
        </section>

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
      if (!confirm("Clear Studo's skill signals and review history on this device?")) return;
      Learning.clearLearningHistory();
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
  a.download = `studo-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      throw new Error("Not a Studo backup file");
    }
    const entries = Object.entries(payload.data);
    if (entries.some(([key, value]) => !key.startsWith("sq:") || typeof value !== "string")) {
      throw new Error("Backup contains invalid data");
    }
    if (!confirm("Restore this backup? Current Studo learning data on this device will be replaced.")) return;
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

function sidebarHtml() {
  return `
    <aside class="progress-rail" aria-label="Progress shortcuts">
      <div class="progress-rail-inner">
        <div class="progress-rail-title">Progress</div>
        <nav>
          <a href="#overview-section"><span class="rail-dot"></span>Overview</a>
          <a href="#next-section"><span class="rail-dot"></span>Next</a>
          <a href="#skills-section"><span class="rail-dot"></span>Skills</a>
          <a href="#mistakes-section"><span class="rail-dot"></span>Review</a>
        </nav>
        <div class="progress-rail-links">
          <a href="train.html">Train</a>
          <a href="practice.html">Practice</a>
        </div>
      </div>
    </aside>`;
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
      <a href="${escapeAttr(practiceHref(skill.category, skill.topic))}">Open skill →</a>
    </div>`;
}

function skillRow(skill) {
  return `
    <a class="progress-skill-row" href="${escapeAttr(practiceHref(skill.category, skill.topic))}">
      <span class="progress-skill-name"><small>${escapeHtml(Learning.categoryLabel(skill.category))}</small><strong>${escapeHtml(skill.label)}</strong></span>
      <span>${skill.correct}/${skill.attempts}</span>
      <span class="progress-signal-cell"><i><b style="width:${Math.max(0, Math.min(100, skill.score))}%"></b></i><strong>${skill.score}%</strong></span>
      <span class="progress-status ${statusClass(skill.status)}">${escapeHtml(skill.status)}</span>
    </a>`;
}

function mistakeRow(mistake) {
  const href = mistake.moduleFile
    ? `module.html?quiz=${encodeURIComponent(mistake.moduleFile)}&question=${encodeURIComponent(mistake.questionId)}&return=${encodeURIComponent("progress.html")}`
    : practiceHref(mistake.category, mistake.topic);
  return `
    <a class="progress-review-row" href="${escapeAttr(href)}">
      <span><strong>${escapeHtml(mistake.skillLabel || mistake.topic)}</strong><small>${escapeHtml(mistake.moduleTitle || Learning.categoryLabel(mistake.category))}</small></span>
      <span>${mistake.wrongCount} wrong</span>
      <b>→</b>
    </a>`;
}

function practiceHref(category, topic) {
  const base = `category.html?subject=rla&cat=${encodeURIComponent(category || "reading")}`;
  return topic && topic !== "General" ? `${base}&topic=${encodeURIComponent(topic)}` : base;
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
