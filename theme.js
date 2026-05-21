(function () {
  "use strict";

  const STORAGE_KEY = "flora-site-theme";
  const DURATION = 900;

  let currentProgress = 0;
  let animationId = null;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function setProgress(value) {
    currentProgress = value;
    document.documentElement.style.setProperty(
      "--theme-progress",
      String(value)
    );
    window.dispatchEvent(
      new CustomEvent("themeprogress", { detail: { progress: value } })
    );
  }

  function getTheme() {
    return currentProgress >= 0.5 ? "day" : "night";
  }

  function updateToggleUI() {
    const isDay = getTheme() === "day";
    document.querySelectorAll(".theme-toggle").forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(isDay));
      toggle.setAttribute(
        "aria-label",
        isDay ? "Switch to night view" : "Switch to day view"
      );
      const label = toggle.querySelector(".theme-toggle-label");
      if (label) label.textContent = isDay ? "night" : "day";
    });
  }

  function applyThemeClass(theme) {
    const isDay = theme === "day";
    document.body.classList.toggle("theme-day", isDay);
    document.body.classList.toggle("theme-night", !isDay);
    updateToggleUI();
  }

  function dispatchThemeSettled(theme) {
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme },
      })
    );
  }

  function animateTo(targetTheme) {
    const target = targetTheme === "day" ? 1 : 0;
    const start = currentProgress;
    const startTime = performance.now();

    if (animationId) cancelAnimationFrame(animationId);

    applyThemeClass(targetTheme);

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / DURATION);
      setProgress(start + (target - start) * easeInOut(t));

      if (t < 1) {
        animationId = requestAnimationFrame(frame);
      } else {
        animationId = null;
        setProgress(target);
        dispatchThemeSettled(targetTheme);
      }
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(target);
      dispatchThemeSettled(targetTheme);
      return;
    }

    animationId = requestAnimationFrame(frame);
  }

  function applyTheme(theme, animate) {
    localStorage.setItem(STORAGE_KEY, theme);
    if (animate) {
      animateTo(theme);
    } else {
      const target = theme === "day" ? 1 : 0;
      setProgress(target);
      applyThemeClass(theme);
      dispatchThemeSettled(theme);
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = saved === "day" ? "day" : "night";
    applyTheme(theme, false);

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = getTheme() === "day" ? "night" : "day";
        applyTheme(next, true);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
