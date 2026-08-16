/* A returning learner gets one clear reminder, not another dashboard. */
(function () {
  const mount = document.getElementById("home-learning-mount");
  if (!mount || typeof Learning === "undefined") return;

  const summary = Learning.getSummary();
  if (!summary.attempts) return;

  const mistakes = Learning.getMistakes();
  let message = "Continue where you left off";

  if (summary.dueReviews) {
    message = `${summary.dueReviews} review${summary.dueReviews === 1 ? " is" : "s are"} ready`;
  } else if (mistakes.length) {
    message = `${mistakes.length} item${mistakes.length === 1 ? "" : "s"} worth another look`;
  }

  mount.innerHTML = `
    <a class="home-resume-line" href="train.html" aria-label="Continue learning with Train Me">
      <span class="home-resume-label">Continue learning</span>
      <strong>${escapeHtml(message)}</strong>
      <span class="home-resume-action">Resume <span aria-hidden="true">→</span></span>
    </a>`;

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }
})();
