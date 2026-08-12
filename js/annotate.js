/*
  annotate.js
  -----------
  Adds a lightweight markup layer to the focus-mode toolbar:
   - Draw   freehand pen, for circling/underlining like on paper
   - Shape  click-drag rectangles, for boxing off an answer
   - Erase  drag to remove marks
   - Highlight is a hint only — text-selection highlighting already
     works everywhere (see module.js/test.js); this button just
     reminds people it's there.
   - Copy   copies the passage + question text to the clipboard
   - Share  copies this page's link (or opens the native share sheet
     on devices that support it)

  Marks are drawn on a transparent canvas positioned over the content
  and are NOT saved — refreshing clears them, same as picking up a
  fresh sheet of paper. That's intentional, not a bug: this is scratch
  markup for the current sitting, not part of your saved progress.

  Not included: crop and "edit in [app]" — there's no image to crop
  or export here, so those two didn't have anything to map to.
*/

(function () {
  let canvas, ctx, mode = null; // null | "draw" | "shape" | "erase"
  let drawing = false;
  let startX = 0, startY = 0;
  let snapshotBeforeShape = null;

  function ensureCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.id = "annotate-canvas";
    Object.assign(canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "20",
      pointerEvents: "none",
    });
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return canvas;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const prev = canvas.toDataURL ? safeSnapshot() : null;
    canvas.width = document.documentElement.scrollWidth;
    canvas.height = document.documentElement.scrollHeight;
    ctx.strokeStyle = "#E03A3A";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (prev) restoreSnapshot(prev);
  }
  function safeSnapshot() {
    try { return canvas.toDataURL(); } catch (e) { return null; }
  }
  function restoreSnapshot(dataUrl) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = dataUrl;
  }

  function setMode(newMode) {
    mode = mode === newMode ? null : newMode;
    ensureCanvas();
    canvas.style.pointerEvents = mode ? "auto" : "none";
    canvas.style.cursor = mode === "erase" ? "cell" : mode ? "crosshair" : "default";
    document.querySelectorAll("[data-annotate-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.annotateMode === mode);
    });
  }

  function onPointerDown(e) {
    if (!mode) return;
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left + window.scrollX;
    startY = e.clientY - rect.top + window.scrollY;
    if (mode === "shape") snapshotBeforeShape = safeSnapshot();
    if (mode === "draw") {
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
    }
  }

  function onPointerMove(e) {
    if (!drawing || !mode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;

    if (mode === "draw") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (mode === "shape") {
      if (snapshotBeforeShape) restoreCanvasSync(snapshotBeforeShape);
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    }
  }

  function onPointerUp() {
    drawing = false;
  }

  // Synchronous-ish restore for live shape preview (avoids async Image lag)
  let snapshotImg = new Image();
  function restoreCanvasSync(dataUrl) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (snapshotImg.src !== dataUrl) snapshotImg.src = dataUrl;
    ctx.drawImage(snapshotImg, 0, 0);
  }

  function clearAll() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function copyContent() {
    const parts = [];
    document.querySelectorAll(".passage-text").forEach((el) => parts.push(el.textContent.trim()));
    document.querySelectorAll(".q-prompt").forEach((el) => parts.push(el.textContent.trim()));
    const text = parts.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      flashLabel("copy-btn", "Copied!");
    } catch (e) {
      flashLabel("copy-btn", "Couldn't copy");
    }
  }

  async function shareContent() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch (e) {
        /* user cancelled — do nothing */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      flashLabel("share-btn", "Link copied!");
    } catch (e) {
      flashLabel("share-btn", "Couldn't copy");
    }
  }

  function flashLabel(id, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const original = btn.title;
    btn.title = text;
    btn.classList.add("active");
    setTimeout(() => {
      btn.title = original;
      btn.classList.remove("active");
    }, 1200);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-annotate-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.annotateMode));
    });
    const clearBtn = document.getElementById("annotate-clear-btn");
    if (clearBtn) clearBtn.addEventListener("click", clearAll);
    const copyBtn = document.getElementById("copy-btn");
    if (copyBtn) copyBtn.addEventListener("click", copyContent);
    const shareBtn = document.getElementById("share-btn");
    if (shareBtn) shareBtn.addEventListener("click", shareContent);
  });
})();
