/*
  focus-tools.js
  --------------
  Small shared behaviors for the focus-mode toolbar (module.html and
  test.html): text size +/- and print. Kept separate from module.js/
  test.js since both pages need the exact same two buttons.
*/

(function () {
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.3;
  const STEP = 0.1;

  function getScale() {
    const saved = parseFloat(localStorage.getItem("sq:textScale"));
    return isNaN(saved) ? 1 : saved;
  }
  function applyScale(scale) {
    document.documentElement.style.setProperty("--text-scale", scale);
    localStorage.setItem("sq:textScale", scale);
  }

  applyScale(getScale());

  document.addEventListener("DOMContentLoaded", () => {
    const smaller = document.getElementById("text-smaller");
    const larger = document.getElementById("text-larger");
    const printBtn = document.getElementById("print-btn");

    if (smaller) {
      smaller.addEventListener("click", () => {
        applyScale(Math.max(MIN_SCALE, +(getScale() - STEP).toFixed(2)));
      });
    }
    if (larger) {
      larger.addEventListener("click", () => {
        applyScale(Math.min(MAX_SCALE, +(getScale() + STEP).toFixed(2)));
      });
    }
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
  });
})();
