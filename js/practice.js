/*
  practice.js
  -----------
  Practice landing page.
  The copy is intentionally short and plain so learners can choose a
  direction quickly without reading a paragraph for each category.
*/

const CATEGORIES = [
  {
    id: "reading",
    label: "Reading",
    desc: "Main idea, inference, evidence, and what the author is really saying.",
  },
  {
    id: "writing",
    label: "Writing and Analysis",
    desc: "Claims, structure, tone, and whether an argument actually makes sense.",
  },
  {
    id: "language_conventions",
    label: "Language Conventions",
    desc: "Grammar, punctuation, sentence structure, clarity, and word choice.",
  },
];

init();

function init() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
  const listEl = document.getElementById("category-list");

  if (subject !== "rla") {
    listEl.innerHTML = `<div class="empty-state">This subject isn't built out yet — check back soon, or switch to Reasoning Through Language Arts above.</div>`;
    return;
  }

  listEl.innerHTML = CATEGORIES.map(
    (c) => `
      <div class="category-row">
        <div class="category-copy">
          <h2>${c.label}</h2>
          <p>${c.desc}</p>
        </div>
        <a class="btn" href="category.html?subject=rla&cat=${c.id}">Begin</a>
      </div>`
  ).join("");
}
