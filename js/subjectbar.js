/*
  subjectbar.js
  -------------
  Renders the global subject bar (Math / Science / Social Studies / RLA)
  right under the header, on every page that includes a
  <div id="subject-bar-mount"></div>.

  Only RLA is live for now. The other three render as disabled "Soon"
  pills — flip a subject's `enabled` flag to true once it has content,
  and it becomes a normal clickable tab automatically.

  Clicking a tab remembers the choice (localStorage) and navigates to
  practice.html (or quiz.html, if that's the page you're already on)
  with ?subject=<id> — each page reads that on load.
*/

const SUBJECTS = [
  { id: "rla", label: "Reasoning Through Language Arts", enabled: true },
  { id: "math", label: "Mathematical Reasoning", enabled: false },
  { id: "science", label: "Science", enabled: false },
  { id: "social_studies", label: "Social Studies", enabled: false },
];

function getActiveSubject() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject") || localStorage.getItem("sq:activeSubject") || "rla";
}

(function renderSubjectBar() {
  const mount = document.getElementById("subject-bar-mount");
  if (!mount) return;

  const active = getActiveSubject();
  // Where a click should navigate to: stay on quiz.html if that's
  // the current page, otherwise land on practice.html.
  const targetPage = window.location.pathname.endsWith("quiz.html") ? "quiz.html" : "practice.html";

  mount.innerHTML = `
    <div class="subject-bar">
      <div class="wrap">
        ${SUBJECTS.map((s) => {
          const isActive = s.id === active;
          if (!s.enabled) {
            return `<span class="subject-tab disabled">${s.label} <span class="soon-pill">Soon</span></span>`;
          }
          return `<a class="subject-tab${isActive ? " active" : ""}" href="${targetPage}?subject=${s.id}">${s.label}</a>`;
        }).join("")}
      </div>
    </div>
  `;

  localStorage.setItem("sq:activeSubject", active);
})();
