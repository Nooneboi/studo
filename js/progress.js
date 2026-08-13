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
          <a class="btn" href="train.html">Start a baseline session</a>
          <a class="btn secondary" href="practice.html">Choose practice manually</a>
        </div>
      </section>`;
    return;
  }

  const recommendation = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes().slice(0, 6);
  const patterns = typeof Learning.getObservedPatterns === "function" ? Learning.getObservedPatterns() : [];
  const topPattern = patterns.find((item) => item.count >= 2) || null;

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
        ${summaryStat(summary.dueReviews, "skill reviews due")}
      </div>
    </section>

    ${reviewRhythmHtml(summary)}
    ${recommendation ? recommendationHtml(recommendation) : ""}
    ${topPattern ? patternHtml(topPattern) : ""}

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
        <p>Correct and incorrect graded attempts are grouped by skill. Studo also spaces later review and prefers fresh parallel questions when possible, so improvement is based more on retrieval and transfer than on remembering one old answer.</p>
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
      <div class="next-move-actions">
        <a class="btn" href="train.html">Train me</a>
        <a class="btn secondary" href="${escapeAttr(href)}">Choose this area</a>
      </div>
    </section>`;
}

function reviewRhythmHtml(summary) {
  const schedule = typeof Learning.getReviewSchedule === "function" ? Learning.getReviewSchedule() : [];
  const next = schedule[0] || null;
  const due = summary.dueReviews || 0;
  const headline = due
    ? `${due} skill review${due === 1 ? " is" : "s are"} due`
    : next
      ? `Next review ${escapeHtml(relativeDue(next.dueAt))}`
      : "Review timing will appear here";
  const detail = due
    ? "These skills are ready for another retrieval attempt. Train Me will prefer fresh questions when the catalog has them."
    : next
      ? `${next.skillLabel} is currently scheduled next. Studo spaces stronger work farther apart instead of repeating it immediately.`
      : "Complete a few graded questions and Studo will begin spacing review by skill.";
  return `
    <section class="review-rhythm" aria-label="Review schedule">
      <div>
        <div class="eyebrow">Review rhythm</div>
        <h2>${headline}</h2>
        <p>${escapeHtml(detail)}</p>
      </div>
      <a class="btn" href="train.html">Build training session</a>
    </section>`;
}

function relativeDue(iso) {
  if (!iso) return "later";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "now";
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `in about ${Math.max(1, hours)} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(diff / 86400000);
  return `in about ${Math.max(1, days)} day${days === 1 ? "" : "s"}`;
}

function patternHtml(pattern) {
  return `
    <section class="pattern-notice" aria-label="Observed mistake pattern">
      <div>
        <div class="eyebrow">Pattern noticed</div>
        <h2>${escapeHtml(patternLabel(pattern.id))}</h2>
        <p>This showed up in ${pattern.count} recent wrong answers. Studo records this from the distractors you chose, so you do not have to diagnose every mistake yourself.</p>
      </div>
    </section>`;
}

function patternLabel(id) {
  return {
    mentioned_not_supported: "Choosing details that are mentioned but not actually supported",
    too_broad: "Choosing answers that are broader than the text supports",
    too_narrow: "Getting pulled toward one detail instead of the larger point",
    opposite_claim: "Choosing an answer that conflicts with a passage detail",
    location_homophone: "Mixing up a place word with the grammatical form needed",
    contraction_homophone: "Mixing up a contraction with the grammatical form needed",
    possessive_pronoun_form: "Using a possessive form that does not fit before a noun",
  }[id] || "A repeated distractor pattern";
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
  const statusText = mistake.status === "improving" ? "Improving — confirm on fresh material" : "Needs review";
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
