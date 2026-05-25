(function () {
  "use strict";

  const canvas = document.getElementById("dot-planet");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const PALETTES = {
    night: {
      dark: [155, 132, 102],
      light: [232, 212, 178],
      ring: [232, 212, 178],
    },
    day: {
      dark: [90, 140, 110],
      light: [180, 220, 195],
      ring: [200, 235, 210],
    },
  };

  let logicalSize = 600;
  let SPHERE_R = 94;
  let RING_RX = 162;
  let RING_RZ = 38;
  let ORBIT_R = 210;

  function getProgress() {
    return (
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--theme-progress"
        )
      ) || 0
    );
  }

  function lerpArr(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function getPalette() {
    const t = getProgress();
    return {
      dark: lerpArr(PALETTES.night.dark, PALETTES.day.dark, t),
      light: lerpArr(PALETTES.night.light, PALETTES.day.light, t),
      ring: lerpArr(PALETTES.night.ring, PALETTES.day.ring, t),
    };
  }

  function lerpRgb(dark, light, t) {
    return [
      Math.round(dark[0] + (light[0] - dark[0]) * t),
      Math.round(dark[1] + (light[1] - dark[1]) * t),
      Math.round(dark[2] + (light[2] - dark[2]) * t),
    ];
  }

  function setDimensions() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    logicalSize = Math.max(400, Math.round(rect.width * dpr));
    const scale = logicalSize / 600;

    SPHERE_R = 94 * scale;
    RING_RX = 162 * scale;
    RING_RZ = 38 * scale;
    ORBIT_R = 210 * scale;

    canvas.width = logicalSize;
    canvas.height = logicalSize;
    rebuildDots();
  }

  let dots = [];

  function fibonacciSphere(count, radius) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      pts.push({
        x: Math.cos(theta) * r * radius,
        y: y * radius,
        z: Math.sin(theta) * r * radius,
        kind: "sphere",
      });
    }
    return pts;
  }

  function ringDots(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      pts.push({
        x: Math.cos(t) * RING_RX,
        y: 0,
        z: Math.sin(t) * RING_RZ,
        kind: "ring",
      });
    }
    return pts;
  }

  function orbitDots(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        baseAngle: (i / count) * Math.PI * 2,
        kind: "orbit",
      });
    }
    return pts;
  }

  function rebuildDots() {
    dots = [
      ...fibonacciSphere(100, SPHERE_R),
      ...ringDots(40),
    ];
  }

  function rotate(point, ay, ax, orbitAngle) {
    let x;
    let y;
    let z;

    if (point.kind === "orbit") {
      const t = point.baseAngle + orbitAngle;
      x = Math.cos(t) * ORBIT_R;
      y = Math.sin(t) * ORBIT_R * 0.1;
      z = Math.sin(t) * ORBIT_R * 0.32;
    } else {
      x = point.x;
      y = point.y;
      z = point.z;

      if (point.kind === "ring") {
        const tilt = 0.52;
        const cr = Math.cos(tilt);
        const sr = Math.sin(tilt);
        const rx = x;
        const ry = y * cr - z * sr;
        const rz = y * sr + z * cr;
        x = rx;
        y = ry;
        z = rz;
      }
    }

    const cy = Math.cos(ay);
    const sy = Math.sin(ay);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;

    const cx = Math.cos(ax);
    const sx = Math.sin(ax);
    const y2 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;

    return { x: x1, y: y2, z: z2 };
  }

  function draw(time) {
    const CX = logicalSize / 2;
    const CY = logicalSize / 2;
    const depthScale = logicalSize * 0.78;
    const palette = getPalette();
    const scale = logicalSize / 600;

    const t = time * 0.00032;
    const ay = 0;
    const ax = 0.38;
    const orbitAngle = t * 0.5;
    const bounceY = Math.sin(time * 0.0019) * logicalSize * 0.012;

    const projected = dots.map((dot) => {
      const p = rotate(dot, ay, ax, orbitAngle);
      const depth = (p.z + depthScale * 0.5) / depthScale;
      return {
        sx: CX + p.x,
        sy: CY + p.y * 0.9 + bounceY,
        depth,
        kind: dot.kind,
      };
    });

    projected.sort((a, b) => a.depth - b.depth);

    ctx.clearRect(0, 0, logicalSize, logicalSize);

    const themeT = getProgress();

    for (const p of projected) {
      const alpha = 0.35 + p.depth * (0.65 - themeT * 0.1);
      const radius =
        (p.kind === "orbit" ? 2.4 : p.kind === "ring" ? 1.9 : 1.35 + p.depth * 0.9) *
        scale;

      const [r, g, b] =
        p.kind === "ring"
          ? palette.ring
          : lerpRgb(palette.dark, palette.light, p.depth);

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  }

  let rafId = null;

  function loop(time) {
    draw(time);
    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    setDimensions();
    if (prefersReducedMotion) {
      draw(0);
    } else {
      rafId = requestAnimationFrame(loop);
    }
  }

  const resizeObserver = new ResizeObserver(() => start());
  resizeObserver.observe(canvas);
  window.addEventListener("themeprogress", () => draw(performance.now()));
  start();
})();
