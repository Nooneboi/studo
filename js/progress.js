/*
  progress.js — Phase 3A learning profile
  ----------------------------------------
  This page intentionally shows only what the local attempt history can
  support. It uses "signal" language rather than pretending that a few
  practice questions equal a validated exam score.
*/

const progressView = document.getElementById("progress-view");
renderProgress();

function renderProgress() {
  const summary = Learning.getSummary();

  if (!summary.attempts) {
    progressView.innerHTML = `
      <section class="progress-empty">
        <div class="eyebrow">Learning profile</div>
        <h1>Nothing to measure yet.</h1>
        <p class="lede">Answer a few auto-graded questions in Practice or a Test. Studo will start building skill signals and a private mistake list from your actual work.</p>
        <div class="progress-empty-actions">
          <a class="btn" href="practice.html">Start practicing</a>
          <a class="btn secondary" href="quiz.html">Take a test</a>
        </div>
      </section>`;
    return;
  }

  const recommendation = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes().slice(0, 6);

  progressView.innerHTML = `
    <section class="progress-heading">
      <div>
        <div class="eyebrow">Learning profile</div>
        <h1>Your progress</h1>
        <p class="lede">Built from what you actually answered on this device. Percentages are practice signals, not predicted GED scores.</p>
      </div>
      <div class="progress-summary" aria-label="Practice summary">
        ${summaryStat(summary.attempts, "graded attempts")}
        ${summaryStat(`${summary.accuracy}%`, "raw accuracy")}
        ${summaryStat(summary.activeMistakes, "need review")}
        ${summaryStat(summary.sureWrong, "sure but wrong")}
      </div>
    </section>

    ${recommendation ? recommendationHtml(recommendation) : ""}

    <section class="progress-section" aria-labelledby="skill-signals-heading">
      <div class="progress-section-head">
        <div>
          <div class="eyebrow">Skill signals</div>
          <h2 id="skill-signals-heading">What your practice is showing</h2>
        </div>
        <p>Low-data skills stay labelled until Studo has enough attempts to make the estimate more meaningful.</p>
      </div>
      <div class="skill-signal-list">
        ${summary.skills.map(skillRow).join("")}
      </div>
    </section>

    <section class="progress-section" aria-labelledby="mistake-book-heading">
      <div class="progress-section-head">
        <div>
          <div class="eyebrow">Mistake book</div>
          <h2 id="mistake-book-heading">Needs another look</h2>
        </div>
        <p>Wrong answers stay here until later correct work shows that the idea is becoming stable.</p>
      </div>
      ${mistakes.length ? `<div class="mistake-list">${mistakes.map(mistakeRow).join("")}</div>` : `
        <div class="progress-quiet-state">No active mistakes right now. Keep practicing—the goal is stable understanding, not a permanently empty list.</div>`}
    </section>

    <section class="progress-note-card">
      <div>
        <strong>How Studo currently decides this</strong>
        <p>Correct and incorrect graded attempts are grouped by skill. Harder questions and test-mode answers carry a little more evidence, while a neutral starting prior prevents one question from becoming a fake 0% or 100% mastery claim.</p>
      </div>
      <button class="btn ghost small" type="button" id="clear-learning-history">Clear learning history</button>
    </section>
  `;

  const clearBtn = document.getElementById("clear-learning-history");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear Studo's skill signals and mistake history on this device? Your saved module notes and answers are separate and will not be deleted.")) return;
      Learning.clearLearningHistory();
      renderProgress();
    });
  }
}

function summaryStat(value, label) {
  return `<div class="progress-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function recommendationHtml(skill) {
  const href = practiceHref(skill.category, skill.topic);
  const action = skill.status === "Needs work" ? "Reinforce" : "Keep building";
  return `
    <section class="next-move" aria-label="Recommended next step">
      <div>
        <div class="eyebrow">Next best move</div>
        <h2>${escapeHtml(skill.label)}</h2>
        <p>${escapeHtml(action)} this skill while the signal is still fresh. Studo currently has ${skill.attempts} graded attempt${skill.attempts === 1 ? "" : "s"} for it.</p>
      </div>
      <div class="next-move-score" aria-label="Skill signal ${skill.score} percent">
        <strong>${skill.score}%</strong>
        <span>${escapeHtml(skill.signal)}</span>
      </div>
      <a class="btn" href="${escapeAttr(href)}">Practice this area</a>
    </section>`;
}

function skillRow(skill) {
  const href = practiceHref(skill.category, skill.topic);
  return `
    <a class="skill-signal-row" href="${escapeAttr(href)}">
      <div class="skill-signal-copy">
        <span class="skill-category">${escapeHtml(Learning.categoryLabel(skill.category))}</span>
        <strong>${escapeHtml(skill.label)}</strong>
        <span>${skill.correct}/${skill.attempts} correct · ${escapeHtml(skill.signal)}</span>
      </div>
      <div class="skill-meter" aria-label="${escapeAttr(skill.label)} signal ${skill.score} percent">
        <div class="skill-meter-track"><span style="width:${Math.max(0, Math.min(100, skill.score))}%"></span></div>
        <strong>${skill.score}%</strong>
        <span class="skill-status ${statusClass(skill.status)}">${escapeHtml(skill.status)}</span>
      </div>
    </a>`;
}

function mistakeRow(mistake) {
  const href = mistake.moduleFile
    ? `module.html?quiz=${encodeURIComponent(mistake.moduleFile)}&question=${encodeURIComponent(mistake.questionId)}`
    : practiceHref(mistake.category, mistake.topic);
  const statusText = mistake.status === "improving" ? "Improving — prove it once more" : "Needs review";
  return `
    <a class="mistake-row" href="${escapeAttr(href)}">
      <div class="mistake-status-mark ${mistake.status === "improving" ? "improving" : ""}" aria-hidden="true"></div>
      <div class="mistake-copy">
        <strong>${escapeHtml(mistake.skillLabel || mistake.topic)}</strong>
        <span>${escapeHtml(mistake.moduleTitle || Learning.categoryLabel(mistake.category))}</span>
      </div>
      <div class="mistake-meta">
        <span>${escapeHtml(statusText)}</span>
        <span>${mistake.wrongCount} wrong attempt${mistake.wrongCount === 1 ? "" : "s"}${mistake.reason ? ` · ${escapeHtml(reasonLabel(mistake.reason))}` : ""}</span>
      </div>
      <span class="mistake-arrow" aria-hidden="true">→</span>
    </a>`;
}

function reasonLabel(reason) {
  return {
    misread: "misread question",
    evidence: "couldn't find evidence",
    two_choices: "between two answers",
    guess: "guessed",
    careless: "careless mistake",
  }[reason] || reason;
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
