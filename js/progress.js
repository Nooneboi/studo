/*
  progress.js — simplified learner-facing progress page
  ------------------------------------------------------
  Keeps the data logic the same, but explains the page more clearly so a
  learner can quickly understand what each section means and what to do next.
*/

const progressView = document.getElementById("progress-view");
renderProgress();

function renderProgress() {
  const summary = Learning.getSummary();

  if (!summary.attempts) {
    progressView.innerHTML = `
      <section class="progress-empty">
        <div class="eyebrow">Learning profile</div>
        <h1>Nothing to show yet.</h1>
        <p class="lede">Once you answer a few questions, this page will show what you have practiced, what is getting stronger, and what needs another look.</p>
        <div class="progress-empty-actions">
          <a class="btn" href="train.html">Start a short session</a>
          <a class="btn secondary" href="practice.html">Open practice</a>
        </div>
      </section>`;
    return;
  }

  const recommendation = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes().slice(0, 6);
  const patterns = typeof Learning.getObservedPatterns === "function" ? Learning.getObservedPatterns() : [];
  const topPattern = patterns.find((item) => item.count >= 2) || null;

  progressView.innerHTML = `
    <section class="progress-heading progress-heading-plain">
      <div>
        <div class="eyebrow">Learning profile</div>
        <h1>Your progress</h1>
        <p class="lede">This page is built from your answers on this device. It shows what you have practiced, what still needs work, and what to review next.</p>
      </div>
    </section>

    <section class="progress-overview" aria-labelledby="overview-title">
      <div class="progress-section-head progress-section-head-tight">
        <div>
          <div class="eyebrow">Overview</div>
          <h2 id="overview-title">What these numbers mean</h2>
        </div>
        <p>Keep this simple: more practice gives better signals.</p>
      </div>
      <div class="progress-overview-grid">
        ${summaryStat(summary.attempts, "Answered", "How many graded questions you have completed.")}
        ${summaryStat(`${summary.accuracy}%`, "Accuracy", "How many of those graded questions were correct.")}
        ${summaryStat(summary.activeMistakes, "Need review", "Questions or ideas that still need another look.")}
        ${summaryStat(summary.dueReviews, "Reviews ready", "Skills that are ready to be practiced again now.")}
      </div>
    </section>

    ${reviewRhythmHtml(summary)}
    ${recommendation ? recommendationHtml(recommendation) : ""}
    ${topPattern ? patternHtml(topPattern) : ""}

    <section class="progress-section" aria-labelledby="skill-signals-heading">
      <div class="progress-section-head">
        <div>
          <div class="eyebrow">Skills</div>
          <h2 id="skill-signals-heading">How each skill is going</h2>
        </div>
        <p>Each row shows the skill, your current score signal, and whether it still needs work.</p>
      </div>
      <div class="skill-signal-list skill-signal-list-plain">
        ${summary.skills.map(skillRow).join("")}
      </div>
    </section>

    <section class="progress-section" aria-labelledby="mistake-book-heading">
      <div class="progress-section-head">
        <div>
          <div class="eyebrow">Review list</div>
          <h2 id="mistake-book-heading">Questions to revisit</h2>
        </div>
        <p>These are the things Studo still wants you to come back to.</p>
      </div>
      ${mistakes.length ? `<div class="mistake-list mistake-list-plain">${mistakes.map(mistakeRow).join("")}</div>` : `
        <div class="progress-quiet-state">No active review items right now. Keep going and this list will stay focused on what truly needs another look.</div>`}
    </section>

    <section class="progress-note-card progress-note-card-plain">
      <div>
        <strong>How Studo decides this</strong>
        <p>Studo groups correct and incorrect graded attempts by skill. It also spaces later review, so improvement comes from seeing whether you can do the idea again on fresh material.</p>
      </div>
      <button class="btn ghost small" type="button" id="clear-learning-history">Clear learning history</button>
    </section>
  `;

  const clearBtn = document.getElementById("clear-learning-history");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear Studo's skill signals and review history on this device? Your saved module notes and answers are separate and will not be deleted.")) return;
      Learning.clearLearningHistory();
      renderProgress();
    });
  }
}

function summaryStat(value, label, help) {
  return `<div class="progress-stat-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(help)}</small></div>`;
}

function recommendationHtml(skill) {
  const href = practiceHref(skill.category, skill.topic);
  return `
    <section class="next-move next-move-plain" aria-label="Recommended next step">
      <div>
        <div class="eyebrow">What to do next</div>
        <h2>${escapeHtml(skill.label)}</h2>
        <p>This is a good place to continue. You have ${skill.correct}/${skill.attempts} correct here so far, so another short round can make the signal clearer.</p>
      </div>
      <div class="next-move-score" aria-label="Skill signal ${skill.score} percent">
        <strong>${skill.score}%</strong>
        <span>${escapeHtml(skill.signal)}</span>
      </div>
      <div class="next-move-actions">
        <a class="btn" href="train.html">Train me</a>
        <a class="btn secondary" href="${escapeAttr(href)}">Open this skill area</a>
      </div>
    </section>`;
}

function reviewRhythmHtml(summary) {
  const schedule = typeof Learning.getReviewSchedule === "function" ? Learning.getReviewSchedule() : [];
  const next = schedule[0] || null;
  const due = summary.dueReviews || 0;
  const headline = due
    ? `${due} review${due === 1 ? " is" : "s are"} ready`
    : next
      ? `Next review ${relativeDue(next.dueAt)}`
      : "Review timing will appear here";
  const detail = due
    ? "These skills are ready to be practiced again. Use Train Me if you want Studo to choose for you."
    : next
      ? `${next.skillLabel} is currently the next scheduled review.`
      : "Complete a few graded questions and Studo will begin spacing review by skill.";
  return `
    <section class="review-rhythm review-rhythm-plain" aria-label="Review schedule">
      <div>
        <div class="eyebrow">Review schedule</div>
        <h2>${escapeHtml(headline)}</h2>
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
    <section class="pattern-notice pattern-notice-plain" aria-label="Observed mistake pattern">
      <div>
        <div class="eyebrow">Repeated pattern</div>
        <h2>${escapeHtml(patternLabel(pattern.id))}</h2>
        <p>This has shown up ${pattern.count} times recently, so it may be a real misunderstanding rather than a one-off mistake.</p>
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
    <a class="skill-signal-row skill-signal-row-plain" href="${escapeAttr(href)}">
      <div class="skill-signal-copy">
        <span class="skill-category">${escapeHtml(Learning.categoryLabel(skill.category))}</span>
        <strong>${escapeHtml(skill.label)}</strong>
        <span>${skill.correct}/${skill.attempts} correct</span>
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
  const statusText = mistake.status === "improving" ? "Getting better" : "Needs review";
  return `
    <a class="mistake-row mistake-row-plain" href="${escapeAttr(href)}">
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
