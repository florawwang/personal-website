(function () {
  "use strict";

  function getProgress() {
    return (
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--theme-progress"
        )
      ) || 0
    );
  }

  function initPageStars() {
    const page = document.querySelector(".page");
    if (!page || page.querySelector(".page-stars")) return;

    const container = document.createElement("div");
    container.className = "page-stars";
    container.setAttribute("aria-hidden", "true");

    const positions = [
      { left: 8, top: 12 },
      { left: 22, top: 28 },
      { left: 38, top: 8 },
      { left: 55, top: 18 },
      { left: 72, top: 6 },
      { left: 88, top: 22 },
      { left: 94, top: 42 },
      { left: 78, top: 55 },
      { left: 62, top: 72 },
      { left: 45, top: 88 },
      { left: 28, top: 78 },
      { left: 12, top: 62 },
      { left: 6, top: 45 },
      { left: 18, top: 52 },
      { left: 85, top: 68 },
      { left: 52, top: 38 },
      { left: 35, top: 58 },
      { left: 68, top: 35 },
      { left: 15, top: 85 },
      { left: 92, top: 82 },
    ];

    positions.forEach((pos, i) => {
      const star = document.createElement("span");
      star.className = "page-star";
      if (i % 4 === 0) star.classList.add("page-star--md");
      if (i % 5 === 2) star.classList.add("page-star--bright");
      star.style.left = `${pos.left}%`;
      star.style.top = `${pos.top}%`;
      star.style.animationDelay = `${(i * 0.37) % 5}s`;
      star.style.animationDuration = `${4 + (i % 3)}s`;
      container.appendChild(star);
    });

    page.insertBefore(container, page.firstChild);
  }

  initPageStars();

  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let stars = [];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
  }

  function initStars() {
    const day = getProgress() >= 0.5;
    const count = day
      ? Math.min(90, Math.floor((width * height) / 12000))
      : Math.min(280, Math.floor((width * height) / 4500));

    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: day ? Math.random() * 1.8 + 0.4 : Math.random() * 1.4 + 0.2,
      opacity: day ? Math.random() * 0.35 + 0.2 : Math.random() * 0.6 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.005,
      warm: Math.random(),
    }));
  }

  function drawStars(time) {
    ctx.clearRect(0, 0, width, height);
    const prog = getProgress();
    const nightFade = 1 - prog;
    if (nightFade <= 0.01) return;

    const t = time * 0.001;

    for (const star of stars) {
      let opacity = star.opacity * nightFade;
      if (!prefersReducedMotion) {
        opacity *= 0.6 + 0.4 * Math.sin(t * star.speed * 60 + star.twinkle);
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(223, 230, 255, ${opacity})`;
      ctx.fill();
    }
  }

  function loop(time) {
    drawStars(time);
    if (!prefersReducedMotion) {
      requestAnimationFrame(loop);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("themechange", () => {
    initStars();
    drawStars(performance.now());
  });

  resize();
  if (prefersReducedMotion) {
    drawStars(0);
  } else {
    requestAnimationFrame(loop);
  }
})();
