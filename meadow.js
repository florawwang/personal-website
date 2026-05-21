(function () {
  "use strict";

  const canvas = document.getElementById("meadow");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let grass = [];
  let flowers = [];
  let clouds = [];

  const SKY_TOP = "#b8dff5";
  const SKY_MID = "#d4ecfa";
  const SKY_LOW = "#e8f6fc";
  const HILL_FAR = "#9ad08e";
  const HILL_MID = "#78bf70";
  const HILL_NEAR = "#57a85a";

  function getProgress() {
    return (
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--theme-progress"
        )
      ) || 0
    );
  }

  function windAt(x, time) {
    const t = time * 0.001;
    return (
      Math.sin(t * 1.1 + x * 0.008) * 14 +
      Math.sin(t * 1.8 + x * 0.015 + 1.2) * 8 +
      Math.sin(t * 0.6 + x * 0.004) * 5
    );
  }

  function initScene() {
    const meadowTop = height * 0.46;

    grass = [];
    const bladeCount = Math.min(980, Math.floor(width * 1.15));
    for (let i = 0; i < bladeCount; i++) {
      const x = Math.random() * (width + 120) - 60;
      const depth = Math.pow(Math.random(), 0.58);
      const baseY = meadowTop + depth * (height - meadowTop) * 1.08;
      const foreground = depth > 0.72;
      grass.push({
        x,
        baseY,
        height:
          26 +
          depth * 92 +
          Math.random() * (foreground ? 90 : 42),
        width: 0.45 + depth * 1.1,
        phase: Math.random() * Math.PI * 2,
        depth,
        hue: 86 + depth * 34 + Math.random() * 8,
        lean: (Math.random() - 0.35) * 18,
        hasSeed: foreground && Math.random() > 0.72,
      });
    }
    grass.sort((a, b) => a.depth - b.depth);

    flowers = [];
    const flowerCount = Math.min(150, Math.floor(width / 10));
    const colors = [
      { petal: "#fff8f0", center: "#f5d76e" },
      { petal: "#ffe4ec", center: "#f5c6d6" },
      { petal: "#f0f8ff", center: "#fffacd" },
      { petal: "#fff5e6", center: "#ffd93d" },
      { petal: "#e8f4ff", center: "#b8d4f0" },
      { petal: "#ff6f61", center: "#ffc857" },
      { petal: "#fffdf5", center: "#f2c94c" },
    ];
    for (let i = 0; i < flowerCount; i++) {
      const depth = Math.pow(Math.random(), 0.72);
      const y = meadowTop + 10 + depth * (height - meadowTop - 20);
      flowers.push({
        x: Math.random() * width,
        y,
        size: 2.2 + depth * 4.8 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        depth,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.34 ? "bloom" : "dot",
      });
    }

    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * width,
        y: height * (0.06 + Math.random() * 0.2),
        scale: 0.9 + Math.random() * 1.6,
        speed: 0.012 + Math.random() * 0.02,
        puff: Math.random() * 100,
      });
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(0.5, SKY_MID);
    g.addColorStop(1, SKY_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCloud(c, time) {
    const drift = prefersReducedMotion ? 0 : time * 0.001 * c.speed * 40;
    const x = ((c.x + drift) % (width + 200)) - 100;
    const s = c.scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.beginPath();
    ctx.ellipse(x, c.y, 56 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 35 * s, c.y - 8 * s, 42 * s, 27 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 34 * s, c.y - 2 * s, 34 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
    ctx.beginPath();
    ctx.ellipse(x + 8 * s, c.y + 16 * s, 82 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLighthouse() {
    const h = height;
    const w = width;
    const x = w * 0.72;
    const baseY = h * 0.515;
    const towerH = h * 0.34;
    const towerW = Math.max(54, w * 0.055);
    const topY = baseY - towerH;
    const lanternY = topY + towerH * 0.1;
    const lanternH = towerH * 0.13;
    const balconyY = topY + towerH * 0.25;
    const balconyW = towerW * 1.45;

    ctx.fillStyle = "rgba(80, 120, 110, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, baseY + h * 0.012, towerW * 2.2, h * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();

    const beam = ctx.createLinearGradient(x - w * 0.42, lanternY, x + w * 0.08, lanternY);
    beam.addColorStop(0, "rgba(255, 248, 190, 0)");
    beam.addColorStop(0.62, "rgba(255, 248, 190, 0.22)");
    beam.addColorStop(1, "rgba(255, 248, 190, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - towerW * 0.35, lanternY + lanternH * 0.42);
    ctx.lineTo(x - w * 0.42, lanternY - h * 0.035);
    ctx.lineTo(x - w * 0.42, lanternY + h * 0.085);
    ctx.closePath();
    ctx.fill();

    const towerGrad = ctx.createLinearGradient(x - towerW, topY, x + towerW, baseY);
    towerGrad.addColorStop(0, "#fff9e8");
    towerGrad.addColorStop(0.52, "#f2e9d0");
    towerGrad.addColorStop(1, "#d9ceb4");
    ctx.fillStyle = towerGrad;
    ctx.beginPath();
    ctx.moveTo(x - towerW * 0.58, baseY);
    ctx.lineTo(x - towerW * 0.38, balconyY);
    ctx.quadraticCurveTo(x, balconyY - towerH * 0.02, x + towerW * 0.38, balconyY);
    ctx.lineTo(x + towerW * 0.58, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(85, 95, 94, 0.12)";
    ctx.beginPath();
    ctx.moveTo(x + towerW * 0.12, balconyY);
    ctx.lineTo(x + towerW * 0.58, baseY);
    ctx.lineTo(x + towerW * 0.24, baseY);
    ctx.quadraticCurveTo(x + towerW * 0.12, towerH * 0.65, x + towerW * 0.08, balconyY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(120, 105, 90, 0.28)";
    ctx.lineWidth = Math.max(1, w * 0.001);
    for (let i = 0; i < 5; i++) {
      const y = balconyY + towerH * (0.15 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(x - towerW * (0.34 + i * 0.035), y);
      ctx.quadraticCurveTo(x, y - towerH * 0.012, x + towerW * (0.34 + i * 0.035), y);
      ctx.stroke();
    }

    ctx.fillStyle = "#7f4f43";
    const stripeCount = 3;
    for (let i = 0; i < stripeCount; i++) {
      const y = balconyY + towerH * (0.18 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(x - towerW * (0.38 + i * 0.035), y);
      ctx.lineTo(x + towerW * (0.38 + i * 0.035), y + towerH * 0.028);
      ctx.lineTo(x + towerW * (0.43 + i * 0.035), y + towerH * 0.075);
      ctx.lineTo(x - towerW * (0.43 + i * 0.035), y + towerH * 0.047);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#263f46";
    for (let i = 0; i < 3; i++) {
      const y = balconyY + towerH * (0.2 + i * 0.17);
      ctx.beginPath();
      ctx.roundRect(x - towerW * 0.12, y, towerW * 0.24, towerH * 0.06, towerW * 0.06);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 246, 190, 0.48)";
      ctx.fillRect(x - towerW * 0.055, y + towerH * 0.01, towerW * 0.11, towerH * 0.018);
      ctx.fillStyle = "#263f46";
    }

    ctx.fillStyle = "#d3c1a5";
    ctx.fillRect(x - balconyW * 0.5, balconyY - towerH * 0.015, balconyW, towerH * 0.025);

    ctx.strokeStyle = "#4d6669";
    ctx.lineWidth = Math.max(1.2, w * 0.0014);
    ctx.beginPath();
    ctx.moveTo(x - balconyW * 0.5, balconyY - towerH * 0.045);
    ctx.lineTo(x + balconyW * 0.5, balconyY - towerH * 0.045);
    ctx.stroke();
    for (let i = 0; i <= 7; i++) {
      const railX = x - balconyW * 0.5 + (balconyW * i) / 7;
      ctx.beginPath();
      ctx.moveTo(railX, balconyY - towerH * 0.045);
      ctx.lineTo(railX, balconyY + towerH * 0.01);
      ctx.stroke();
    }

    ctx.fillStyle = "#4c6a70";
    ctx.fillRect(x - towerW * 0.55, lanternY, towerW * 1.1, lanternH);

    const glassGrad = ctx.createLinearGradient(x - towerW * 0.4, lanternY, x + towerW * 0.4, lanternY);
    glassGrad.addColorStop(0, "#6f9298");
    glassGrad.addColorStop(0.5, "#fff0a3");
    glassGrad.addColorStop(1, "#6f9298");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(x - towerW * 0.38, lanternY + lanternH * 0.18, towerW * 0.76, lanternH * 0.58);

    ctx.strokeStyle = "#2f5057";
    ctx.lineWidth = Math.max(1, w * 0.0012);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * towerW * 0.23, lanternY + lanternH * 0.12);
      ctx.lineTo(x + i * towerW * 0.23, lanternY + lanternH * 0.85);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 242, 150, 0.88)";
    ctx.beginPath();
    ctx.ellipse(x, lanternY + lanternH * 0.5, towerW * 0.2, lanternH * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3f5d63";
    ctx.beginPath();
    ctx.moveTo(x - towerW * 0.72, lanternY);
    ctx.lineTo(x, topY);
    ctx.lineTo(x + towerW * 0.72, lanternY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#2f5057";
    ctx.fillRect(x - towerW * 0.08, topY - towerH * 0.035, towerW * 0.16, towerH * 0.04);
  }

  function drawHills() {
    const h = height;
    const w = width;

    drawLighthouse();

    ctx.fillStyle = HILL_FAR;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.44);
    ctx.bezierCurveTo(w * 0.2, h * 0.38, w * 0.45, h * 0.5, w * 0.7, h * 0.4);
    ctx.bezierCurveTo(w * 0.88, h * 0.34, w * 0.95, h * 0.48, w, h * 0.44);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = HILL_MID;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.49);
    ctx.bezierCurveTo(w * 0.15, h * 0.45, w * 0.35, h * 0.56, w * 0.55, h * 0.48);
    ctx.bezierCurveTo(w * 0.75, h * 0.4, w * 0.9, h * 0.52, w, h * 0.49);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    const meadowGrad = ctx.createLinearGradient(0, h * 0.46, 0, h);
    meadowGrad.addColorStop(0, HILL_NEAR);
    meadowGrad.addColorStop(0.34, "#6fcf62");
    meadowGrad.addColorStop(0.72, "#48a548");
    meadowGrad.addColorStop(1, "#2f7e3a");
    ctx.fillStyle = meadowGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.5);
    ctx.bezierCurveTo(w * 0.25, h * 0.44, w * 0.5, h * 0.54, w * 0.75, h * 0.48);
    ctx.bezierCurveTo(w * 0.92, h * 0.45, w, h * 0.52, w, h * 0.5);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  function drawGrassBlade(blade, time) {
    const w = windAt(blade.x, time) * (0.9 + blade.depth * 0.85);
    const tipX = blade.x + blade.lean + w * 1.35;
    const tipY = blade.baseY - blade.height;
    const midX = blade.x + blade.lean * 0.45 + w * 0.52;
    const midY = blade.baseY - blade.height * 0.62;
    const rootX = blade.x - blade.lean * 0.08;

    const lightness = 36 + blade.depth * 18;
    ctx.strokeStyle = `hsla(${blade.hue}, 58%, ${lightness}%, ${0.38 + blade.depth * 0.48})`;
    ctx.lineWidth = blade.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rootX, blade.baseY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();

    if (!blade.hasSeed) return;

    const seedCount = 4 + Math.floor(blade.depth * 5);
    ctx.fillStyle = `hsla(55, 70%, ${62 + blade.depth * 10}%, 0.72)`;
    for (let i = 0; i < seedCount; i++) {
      const offset = (i / seedCount) * 18;
      const side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(
        tipX + side * (3 + blade.depth * 5),
        tipY + offset,
        1.2 + blade.depth * 0.9,
        3 + blade.depth * 1.4,
        side * 0.65,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  function drawFlower(f, time) {
    const sway = prefersReducedMotion
      ? 0
      : windAt(f.x, time) * 0.12 * (1 + f.depth);
    const x = f.x + sway;
    const y = f.y;

    if (f.type === "dot") {
      ctx.fillStyle = f.color.petal;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, f.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    const petals = 5;
    ctx.fillStyle = f.color.petal;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + f.phase * 0.1;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(a) * f.size * 0.55,
        y + Math.sin(a) * f.size * 0.55,
        f.size * 0.5,
        f.size * 0.35,
        a,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillStyle = f.color.center;
    ctx.beginPath();
    ctx.arc(x, y, f.size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(time) {
    const progress = getProgress();
    ctx.clearRect(0, 0, width, height);
    if (progress <= 0.001) return;
    ctx.globalAlpha = progress;

    drawSky();
    clouds.forEach((c) => drawCloud(c, time));
    drawHills();

    for (const blade of grass) {
      drawGrassBlade(blade, time);
    }
    for (const f of flowers) {
      drawFlower(f, time);
    }
    drawForegroundSweeps(time);

    ctx.globalAlpha = 1;
  }

  function drawForegroundSweeps(time) {
    const count = Math.min(70, Math.floor(width / 18));
    for (let i = 0; i < count; i++) {
      const x = (i / count) * width + ((i * 37) % 24) - 12;
      const baseY = height * (0.78 + ((i * 17) % 19) / 90);
      const bladeHeight = height * (0.16 + ((i * 13) % 18) / 100);
      const wind = windAt(x, time) * 1.8;
      const tipX = x + wind + 22;
      const tipY = baseY - bladeHeight;

      ctx.strokeStyle =
        i % 3 === 0
          ? "rgba(202, 236, 115, 0.58)"
          : "rgba(86, 176, 77, 0.48)";
      ctx.lineWidth = i % 4 === 0 ? 1.3 : 0.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.bezierCurveTo(
        x + wind * 0.25,
        baseY - bladeHeight * 0.35,
        tipX - wind * 0.15,
        baseY - bladeHeight * 0.72,
        tipX,
        tipY
      );
      ctx.stroke();
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initScene();
  }

  function loop(time) {
    draw(time);
    if (!prefersReducedMotion || getProgress() > 0) {
      requestAnimationFrame(loop);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("themeprogress", () => draw(performance.now()));

  resize();
  requestAnimationFrame(loop);
})();
