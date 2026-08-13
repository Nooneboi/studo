/* Returning-learner home strip. New visitors still see the original philosophy
   first; once Studo has learning evidence, the next useful action appears above it. */
(function () {
  const mount = document.getElementById("home-learning-mount");
  if (!mount || typeof Learning === "undefined") return;

  const summary = Learning.getSummary();
  if (!summary.attempts) return;

  const nextSkill = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes();
  const primaryHref = "train.html";

  const mainTitle = mistakes.length
    ? `${mistakes.length} item${mistakes.length === 1 ? "" : "s"} worth reviewing`
    : nextSkill
      ? `Keep building ${nextSkill.label}`
      : "Keep practicing";

  const detail = nextSkill
    ? `${nextSkill.label}: ${nextSkill.score}% practice signal · ${nextSkill.signal.toLowerCase()}`
    : `${summary.attempts} graded attempts saved on this device`;

  const supportingNote = summary.dueReviews
    ? `${summary.dueReviews} skill review${summary.dueReviews === 1 ? " is" : "s are"} due. Train Me will mix those with fresh questions that test weaker skills.`
    : mistakes.length
      ? "Train Me will use fresh questions where possible so review tests the skill, not your memory of an old answer."
      : "Train Me can build a short focused session from your current skill signals.";

  mount.innerHTML = `
    <section class="home-learning-strip" aria-label="Continue learning">
      <div class="home-learning-glow" aria-hidden="true"></div>
      <div class="home-learning-main">
        <div class="home-learning-topline">
          <div class="home-learning-kicker">
            <span class="home-learning-icon" aria-hidden="true">↺</span>
            <div class="eyebrow">Continue learning</div>
          </div>
          <span class="home-learning-chip">Review due</span>
        </div>
        <h2>${escapeHtml(mainTitle)}</h2>
        <p class="home-learning-detail">${escapeHtml(detail)}</p>
        <p class="home-learning-note">${escapeHtml(supportingNote)}</p>
      </div>
      <div class="home-learning-actions">
        <a class="btn" href="${escapeAttr(primaryHref)}">Train me</a>
        <a class="btn secondary" href="progress.html">View progress</a>
      </div>
    </section>`;

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
})();
