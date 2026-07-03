(function () {
  "use strict";

  const CONSTELLATIONS = window.SKY_DATA || [];

  // Angular size (radians) of constellation silhouettes; when focused, the
  // same silhouette simply grows by EXPAND_GROWTH.
  const SHAPE_SPREAD = 0.19;
  const EXPAND_GROWTH = 0.65;

  const FOCAL_DEFAULT = 0.8; // multiplied by min(width, height)
  const FOCAL_FOCUSED = 1.35;
  const FOCAL_MIN = 0.6;
  const FOCAL_MAX = 2.6;

  const canvas = document.getElementById("sky-canvas");
  const hint = document.getElementById("sky-hint");
  const label = document.getElementById("sky-label");
  const backBtn = document.getElementById("sky-back");
  const previewEl = document.getElementById("sky-preview");
  const previewYear = document.getElementById("sky-preview-year");
  const previewTitle = document.getElementById("sky-preview-title");
  const previewRole = document.getElementById("sky-preview-role");
  const previewDesc = document.getElementById("sky-preview-desc");
  const previewImage = document.getElementById("sky-preview-image");
  const previewPhoto = document.getElementById("sky-preview-photo");
  const previewLink = document.getElementById("sky-preview-link");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let focalBase = 0;

  // —— Celestial sphere state ——
  // Anchors (0–1) wrap the full sphere:
  // x → azimuth −180°…+180° (constellations surround you),
  // y → altitude +45°…−45°
  function anchorToAzAlt(anchor) {
    return {
      az: (anchor.x - 0.5) * (Math.PI * 2),
      alt: (0.5 - anchor.y) * (Math.PI * 0.5),
    };
  }

  const camera = {
    yaw: 0,
    pitch: 0,
    zoom: FOCAL_DEFAULT,
    targetYaw: 0,
    targetPitch: 0,
    targetZoom: FOCAL_DEFAULT,
    velYaw: 0,
    velPitch: 0,
  };

  // Start looking at the projects constellation
  {
    const start = CONSTELLATIONS.find((c) => c.id === "projects");
    if (start) {
      const aa = anchorToAzAlt(start.anchor);
      camera.yaw = camera.targetYaw = aa.az;
      camera.pitch = camera.targetPitch = aa.alt * 0.5;
    }
  }

  let focusedId = null;
  let expandT = 0;
  let hoverConstellationId = null;
  let hoverNode = null;
  let previewNodeKey = null;

  let dragging = false;
  let dragMoved = false;
  let lastPointer = { x: 0, y: 0 };

  let bgStars = [];
  let milkyStars = [];
  let milkyBlobs = [];

  // —— Vector helpers ——
  function dirFromAzAlt(az, alt) {
    const ca = Math.cos(alt);
    return { x: ca * Math.sin(az), y: Math.sin(alt), z: ca * Math.cos(az) };
  }

  function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  function add(a, b, s) {
    return { x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Tangent basis at a sky direction (east & local up) for laying out star offsets
  function tangentBasis(dir) {
    const worldUp = { x: 0, y: 1, z: 0 };
    let east = cross(worldUp, dir);
    const len = Math.hypot(east.x, east.y, east.z);
    if (len < 0.001) east = { x: 1, y: 0, z: 0 };
    else east = { x: east.x / len, y: east.y / len, z: east.z / len };
    const up = cross(dir, east);
    return { east, up };
  }

  // Project a sphere direction to screen. Returns null when behind the camera.
  function project(dir) {
    const cy = Math.cos(-camera.yaw);
    const sy = Math.sin(-camera.yaw);
    let x = dir.x * cy + dir.z * sy;
    let z = -dir.x * sy + dir.z * cy;
    const y = dir.y;

    const cp = Math.cos(-camera.pitch);
    const sp = Math.sin(-camera.pitch);
    const y2 = y * cp + z * sp;
    const z2 = -y * sp + z * cp;

    if (z2 <= 0.08) return null;

    const f = focalBase * camera.zoom;
    return {
      x: width * 0.5 + (x / z2) * f,
      y: height * 0.5 - (y2 / z2) * f,
      depth: z2,
    };
  }

  // —— Setup ——
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    focalBase = Math.min(width, height);
  }

  function randomSphereDir() {
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    return { x: r * Math.cos(theta), y: z, z: r * Math.sin(theta) };
  }

  function gaussian() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function initSky() {
    // Background stars all over the sphere; realistic magnitude distribution
    // (many faint stars, few bright ones)
    const count = 1400;
    bgStars = Array.from({ length: count }, () => {
      const mag = Math.pow(Math.random(), 2.6);
      return {
        dir: randomSphereDir(),
        r: 0.3 + mag * 1.5,
        opacity: 0.1 + mag * 0.65,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.6 + 0.4,
        warm: Math.pow(Math.random(), 1.6),
      };
    });

    // Milky way — faint dense band along a tilted great circle
    const bandNormal = normalize({ x: 0.42, y: 0.86, z: 0.28 });
    let u = cross(bandNormal, { x: 0, y: 0, z: 1 });
    u = normalize(u);
    const v = cross(bandNormal, u);

    milkyStars = Array.from({ length: 900 }, () => {
      const t = Math.random() * Math.PI * 2;
      const off = gaussian() * 0.16;
      let dir = add(
        add({ x: 0, y: 0, z: 0 }, u, Math.cos(t)),
        v,
        Math.sin(t)
      );
      dir = normalize(add(dir, bandNormal, off));
      return {
        dir,
        r: 0.25 + Math.pow(Math.random(), 3) * 0.9,
        opacity: 0.05 + Math.random() * 0.16,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.2 + 0.3,
        warm: Math.random() * 0.55,
      };
    });

    milkyBlobs = Array.from({ length: 46 }, () => {
      const t = Math.random() * Math.PI * 2;
      const off = gaussian() * 0.1;
      let dir = add(
        add({ x: 0, y: 0, z: 0 }, u, Math.cos(t)),
        v,
        Math.sin(t)
      );
      dir = normalize(add(dir, bandNormal, off));
      return {
        dir,
        radius: 50 + Math.random() * 110,
        opacity: 0.015 + Math.random() * 0.03,
        warm: Math.random() * 0.4,
      };
    });
  }

  // —— Constellation geometry ——
  // The silhouette IS the layout: when focused it grows in place and its
  // first N stars become the clickable nodes (node i ↔ shape star i).
  function silhouetteDirs(c, spread) {
    const aa = anchorToAzAlt(c.anchor);
    const dir = dirFromAzAlt(aa.az, aa.alt);
    const { east, up } = tangentBasis(dir);
    return c.shape.stars.map((s) => ({
      dir: normalize(add(add(dir, east, s.x * spread), up, -s.y * spread)),
      size: s.size ?? 1,
      warm: s.warm ?? 0.3,
    }));
  }

  function shapeDirs(c) {
    return silhouetteDirs(c, SHAPE_SPREAD);
  }

  function currentSpread() {
    return SHAPE_SPREAD * (1 + EXPAND_GROWTH * easeOutCubic(expandT));
  }

  function nodeCount(c) {
    return Math.min(c.nodes.length, c.shape.stars.length);
  }

  // —— Star rendering ——
  function starRgb(warm, alpha) {
    // blue-white → warm yellow → orange-red
    const r = Math.round(lerp(170, 255, Math.min(1, warm * 1.15)));
    const g = Math.round(lerp(200, 226, warm) - Math.max(0, warm - 0.75) * 60);
    const b = Math.round(lerp(255, 180, warm));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawSpikes(x, y, length, opacity, warm, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = starRgb(warm, opacity);
    ctx.lineWidth = 0.55;
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i);
      ctx.beginPath();
      ctx.moveTo(0, -length);
      ctx.lineTo(0, length);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStar(x, y, r, opacity, warm, bright, t, seed) {
    const scin = prefersReducedMotion
      ? 1
      : 0.84 + 0.16 * Math.sin(t * 2.6 + seed * 2.1);
    const o = Math.min(1, opacity * scin);
    if (o <= 0.01) return;

    // wide halo
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 8);
    halo.addColorStop(0, starRgb(warm, o * 0.25));
    halo.addColorStop(0.3, starRgb(warm, o * 0.05));
    halo.addColorStop(1, starRgb(warm, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 8, 0, Math.PI * 2);
    ctx.fill();

    // inner glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
    glow.addColorStop(0, starRgb(warm, o * 0.7));
    glow.addColorStop(1, starRgb(warm, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    if (r >= 2.2 || bright) {
      drawSpikes(x, y, r * (bright ? 6 : 4.2), o * (bright ? 0.4 : 0.18), warm, seed * 0.6);
    }

    ctx.beginPath();
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = starRgb(Math.min(1, warm + 0.1), o);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${o})`;
    ctx.fill();
  }

  function drawTinyStar(x, y, r, opacity, warm, t, seed) {
    const scin = prefersReducedMotion
      ? 1
      : 0.72 + 0.28 * Math.sin(t * 1.8 + seed * 1.3);
    const o = opacity * scin;
    if (o <= 0.008) return;

    if (r > 1.1) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
      glow.addColorStop(0, starRgb(warm, o * 0.32));
      glow.addColorStop(1, starRgb(warm, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = starRgb(warm, o);
    ctx.fill();
  }

  // —— Scene ——
  function drawBackground(time) {
    const t = time * 0.001;

    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.42,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.9
    );
    grad.addColorStop(0, "#0b0e22");
    grad.addColorStop(0.5, "#060814");
    grad.addColorStop(1, "#020309");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const fade = focusedId ? 1 - expandT * 0.55 : 1;

    // milky way glow blobs (behind everything)
    for (const blob of milkyBlobs) {
      const p = project(blob.dir);
      if (!p) continue;
      const rad = blob.radius * camera.zoom;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      g.addColorStop(0, `rgba(160, 175, 225, ${blob.opacity * fade})`);
      g.addColorStop(1, "rgba(160, 175, 225, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < milkyStars.length; i++) {
      const s = milkyStars[i];
      const p = project(s.dir);
      if (!p) continue;
      drawTinyStar(p.x, p.y, s.r, s.opacity * fade, s.warm, t * s.speed, i);
    }

    for (let i = 0; i < bgStars.length; i++) {
      const s = bgStars[i];
      const p = project(s.dir);
      if (!p) continue;
      drawTinyStar(p.x, p.y, s.r, s.opacity * fade, s.warm, t * s.speed, i);
    }
  }

  function drawLinesBetween(projected, lines, opacity, widthPx) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(185, 198, 232, ${opacity * 0.26})`;
    ctx.lineWidth = widthPx;
    for (const [a, b] of lines) {
      const p1 = projected[a];
      const p2 = projected[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawConstellation(c, time) {
    const t = time * 0.001;
    const isFocused = focusedId === c.id;
    const isHover = hoverConstellationId === c.id;

    let fade = 1;
    if (focusedId && !isFocused) fade = 1 - expandT * 0.82;
    if (fade <= 0.03) return;

    if (isFocused) {
      // identical silhouette, grown in place; stars become the nodes
      const grow = easeOutCubic(expandT);
      const pts = silhouetteDirs(c, currentSpread()).map((s) => {
        const p = project(s.dir);
        return p ? { ...p, size: s.size, warm: s.warm } : null;
      });
      const nCount = nodeCount(c);

      drawLinesBetween(pts, c.shape.lines, 0.6 + grow * 0.35, 0.8 + grow * 0.5);

      pts.forEach((p, i) => {
        if (!p) return;
        const isNode = i < nCount;
        const isNodeHover =
          isNode &&
          hoverNode &&
          hoverNode.constellationId === c.id &&
          hoverNode.nodeIndex === i;
        const r =
          (isNodeHover ? 4.4 : 2.5 + grow * (isNode ? 1 : 0.2)) * p.size;
        const alpha = isNode ? 0.85 + grow * 0.15 : 0.75 - grow * 0.25;
        drawStar(
          p.x,
          p.y,
          r,
          alpha * (isNodeHover ? 1.05 : 1),
          p.warm,
          isNodeHover,
          t,
          i + c.id.length
        );
      });
      return;
    }

    const shapePts = shapeDirs(c).map((s) => {
      const p = project(s.dir);
      return p ? { ...p, size: s.size, warm: s.warm } : null;
    });

    const dimSecret = c.secret && !isHover ? 0.4 : 1;
    const shapeAlpha = fade * dimSecret;

    const lineOp = (isHover ? 0.95 : 0.6) * shapeAlpha;
    drawLinesBetween(shapePts, c.shape.lines, lineOp, isHover ? 1.15 : 0.8);

    shapePts.forEach((p, i) => {
      if (!p) return;
      const r = (isHover ? 3.3 : 2.5) * p.size;
      drawStar(
        p.x,
        p.y,
        r,
        (0.75 + (isHover ? 0.25 : 0)) * shapeAlpha,
        p.warm,
        isHover,
        t,
        i + c.id.length
      );
    });
  }

  function draw(time) {
    drawBackground(time);
    for (const c of CONSTELLATIONS) {
      drawConstellation(c, time);
    }
  }

  // —— Camera update ——
  function updateCamera() {
    const ease = prefersReducedMotion ? 1 : 0.085;

    if (!dragging) {
      // inertia
      if (!focusedId && !prefersReducedMotion) {
        camera.targetYaw += camera.velYaw;
        camera.targetPitch += camera.velPitch;
        camera.velYaw *= 0.94;
        camera.velPitch *= 0.94;
      }
      camera.yaw = lerpAngle(camera.yaw, camera.targetYaw, ease);
      camera.pitch = lerp(camera.pitch, camera.targetPitch, ease);
    }

    camera.targetPitch = Math.max(-1.45, Math.min(1.45, camera.targetPitch));
    camera.pitch = Math.max(-1.45, Math.min(1.45, camera.pitch));
    camera.zoom = lerp(camera.zoom, camera.targetZoom, ease);

    const target = focusedId ? 1 : 0;
    const speed = prefersReducedMotion ? 1 : 0.06;
    expandT = lerp(expandT, target, speed);
    if (Math.abs(expandT - target) < 0.004) expandT = target;
  }

  // —— Hit testing ——
  function hitTestConstellation(mx, my) {
    let best = null;
    let bestDist = Infinity;
    for (const c of CONSTELLATIONS) {
      for (const s of shapeDirs(c)) {
        const p = project(s.dir);
        if (!p) continue;
        const dist = Math.hypot(mx - p.x, my - p.y);
        const threshold = 30 + (s.size || 1) * 8;
        if (dist < threshold && dist < bestDist) {
          bestDist = dist;
          best = c.id;
        }
      }
    }
    return best;
  }

  function hitTestNode(mx, my) {
    if (!focusedId || expandT < 0.3) return null;
    const c = CONSTELLATIONS.find((item) => item.id === focusedId);
    if (!c) return null;

    const nCount = nodeCount(c);
    let best = null;
    let bestDist = Infinity;
    silhouetteDirs(c, currentSpread()).forEach((s, index) => {
      if (index >= nCount) return;
      const p = project(s.dir);
      if (!p) return;
      const dist = Math.hypot(mx - p.x, my - p.y);
      const threshold = 34 + (s.size || 1) * 10;
      if (dist < threshold && dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });

    return best === null
      ? null
      : { constellationId: focusedId, nodeIndex: best };
  }

  // —— UI: label / preview / hint ——
  function updateLabel() {
    if (focusedId && expandT > 0.4 && hoverNode) {
      const c = CONSTELLATIONS.find((item) => item.id === focusedId);
      if (!c) return;
      const s = silhouetteDirs(c, currentSpread())[hoverNode.nodeIndex];
      const node = c.nodes[hoverNode.nodeIndex];
      const p = s && project(s.dir);
      if (!p || !node) {
        label.hidden = true;
        return;
      }
      label.textContent = node.label;
      label.style.left = `${p.x}px`;
      label.style.top = `${p.y}px`;
      label.hidden = false;
      return;
    }

    if (!focusedId && hoverConstellationId) {
      const c = CONSTELLATIONS.find(
        (item) => item.id === hoverConstellationId
      );
      if (!c) return;
      const aa = anchorToAzAlt(c.anchor);
      const p = project(dirFromAzAlt(aa.az, aa.alt));
      if (!p) {
        label.hidden = true;
        return;
      }
      label.textContent = c.label;
      label.style.left = `${p.x}px`;
      label.style.top = `${p.y}px`;
      label.hidden = false;
      return;
    }

    label.hidden = true;
  }

  function updatePreview() {
    if (!previewEl) return;

    if (!focusedId || !hoverNode || expandT < 0.4) {
      previewEl.hidden = true;
      previewNodeKey = null;
      return;
    }

    const c = CONSTELLATIONS.find((item) => item.id === focusedId);
    const node = c?.nodes[hoverNode.nodeIndex];
    if (!node) {
      previewEl.hidden = true;
      previewNodeKey = null;
      return;
    }

    const key = `${focusedId}:${hoverNode.nodeIndex}`;
    if (key === previewNodeKey && !previewEl.hidden) return;
    previewNodeKey = key;

    const preview = node.preview || {};
    previewYear.textContent = preview.year || "";
    previewTitle.textContent = preview.title || node.label;
    previewRole.textContent = preview.role || c.label;
    previewDesc.textContent = preview.description || "";
    previewDesc.hidden = !preview.description;
    previewLink.href = node.href || "/";

    if (preview.image) {
      previewImage.src = preview.image;
      previewImage.alt = preview.title || node.label;
      previewPhoto.hidden = false;
      previewPhoto.classList.toggle("is-contain", !!preview.imageContain);
    } else {
      previewPhoto.hidden = true;
    }

    previewEl.hidden = false;
  }

  function updateHint() {
    if (focusedId) {
      hint.textContent = "hover a star for a preview · esc to back out";
    } else {
      hint.textContent = "drag to look around · click a constellation";
    }
  }

  // —— Focus / unfocus ——
  function focusConstellation(id) {
    const c = CONSTELLATIONS.find((item) => item.id === id);
    if (!c) return;

    focusedId = id;
    const aa = anchorToAzAlt(c.anchor);
    camera.targetYaw = aa.az;
    camera.targetPitch = aa.alt;
    camera.targetZoom = FOCAL_FOCUSED;
    camera.velYaw = 0;
    camera.velPitch = 0;
    hoverConstellationId = null;
    hoverNode = null;
    backBtn.hidden = false;
    updateHint();
  }

  function unfocus() {
    focusedId = null;
    camera.targetZoom = FOCAL_DEFAULT;
    hoverNode = null;
    backBtn.hidden = true;
    if (previewEl) previewEl.hidden = true;
    previewNodeKey = null;
    updateHint();
  }

  // —— Pointer interaction ——
  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    dragMoved = false;
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
    camera.velYaw = 0;
    camera.velPitch = 0;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    if (dragging) {
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;

      const f = focalBase * camera.zoom;
      const dYaw = -dx / f;
      const dPitch = dy / f;

      camera.yaw += dYaw;
      camera.pitch = Math.max(-1.45, Math.min(1.45, camera.pitch + dPitch));
      camera.targetYaw = camera.yaw;
      camera.targetPitch = camera.pitch;
      camera.velYaw = dYaw;
      camera.velPitch = dPitch;

      lastPointer.x = event.clientX;
      lastPointer.y = event.clientY;
      canvas.style.cursor = "grabbing";
      updateLabel();
      return;
    }

    if (focusedId) {
      hoverNode = hitTestNode(mx, my);
      hoverConstellationId = null;
      canvas.style.cursor = hoverNode ? "pointer" : "grab";
    } else {
      hoverConstellationId = hitTestConstellation(mx, my);
      hoverNode = null;
      canvas.style.cursor = hoverConstellationId ? "pointer" : "grab";
    }

    updateLabel();
    updatePreview();
  }

  function onPointerUp(event) {
    const wasDrag = dragMoved;
    dragging = false;
    dragMoved = false;
    canvas.style.cursor = "grab";
    canvas.releasePointerCapture?.(event.pointerId);

    if (wasDrag) return;

    // treat as click
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    if (focusedId) {
      const nodeHit = hitTestNode(mx, my);
      if (nodeHit) {
        const c = CONSTELLATIONS.find((item) => item.id === focusedId);
        const node = c?.nodes[nodeHit.nodeIndex];
        const key = `${focusedId}:${nodeHit.nodeIndex}`;

        // touch: first tap shows preview, second tap follows the link
        if (previewNodeKey !== key || previewEl.hidden) {
          hoverNode = nodeHit;
          updateLabel();
          updatePreview();
          return;
        }

        if (node?.href) window.location.href = node.href;
        return;
      }

      if (expandT > 0.85) unfocus();
      return;
    }

    const hit = hitTestConstellation(mx, my);
    if (hit) focusConstellation(hit);
  }

  function onWheel(event) {
    event.preventDefault();
    const delta = -event.deltaY * 0.0012;
    camera.targetZoom = Math.max(
      FOCAL_MIN,
      Math.min(FOCAL_MAX, camera.targetZoom * (1 + delta))
    );
  }

  // —— Main loop ——
  function loop(time) {
    updateCamera();
    draw(time);
    updateLabel();
    updatePreview();
    if (!prefersReducedMotion) {
      requestAnimationFrame(loop);
    }
  }

  backBtn.addEventListener("click", unfocus);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && focusedId) unfocus();
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  window.addEventListener("resize", () => {
    resize();
    draw(performance.now());
  });

  resize();
  initSky();
  updateHint();

  if (prefersReducedMotion) {
    updateCamera();
    draw(0);
  } else {
    requestAnimationFrame(loop);
  }
})();
