/*
  practice.js
  -----------
  Runs the Practice page (practice.html). Deliberately plain: three
  skill-area rows, no color coding, no filters, no counts — the goal
  is zero extra decisions before a learner picks a direction. Each
  row links to category.html, which has the actual classified list.
*/

const CATEGORIES = [
  { id: "reading", label: "Reading", desc: "Finding the main idea, following an inference, telling real evidence apart from a plausible-sounding trap." },
  { id: "writing", label: "Writing and Analysis", desc: "Building an argument that actually holds up — not just picking whichever answer sounds nicest." },
  { id: "language_conventions", label: "Language Conventions", desc: "The mechanical stuff — agreement, punctuation, sentence structure. Dull to study, worth more points than you'd expect." },
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
        <div>
          <h2>${c.label}</h2>
          <p>${c.desc}</p>
        </div>
        <a class="btn" href="category.html?subject=rla&cat=${c.id}">Begin</a>
      </div>`
  ).join("");
}
