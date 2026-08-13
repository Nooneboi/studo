/*
  app.js
  ------
  Shared site-shell behavior:
  - adds the Progress destination without duplicating nav markup on every page
  - marks the current destination active
*/
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("nav.site-nav").forEach((nav) => {
    if (!nav.querySelector('a[href="progress.html"]')) {
      const progressLink = document.createElement("a");
      progressLink.href = "progress.html";
      progressLink.textContent = "Progress";
      const resources = nav.querySelector('a[href="resources.html"]');
      nav.insertBefore(progressLink, resources || null);
    }
  });

  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === path);
  });
});
