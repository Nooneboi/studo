/*
  practice.js — practice directory
  --------------------------------
  The landing page is intentionally scan-first: skill names + compact topic
  cues, with the whole row clickable. No long marketing copy or decorative
  cards before the learner can start studying.
*/

const CATEGORIES = [
  {
    id: "reading",
    label: "Reading",
    topics: ["Main idea", "Inference", "Evidence", "Author's purpose"],
  },
  {
    id: "writing",
    label: "Writing and Analysis",
    topics: ["Claims", "Argument structure", "Tone", "Revision"],
  },
  {
    id: "language_conventions",
    label: "Language Conventions",
    topics: ["Grammar", "Punctuation", "Sentence structure", "Word choice"],
  },
];

init();

function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const listEl = document.getElementById("category-list");

  if (subject !== "rla") {
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  listEl.innerHTML = CATEGORIES.map((category, index) => `
    <a class="category-row" href="category.html?subject=rla&cat=${category.id}">
      <span class="category-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="category-copy">
        <strong class="category-title">${category.label}</strong>
        <span class="category-topics">${category.topics.join(" · ")}</span>
      </span>
      <span class="category-open">Open <span aria-hidden="true">&rarr;</span></span>
    </a>
  `).join("");
}
