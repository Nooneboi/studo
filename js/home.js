/* Returning-learner home strip. New visitors still see the original philosophy
   first; once Studo has learning evidence, the next useful action appears above it. */
(function () {
  const mount = document.getElementById("home-learning-mount");
  if (!mount || typeof Learning === "undefined") return;

  const summary = Learning.getSummary();
  if (!summary.attempts) return;

  const nextSkill = summary.weakestSkills[0] || summary.skills[0] || null;
  const mistakes = Learning.getMistakes();
  const primaryHref = nextSkill
    ? `category.html?subject=rla&cat=${encodeURIComponent(nextSkill.category)}${nextSkill.topic && nextSkill.topic !== "General" ? `&topic=${encodeURIComponent(nextSkill.topic)}` : ""}`
    : "practice.html";

  const mainTitle = mistakes.length
    ? `${mistakes.length} item${mistakes.length === 1 ? "" : "s"} worth reviewing`
    : nextSkill
      ? `Keep building ${nextSkill.label}`
      : "Keep practicing";

  const detail = nextSkill
    ? `${nextSkill.label}: ${nextSkill.score}% practice signal · ${nextSkill.signal.toLowerCase()}`
    : `${summary.attempts} graded attempts saved on this device`;

  mount.innerHTML = `
    <section class="home-learning-strip" aria-label="Continue learning">
      <div class="home-learning-main">
        <div class="eyebrow">Continue learning</div>
        <h2>${escapeHtml(mainTitle)}</h2>
        <p>${escapeHtml(detail)}</p>
      </div>
      <div class="home-learning-actions">
        <a class="btn" href="${escapeAttr(primaryHref)}">Continue</a>
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
