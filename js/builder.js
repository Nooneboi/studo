/*
  builder.js
  ----------
  Runs the private Builder page (builder.html). This is YOUR editing
  tool — not something you share with learners. It has no login
  because it's a static page: keep its link to yourself, or delete
  builder.html from the published site if you're worried about it
  being found (see README).

  Flow:
   1. Fill in quiz details + questions using the form.
   2. Click "Download quiz JSON" — a .json file downloads.
   3. Drop that file into the site's /data folder (via GitHub's
      website) and add an entry to data/index.json.
   4. You can also "Load a quiz file" to keep editing one you
      already made.
*/

let questionCount = 0;

const form = document.getElementById("builder-form");
const questionsWrap = document.getElementById("questions-wrap");

document.getElementById("add-question-btn").addEventListener("click", () => addQuestion());
document.getElementById("download-btn").addEventListener("click", downloadJson);
document.getElementById("load-input").addEventListener("change", handleLoadFile);

// Start with one blank question so the form isn't empty
addQuestion();

function addQuestion(data) {
  questionCount += 1;
  const qid = data?.id || `q${questionCount}`;
  const wrapper = document.createElement("div");
  wrapper.className = "builder-question";
  wrapper.dataset.qid = qid;

  wrapper.innerHTML = `
    <div class="row-inline">
      <div class="field" style="flex:3">
        <label>Question text</label>
        <textarea class="f-prompt">${escapeHtml(data?.prompt || "")}</textarea>
      </div>
      <div class="field" style="flex:1">
        <label>Type</label>
        <select class="f-type">
          <option value="multiple_choice">Multiple choice</option>
          <option value="fill_blank">Fill in the blank</option>
          <option value="open_ended">Open ended</option>
        </select>
      </div>
    </div>

    <div class="options-editor"></div>

    <div class="field fill-answer-field hidden">
      <label>Correct answer (for auto-check reference; fill-in-the-blank isn't auto-graded)</label>
      <input type="text" class="f-fill-answer" value="${escapeAttr(data?.correct || "")}">
    </div>

    <div class="row-inline">
      <div class="field">
        <label>Points</label>
        <input type="number" class="f-points" min="1" value="${data?.points || 1}">
      </div>
      <div class="field">
        <label>Time limit (seconds, optional)</label>
        <input type="number" class="f-time" min="0" value="${data?.time || ""}">
      </div>
    </div>

    <div class="field">
      <label>Answer explanation</label>
      <textarea class="f-explanation">${escapeHtml(data?.explanation || "")}</textarea>
    </div>

    <div style="text-align:right">
      <button type="button" class="btn ghost small remove-question-btn">Remove question</button>
    </div>
  `;

  const typeSelect = wrapper.querySelector(".f-type");
  const optionsEditor = wrapper.querySelector(".options-editor");
  const fillAnswerField = wrapper.querySelector(".fill-answer-field");

  function renderOptionsEditor() {
    const type = typeSelect.value;
    if (type === "multiple_choice") {
      fillAnswerField.classList.add("hidden");
      const opts = data?.options || [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ];
      optionsEditor.innerHTML =
        `<label>Answer options — check the correct one(s)</label>` +
        opts
          .map(
            (o) => `
            <div class="option-row">
              <input type="checkbox" class="f-opt-correct" data-optid="${o.id}" ${
              (data?.correct || []).includes(o.id) ? "checked" : ""
            }>
              <input type="text" class="f-opt-text" data-optid="${o.id}" placeholder="Option ${o.id.toUpperCase()}" value="${escapeAttr(
              o.text
            )}">
            </div>`
          )
          .join("");
    } else if (type === "fill_blank") {
      optionsEditor.innerHTML = "";
      fillAnswerField.classList.remove("hidden");
    } else {
      optionsEditor.innerHTML = "";
      fillAnswerField.classList.add("hidden");
    }
  }

  typeSelect.value = data?.type || "multiple_choice";
  renderOptionsEditor();
  typeSelect.addEventListener("change", renderOptionsEditor);

  wrapper.querySelector(".remove-question-btn").addEventListener("click", () => wrapper.remove());

  questionsWrap.appendChild(wrapper);
}

function collectQuiz() {
  const quiz = {
    id: document.getElementById("quiz-id").value.trim() || `quiz-${Date.now()}`,
    title: document.getElementById("quiz-title").value.trim() || "Untitled quiz",
    description: document.getElementById("quiz-description").value.trim(),
    passage: document.getElementById("quiz-passage").value.trim(),
    questions: [],
  };

  questionsWrap.querySelectorAll(".builder-question").forEach((wrapper, i) => {
    const type = wrapper.querySelector(".f-type").value;
    const q = {
      id: wrapper.dataset.qid || `q${i + 1}`,
      type,
      prompt: wrapper.querySelector(".f-prompt").value.trim(),
      points: Number(wrapper.querySelector(".f-points").value) || 1,
      explanation: wrapper.querySelector(".f-explanation").value.trim(),
    };
    const timeVal = wrapper.querySelector(".f-time").value;
    if (timeVal) q.time = Number(timeVal);

    if (type === "multiple_choice") {
      const opts = [];
      const correct = [];
      wrapper.querySelectorAll(".f-opt-text").forEach((input) => {
        const id = input.dataset.optid;
        opts.push({ id, text: input.value.trim() });
      });
      wrapper.querySelectorAll(".f-opt-correct:checked").forEach((cb) => correct.push(cb.dataset.optid));
      q.options = opts;
      q.correct = correct;
    } else if (type === "fill_blank") {
      q.correct = wrapper.querySelector(".f-fill-answer").value.trim();
    }

    quiz.questions.push(q);
  });

  return quiz;
}

function downloadJson() {
  const quiz = collectQuiz();
  const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quiz.id}.json`;
  a.click();
  URL.revokeObjectURL(url);

  document.getElementById("download-hint").classList.remove("hidden");
}

function handleLoadFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const quiz = JSON.parse(reader.result);
      document.getElementById("quiz-id").value = quiz.id || "";
      document.getElementById("quiz-title").value = quiz.title || "";
      document.getElementById("quiz-description").value = quiz.description || "";
      document.getElementById("quiz-passage").value = quiz.passage || "";
      questionsWrap.innerHTML = "";
      (quiz.questions || []).forEach((q) => addQuestion(q));
    } catch (err) {
      alert("That file doesn't look like a valid quiz JSON.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
