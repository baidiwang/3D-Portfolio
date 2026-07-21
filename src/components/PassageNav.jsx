import { useRef, useState, useLayoutEffect, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PATH_D } from "../constants/categories";

// ── Constants ────────────────────────────────────────────────────────────────
const N            = 600;
const CREAM        = "#f2efe9";
const BG           = "#050505";
const ACCENT       = "#FF6B35";
const APPROACH_DIST = 0.12; // card starts appearing (dim)
const ARRIVE_DIST   = 0.04; // card fully lit + accent state
const TRAIL_LEN    = 8;
const CAM_W_SVG    = 480;   // camera viewport width in SVG units (3× zoom at 1440px)

// Parallax factors per layer (0 = deepest/slowest, 1 = normal/locked to world)
const PARALLAX = [0.18, 0.46, 0.74, 1.08];

// ── Star field: 4 parallax layers over a large area ─────────────────────────
const STAR_LAYERS = (() => {
  let s = 42;
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  // Cover area: x −900→2340, y −600→1500 (extends well beyond 1440×900 path space)
  const rx = () => r() * 3240 - 900;
  const ry = () => r() * 2100 - 600;
  return [
    Array.from({ length: 230 }, () => ({ x: rx(), y: ry(), r: 0.3 + r() * 0.4,  op: 0.05 + r() * 0.12, tw: false })),
    Array.from({ length: 90  }, () => ({ x: rx(), y: ry(), r: 0.6 + r() * 0.8,  op: 0.14 + r() * 0.22, tw: false })),
    Array.from({ length: 28  }, () => ({ x: rx(), y: ry(), r: 1.0 + r() * 1.5,  op: 0.40 + r() * 0.38, tw: true  })),
    Array.from({ length: 7   }, () => ({ x: rx(), y: ry(), r: 1.8 + r() * 1.2,  op: 0.65 + r() * 0.28, tw: true  })),
  ];
})();

// ── Geometry helpers ─────────────────────────────────────────────────────────
function samplePath(pathEl) {
  const total = pathEl.getTotalLength();
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = pathEl.getPointAtLength(t * total);
    pts.push({ x: p.x, y: p.y, frac: t, a: 0 });
  }
  for (let i = 0; i < N; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(N - 1, i + 1)];
    pts[i].a = (Math.atan2(next.y - prev.y, next.x - prev.x) * 180) / Math.PI;
  }
  return pts;
}

function computeStopsXY(pts, stops) {
  return stops.map((stop) => {
    const idx = Math.round(stop.frac * (N - 1));
    const p   = pts[Math.max(0, Math.min(N - 1, idx))];
    // labelOnRight: stop is left of x=1000 → label goes to the right
    return { x: p.x, y: p.y, labelOnRight: p.x < 1000 };
  });
}

function domPlaceShip(ship, pts, frac) {
  if (!ship || !pts.length) return;
  const idx = Math.round(Math.max(0, Math.min(1, frac)) * (N - 1));
  const p   = pts[idx];
  // UFO: position only — no tangent rotation (saucer is radially symmetric)
  ship.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
}

function driftEase(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PassageNav({ category }) {
  const svgRef        = useRef(null);
  const pathRef       = useRef(null);
  const shipRef       = useRef(null);
  const trailRef      = useRef(null);
  const nebulaRef     = useRef(null);
  const starGroupRefs = useRef([null, null, null, null]);
  const ringOuterRefs = useRef([]);
  const ringInnerRefs = useRef([]);
  const dotRefs       = useRef([]);
  const labelRefs     = useRef([]);
  const cardRef       = useRef(null);

  const samplesRef    = useRef([]);
  const stopsXYRef    = useRef([]);
  const curFracRef    = useRef(0);
  const selectedRef   = useRef(null);
  const prevFracRef   = useRef(0);
  const rafPending      = useRef(false);
  const introPlayingRef = useRef(false);
  const introRafRef     = useRef(null);
  const saucerBankRef   = useRef(null);   // inner SVG <g> for banking tilt
  const saucerWobbleRef = useRef(null);   // innermost <g> for idle hover wobble
  const bankRef         = useRef(0);      // current bank angle (degrees)
  const prevAngleRef    = useRef(0);      // previous path tangent angle for dAngle calc
  const hintRef         = useRef(null);   // bottom-center scroll hint
  const trailPosRef   = useRef([]);
  const camRef        = useRef({ w: CAM_W_SVG, h: 300 }); // h updated on mount
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [selected,    setSelected]    = useState(null);
  const [stopsXY,     setStopsXY]     = useState([]);
  const [hoveredStop, setHoveredStop] = useState(null);
  const [listOpen,    setListOpen]    = useState(false);

  // ── Imperative helpers (called from RAF, no React deps) ───────────────────

  const applyCamera = useCallback((shipX, shipY) => {
    const { w, h } = camRef.current;
    const vx = shipX - w / 2;
    const vy = shipY - h / 2;

    if (svgRef.current) {
      svgRef.current.setAttribute("viewBox", `${vx.toFixed(1)} ${vy.toFixed(1)} ${w} ${h}`);
    }

    // Parallax: translate each star group by (1 − factor) × camera center
    starGroupRefs.current.forEach((g, li) => {
      if (!g) return;
      const f = PARALLAX[li];
      g.setAttribute(
        "transform",
        `translate(${((1 - f) * shipX).toFixed(2)} ${((1 - f) * shipY).toFixed(2)})`
      );
    });

    // Nebula — very slow parallax (feels vast and far)
    if (nebulaRef.current) {
      nebulaRef.current.setAttribute(
        "transform",
        `translate(${(0.88 * shipX).toFixed(2)} ${(0.88 * shipY).toFixed(2)})`
      );
    }

    // HTML label screen positions
    const scale = window.innerWidth / w;
    // Keep labels outside the outer marker ring (r=20 SVG units) plus a small gap
    const ringEdgePx = 20 * scale + 14;
    stopsXYRef.current.forEach((xy, i) => {
      const lbl = labelRefs.current[i];
      if (!lbl) return;
      const sx = (xy.x - vx) * scale;
      const sy = (xy.y - vy) * scale;
      const dir      = xy.labelOnRight ? 1 : -1;
      const offsetPx = ringEdgePx * dir;
      const flipStr  = xy.labelOnRight ? "" : " translateX(-100%)";
      lbl.style.transform = `translate(${(sx + offsetPx).toFixed(1)}px, ${(sy - 18).toFixed(1)}px)${flipStr}`;
    });
  }, []);

  const applyLabelVisibility = useCallback((frac) => {
    category.stops.forEach((stop, i) => {
      const lbl = labelRefs.current[i];
      if (!lbl) return;
      const dist = Math.abs(stop.frac - frac);
      const opacity = dist < 0.30 ? Math.min(1, (0.30 - dist) / 0.14) : 0;
      lbl.style.opacity = opacity.toFixed(2);
      lbl.style.textAlign = stopsXYRef.current[i]?.labelOnRight ? "left" : "right";
    });
  }, [category]);

  const applyMarkerWakeup = useCallback((frac) => {
    category.stops.forEach((stop, i) => {
      const dist    = Math.abs(stop.frac - frac);
      const wakeup  = Math.max(0, 1 - dist / 0.18);
      const arrived = dist < ARRIVE_DIST;
      const ringCol = arrived ? ACCENT : CREAM;

      if (ringOuterRefs.current[i]) {
        const el = ringOuterRefs.current[i];
        el.style.animationDuration = `${(6 - 4 * wakeup).toFixed(1)}s`;
        el.style.opacity           = (0.48 + 0.40 * wakeup).toFixed(2);
        el.setAttribute("stroke", ringCol);
      }
      if (ringInnerRefs.current[i]) {
        const el = ringInnerRefs.current[i];
        el.style.animationDuration = `${(4 - 2.3 * wakeup).toFixed(1)}s`;
        el.style.opacity           = (0.38 + 0.37 * wakeup).toFixed(2);
        el.setAttribute("stroke", ringCol);
      }
      if (dotRefs.current[i]) {
        const el = dotRefs.current[i];
        el.style.opacity = (0.52 + 0.43 * wakeup).toFixed(2);
        el.setAttribute("fill", arrived ? ACCENT : CREAM);
      }
    });
  }, [category]);

  const applyTrail = useCallback((p, speed) => {
    const tg = trailRef.current;
    if (!tg) return;
    const buf = trailPosRef.current;
    buf.unshift({ x: p.x, y: p.y });
    if (buf.length > TRAIL_LEN) buf.pop();
    const speedFactor = Math.min(1, speed * 60);
    const circles = tg.children;
    for (let i = 0; i < TRAIL_LEN; i++) {
      const c   = circles[i];
      const pos = buf[i];
      if (!c) continue;
      if (!pos) { c.setAttribute("opacity", "0"); continue; }
      c.setAttribute("cx", pos.x.toFixed(2));
      c.setAttribute("cy", pos.y.toFixed(2));
      const op = speedFactor * ((TRAIL_LEN - i) / TRAIL_LEN) * 0.75;
      c.setAttribute("opacity", op.toFixed(3));
    }
  }, []);

  const applyCard = useCallback((frac) => {
    const card = cardRef.current;
    if (!card) return;
    if (selectedRef.current === null) {
      card.style.opacity      = "0";
      card.style.pointerEvents = "none";
      return;
    }
    const dist    = Math.abs(category.stops[selectedRef.current].frac - frac);
    const t       = Math.max(0, 1 - dist / APPROACH_DIST);
    const arrived = dist < ARRIVE_DIST;

    card.style.opacity       = t < 0.01 ? "0" : (0.12 + 0.88 * t).toFixed(2);
    card.style.filter        = arrived ? "brightness(1) saturate(1)" :
      `brightness(${(0.3 + 0.7 * t).toFixed(2)}) saturate(0.7)`;
    card.style.boxShadow     = arrived
      ? `0 0 0 1px rgba(255,107,53,0.45), 0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(255,107,53,0.14)`
      : "0 20px 60px rgba(0,0,0,0.55)";
    card.style.pointerEvents = arrived ? "auto" : "none";

    // Horizontal position: card on right when stop is center/right of path
    const xy = stopsXYRef.current[selectedRef.current];
    if (xy) {
      const onRight = xy.x >= 720;
      card.style.right = onRight ? "40px" : "auto";
      card.style.left  = onRight ? "auto" : "40px";
    }
  }, [category]);

  // ── scrollToStop ──────────────────────────────────────────────────────────
  // Banking tilt + idle wobble — called every RAF frame
  const applyShipDynamics = useCallback((p, speed) => {
    // Compute angular velocity for banking
    let dAngle = p.a - prevAngleRef.current;
    if (dAngle > 180)  dAngle -= 360;
    if (dAngle < -180) dAngle += 360;
    prevAngleRef.current = p.a;
    const targetBank   = Math.max(-15, Math.min(15, dAngle * 2.4));
    bankRef.current    = bankRef.current * 0.84 + targetBank * 0.16;
    if (saucerBankRef.current) {
      saucerBankRef.current.setAttribute("transform", `rotate(${bankRef.current.toFixed(2)})`);
    }
    // Wobble: resume when parked, pause when moving
    if (saucerWobbleRef.current) {
      saucerWobbleRef.current.style.animationPlayState = speed > 0.0005 ? "paused" : "running";
    }
  }, []);

  const scrollToStop = useCallback((stopIdx) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    window.scrollTo({
      top: category.stops[stopIdx].frac * maxScroll,
      behavior: reducedMotion.current ? "auto" : "smooth",
    });
  }, [category]);

  // ── Path sampling + camera init (before first paint) ─────────────────────
  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    // Cancel any in-progress intro from the previous category
    if (introRafRef.current) {
      cancelAnimationFrame(introRafRef.current);
      introRafRef.current = null;
    }
    introPlayingRef.current = false;

    const pts = samplePath(pathEl);
    samplesRef.current = pts;

    const camH = Math.round(CAM_W_SVG * window.innerHeight / window.innerWidth);
    camRef.current = { w: CAM_W_SVG, h: camH };

    const xy = computeStopsXY(pts, category.stops);
    stopsXYRef.current = xy;
    setStopsXY(xy);

    setSelected(null);
    selectedRef.current  = null;
    trailPosRef.current  = [];
    bankRef.current      = 0;

    const firstFrac = category.stops[0].frac;

    const syncScroll = (frac) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        window.scrollTo(0, Math.round(frac * maxScroll));
      } else {
        requestAnimationFrame(() => {
          const max2 = document.documentElement.scrollHeight - window.innerHeight;
          if (max2 > 0) window.scrollTo(0, Math.round(frac * max2));
        });
      }
    };

    if (reducedMotion.current) {
      // Skip animation — jump straight to first stop
      curFracRef.current  = firstFrac;
      prevFracRef.current = firstFrac;
      const p = pts[Math.round(firstFrac * (N - 1))];
      prevAngleRef.current = p.a;
      domPlaceShip(shipRef.current, pts, firstFrac);
      applyCamera(p.x, p.y);
      applyMarkerWakeup(firstFrac);
      applyLabelVisibility(firstFrac);
      applyShipDynamics(p, 0);
      syncScroll(firstFrac);
      return;
    }

    // Intro drift: ship travels from path start → first stop over 2 s
    curFracRef.current   = 0;
    prevFracRef.current  = 0;
    prevAngleRef.current = pts[0].a;
    const p0 = pts[0];
    domPlaceShip(shipRef.current, pts, 0);
    applyCamera(p0.x, p0.y);
    applyMarkerWakeup(0);
    applyLabelVisibility(0);

    introPlayingRef.current = true;
    const INTRO_MS  = 2000;
    const startTime = performance.now();

    const frame = (now) => {
      if (!introPlayingRef.current) return;
      const t     = Math.min(1, (now - startTime) / INTRO_MS);
      const frac  = driftEase(t) * firstFrac;
      const spd   = Math.abs(frac - prevFracRef.current);
      prevFracRef.current = frac;
      curFracRef.current  = frac;

      const p = pts[Math.round(frac * (N - 1))];
      domPlaceShip(shipRef.current, pts, frac);
      applyTrail(p, spd);
      applyCamera(p.x, p.y);
      applyMarkerWakeup(frac);
      applyLabelVisibility(frac);
      applyShipDynamics(p, spd);

      if (t < 1) {
        introRafRef.current = requestAnimationFrame(frame);
      } else {
        introPlayingRef.current = false;
        introRafRef.current     = null;
        curFracRef.current      = firstFrac;
        prevFracRef.current     = firstFrac;
        // Reveal stop 1's card automatically — same logic as normal scroll arrival
        selectedRef.current = 0;
        setSelected(0);
        applyCard(firstFrac);
        syncScroll(firstFrac);
      }
    };
    introRafRef.current = requestAnimationFrame(frame);

    return () => {
      if (introRafRef.current) {
        cancelAnimationFrame(introRafRef.current);
        introRafRef.current = null;
      }
      introPlayingRef.current = false;
    };
  }, [category, applyCamera, applyTrail, applyMarkerWakeup, applyLabelVisibility, applyShipDynamics, applyCard]);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (introPlayingRef.current) return;
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;

        const frac  = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        const speed = Math.abs(frac - prevFracRef.current);
        prevFracRef.current = frac;
        curFracRef.current  = frac;

        const pts = samplesRef.current;
        if (!pts.length) return;
        const p = pts[Math.round(frac * (N - 1))];

        domPlaceShip(shipRef.current, pts, frac);
        applyTrail(p, speed);
        applyCamera(p.x, p.y);
        applyLabelVisibility(frac);
        applyMarkerWakeup(frac);
        applyCard(frac);
        applyShipDynamics(p, speed);
        // Fade hint out once user scrolls past stop 1
        if (hintRef.current) {
          hintRef.current.style.opacity = frac > category.stops[0].frac + 0.05 ? "0" : "1";
        }

        // Proximity: select nearest stop within APPROACH_DIST
        let nearIdx = -1;
        let minDist = Infinity;
        category.stops.forEach((stop, i) => {
          const d = Math.abs(stop.frac - frac);
          if (d < APPROACH_DIST && d < minDist) { minDist = d; nearIdx = i; }
        });
        const newSel = nearIdx === -1 ? null : nearIdx;
        if (newSel !== selectedRef.current) {
          selectedRef.current = newSel;
          setSelected(newSel);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [category, applyCamera, applyTrail, applyLabelVisibility, applyMarkerWakeup, applyCard, applyShipDynamics]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const n = category.stops.length;
    const onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollToStop(Math.min(n - 1, (selectedRef.current ?? -1) + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToStop(Math.max(0, (selectedRef.current ?? n) - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [category, scrollToStop]);

  const selStop = selected !== null ? category.stops[selected] : null;
  const rm = reducedMotion.current;
  const scrollHeightVh = category.stops.length * 80 + 100;

  return (
    <div style={{ ...sceneStyle, height: `${scrollHeightVh}vh` }}>

      {/* ── Fixed SVG: cosmos, path, markers, ship, trail ── */}
      <svg
        ref={svgRef}
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid meet"
        style={svgStyle}
        aria-hidden="true"
      >
        <defs>
          {/* Ship + engine glow */}
          <filter id="scGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.5" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Accent engine bloom */}
          <filter id="engineGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Orbital path — wide bloom + tight halo + bare line */}
          <filter id="pathGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="9" result="bloom" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="halo" />
            <feMerge>
              <feMergeNode in="bloom" /><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Marker glow */}
          <filter id="markerGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="gw" />
            <feMerge><feMergeNode in="gw" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Trail glow */}
          <filter id="trailGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          {/* Saucer under-beam: pure soft blur */}
          <filter id="saucerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          {/* Rim accent lights: tight halo keeps them crisp */}
          <filter id="rimGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Beam cone: fade from opaque at nozzle tip to transparent at bottom */}
          <linearGradient id="beamFade" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor={ACCENT} stopOpacity="0.30" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0"    />
          </linearGradient>
          {/* Nebula blobs */}
          <radialGradient id="neb1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3a4a8a" stopOpacity="0.18" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="neb2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#6a3060" stopOpacity="0.14" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="neb3" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a4040" stopOpacity="0.13" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* Nebula blobs — subtle parallax via nebulaRef */}
        <g ref={nebulaRef}>
          <ellipse cx="280"  cy="380" rx="340" ry="220" fill="url(#neb1)" />
          <ellipse cx="1180" cy="560" rx="260" ry="190" fill="url(#neb2)" />
          <ellipse cx="900"  cy="200" rx="200" ry="150" fill="url(#neb3)" />
        </g>

        {/* 4 parallax star layers */}
        {STAR_LAYERS.map((layer, li) => (
          <g key={li} ref={(el) => (starGroupRefs.current[li] = el)}>
            {layer.map((s, si) => (
              <circle
                key={si}
                cx={s.x} cy={s.y} r={s.r}
                fill={CREAM} opacity={s.op}
                style={
                  s.tw
                    ? {
                        animation: `scBreathe ${1.8 + (si % 4) * 0.65}s ease-in-out ${
                          (si * 0.47) % 3.5
                        }s infinite`,
                        animationPlayState: rm ? "paused" : "running",
                      }
                    : undefined
                }
              />
            ))}
          </g>
        ))}

        {/* Orbital trajectory */}
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke="rgba(195,220,255,0.68)"
          strokeWidth="1.1"
          strokeLinecap="round"
          filter="url(#pathGlow)"
        />

        {/* Stop markers — rings and dots only; text lives in HTML overlay */}
        {category.stops.map((stop, i) => {
          const xy      = stopsXY[i];
          if (!xy) return null;
          const hovered = hoveredStop === i;

          return (
            <g
              key={stop.id}
              role="button"
              tabIndex={0}
              aria-label={`Stop ${i + 1}: ${stop.title}`}
              aria-pressed={selected === i}
              transform={`translate(${xy.x} ${xy.y})`}
              style={{ cursor: "pointer", outline: "none" }}
              onClick={() => scrollToStop(i)}
              onMouseEnter={() => setHoveredStop(i)}
              onMouseLeave={() => setHoveredStop(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  scrollToStop(i);
                }
              }}
            >
              {/* Hit target */}
              <circle cx="0" cy="0" r="30" fill="white" opacity="0" />
              {/* Keyboard focus ring */}
              <circle
                className="marker-kbd-ring"
                cx="0" cy="0" r="26"
                fill="none"
                stroke="rgba(195,220,255,0.75)"
                strokeWidth="1.5"
                strokeDasharray="5 3"
                style={{ opacity: 0, transition: "opacity 0.18s", pointerEvents: "none" }}
              />
              {/* Spinning rings + dot — opacity/speed/color managed imperatively */}
              <g
                filter="url(#markerGlow)"
                style={{
                  transform: hovered ? "scale(1.18)" : "scale(1)",
                  transition: "transform 0.22s ease",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                <circle
                  ref={(el) => (ringOuterRefs.current[i] = el)}
                  cx="0" cy="0" r="20"
                  fill="none"
                  stroke={CREAM}
                  strokeWidth="1.2"
                  strokeDasharray="94 32"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: "svgSpin 6s linear infinite",
                    opacity: 0.48,
                    animationPlayState: rm ? "paused" : "running",
                  }}
                />
                <circle
                  ref={(el) => (ringInnerRefs.current[i] = el)}
                  cx="0" cy="0" r="13"
                  fill="none"
                  stroke={CREAM}
                  strokeWidth="1.0"
                  strokeDasharray="54 28"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: "svgSpinR 4s linear infinite",
                    opacity: 0.38,
                    animationPlayState: rm ? "paused" : "running",
                  }}
                />
                <circle
                  ref={(el) => (dotRefs.current[i] = el)}
                  cx="0" cy="0" r="3.5"
                  fill={CREAM}
                  style={{ opacity: 0.52 }}
                />
              </g>
            </g>
          );
        })}

        {/* Trail — dots behind ship, driven imperatively */}
        <g ref={trailRef} filter="url(#trailGlow)" style={{ pointerEvents: "none" }}>
          {Array.from({ length: TRAIL_LEN }, (_, i) => (
            <circle key={i} r={3.8 - i * 0.35} fill={ACCENT} opacity={0} />
          ))}
        </g>

        {/* UFO / Flying saucer */}
        <g ref={shipRef} style={{ pointerEvents: "none" }}>
          {/* Bank group: subtle lean into path curves */}
          <g ref={saucerBankRef}>
            {/* Wobble group: gentle idle hover when parked (CSS-animated) */}
            <g
              ref={saucerWobbleRef}
              style={{ animation: "saucerHover 2.4s ease-in-out infinite", animationPlayState: "paused" }}
            >
              {/* ── Beam: translucent cone widening from nozzle tip ── */}
              <polygon points="-2.2,5.2 2.2,5.2 9.5,20 -9.5,20"
                fill="url(#beamFade)" />
              <line x1="-2.2" y1="5.2" x2="-9.5" y2="20"
                stroke={ACCENT} strokeWidth="0.28" strokeOpacity="0.36" />
              <line x1="2.2" y1="5.2" x2="9.5" y2="20"
                stroke={ACCENT} strokeWidth="0.28" strokeOpacity="0.36" />

              {/* ── Nozzle: tapered underside protrusion where beam emits ── */}
              <polygon points="-3.5,2.2 3.5,2.2 2.2,5.2 -2.2,5.2"
                fill={BG} stroke={CREAM} strokeWidth="0.55" strokeLinejoin="round" />

              {/* ── Lower rim BG: occludes stars inside lower hull ── */}
              <ellipse cx="0" cy="2.4" rx="13.5" ry="2.0"
                fill={BG} stroke="none" />

              {/* ── Upper disc: main hull top surface ── */}
              <ellipse cx="0" cy="0" rx="17" ry="3.2"
                fill={BG} stroke={CREAM} strokeWidth="0.72" />

              {/* ── Equatorial seam: structural panel line ── */}
              <line x1="-15" y1="1.2" x2="15" y2="1.2"
                stroke={CREAM} strokeWidth="0.22" strokeOpacity="0.28" />

              {/* ── Lower rim: visible front arc — reads as disc thickness ── */}
              <path d="M -13.5 2.4 A 13.5 2.0 0 0 0 13.5 2.4"
                fill="none" stroke={CREAM} strokeWidth="0.68" />

              {/* ── Side walls: upper disc edge → lower rim edge ── */}
              <line x1="-17" y1="0" x2="-13.5" y2="2.4"
                stroke={CREAM} strokeWidth="0.68" />
              <line x1="17" y1="0" x2="13.5" y2="2.4"
                stroke={CREAM} strokeWidth="0.68" />

              {/* ── Dome base ring: junction between dome and hull ── */}
              <ellipse cx="0" cy="0" rx="6.5" ry="1.3"
                fill={BG} stroke={CREAM} strokeWidth="0.55" />

              {/* ── Dome: raised half-dome arc, clearly above hull ── */}
              <path d="M -6.5 0 A 6.5 5.5 0 0 1 6.5 0"
                fill="none" stroke={CREAM} strokeWidth="0.65" />

              {/* ── Rim lights: orange accents on lower rim arc ── */}
              <circle cx="-9"  cy="3.9" r="0.65" fill={ACCENT} opacity="0.92" filter="url(#rimGlow)" />
              <circle cx="0"   cy="4.4" r="0.65" fill={ACCENT} opacity="0.92" filter="url(#rimGlow)" />
              <circle cx="9"   cy="3.9" r="0.65" fill={ACCENT} opacity="0.92" filter="url(#rimGlow)" />
            </g>
          </g>
        </g>
      </svg>

      {/* Screen-space vignette (not in SVG so it doesn't move with camera) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: `radial-gradient(ellipse 90% 80% at center, transparent 38%, ${BG} 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Fixed HTML overlay ── */}
      <div style={uiLayerStyle}>

        {/* Masthead */}
        <div style={mastheadStyle}>
          <Link to="/" style={backLinkStyle}>Baidi Wang</Link>
          <div style={categoryLabelStyle}>{category.label}</div>
          <div style={introStyle}>{category.intro}</div>
        </div>

        {/* Scroll hint: bottom-center, accent orange, fades after stop 1 */}
        <div
          ref={hintRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            pointerEvents: "none",
            zIndex: 10,
            transition: "opacity 0.7s ease",
          }}
        >
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: ACCENT,
            animation: rm ? "none" : "hintFloat 3s ease-in-out infinite",
          }}>
            Scroll to explore
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "18px",
            color: ACCENT,
            lineHeight: 1,
            animation: rm ? "none" : "arrowBounce 1.4s ease-in-out infinite",
          }}>
            ↓
          </span>
        </div>

        {/* Per-stop HTML labels (positioned imperatively by applyCamera) */}
        {category.stops.map((stop, i) => (
          <div
            key={stop.id}
            ref={(el) => (labelRefs.current[i] = el)}
            onClick={() => scrollToStop(i)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              cursor: "pointer",
              pointerEvents: "auto",
              userSelect: "none",
              textAlign: stopsXY[i]?.labelOnRight ? "left" : "right",
            }}
          >
            <div style={labelNumStyle}>{String(i + 1).padStart(2, "0")}</div>
            <div style={labelNameStyle}>{stop.title}</div>
          </div>
        ))}

        {/* Floating project card — proximity-triggered, opacity/glow managed imperatively */}
        <div
          ref={cardRef}
          role={selStop ? "dialog" : undefined}
          aria-modal={selStop ? "true" : undefined}
          aria-label={selStop ? `Project: ${selStop.title}` : undefined}
          style={{
            ...floatingCardStyle,
            opacity: 0,
            right: "40px",  // initial position; updated imperatively by applyCard
          }}
        >
          {selStop && (
            <>
              {selStop.thumbnail ? (
                <img src={selStop.thumbnail} alt={selStop.title} style={thumbImgStyle} />
              ) : (
                <div style={thumbPlaceholderStyle} aria-hidden="true">
                  <span style={thumbLabelStyle}>Thumbnail</span>
                </div>
              )}

              <div style={stopNumStyle}>Stop {String(selected + 1).padStart(2, "0")}</div>
              <div style={dividerStyle} />
              <div style={titleStyle}>{selStop.title}</div>
              <div style={catStyle}>{selStop.category}</div>
              <div style={descStyle}>{selStop.oneLineDescription}</div>

              <div style={tagsRowStyle}>
                {selStop.tags.map((tag) => (
                  <span key={tag} style={tagStyle}>{tag}</span>
                ))}
              </div>

              <div style={linksRowStyle}>
                {selStop.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target={link.url.startsWith("http") ? "_blank" : undefined}
                    rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    style={linkStyle}
                  >
                    {link.label} <span aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Direct-access list (collapsed by default, expands on hover/focus) */}
        <nav
          aria-label={`${category.label} projects`}
          style={listNavStyle}
          onMouseEnter={() => setListOpen(true)}
          onMouseLeave={() => setListOpen(false)}
          onFocus={() => setListOpen(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setListOpen(false);
          }}
          onKeyDown={(e) => { if (e.key === "Escape") setListOpen(false); }}
        >
          {listOpen ? (
            <>
              <div style={listHeadingStyle}>The Passage</div>
              {category.stops.map((stop, i) => {
                const active = selected === i;
                return (
                  <button
                    key={stop.id}
                    onClick={() => scrollToStop(i)}
                    style={listBtnStyle}
                    aria-current={active ? "true" : undefined}
                  >
                    <span style={{ ...listNumStyle, color: active ? CREAM : "rgba(242,239,233,0.50)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ ...listNameStyle, color: active ? CREAM : "rgba(242,239,233,0.88)", borderBottomColor: active ? ACCENT : "transparent" }}>
                      {stop.title}
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            <button
              style={listCompactBtnStyle}
              onClick={() => setListOpen(true)}
              aria-expanded={false}
              aria-label={`${category.label} projects: stop ${(selected ?? 0) + 1} of ${category.stops.length}. Expand list`}
            >
              <span style={listProgressStyle}>
                <span style={{ color: CREAM }}>{String((selected ?? 0) + 1).padStart(2, "0")}</span>
                <span style={{ opacity: 0.32, margin: "0 5px" }}>/</span>
                <span style={{ opacity: 0.52 }}>{String(category.stops.length).padStart(2, "0")}</span>
              </span>
              <div style={{ display: "flex", gap: "6px", marginTop: "9px" }}>
                {category.stops.map((_, i) => {
                  const isActive = i === selected;
                  const isReached = selected !== null && i < selected;
                  return (
                    <span
                      key={i}
                      style={{
                        display: "block",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: isActive ? ACCENT : isReached ? "rgba(242,239,233,0.45)" : "transparent",
                        border: isActive || isReached ? "none" : "1px solid rgba(242,239,233,0.32)",
                        transition: "background-color 0.35s, border-color 0.35s",
                      }}
                    />
                  );
                })}
              </div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}

// ── Style objects ─────────────────────────────────────────────────────────────

const sceneStyle = {
  position: "relative",
  width: "100%",
  background: BG,
  fontFamily: "var(--font-display)",
  color: CREAM,
};

const svgStyle = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  zIndex: 1,
};

const uiLayerStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10,
  pointerEvents: "none",
};

const mastheadStyle = {
  position: "absolute",
  top: "42px",
  left: "48px",
  maxWidth: "300px",
  pointerEvents: "auto",
};

const backLinkStyle = {
  display: "block",
  fontFamily: "var(--font-accent)",
  fontSize: "40px",
  fontWeight: "400",
  letterSpacing: "0.04em",
  lineHeight: 1,
  color: CREAM,
  textDecoration: "none",
};

const categoryLabelStyle = {
  marginTop: "12px",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.65)",
};

const introStyle = {
  marginTop: "14px",
  fontSize: "13px",
  lineHeight: "1.6",
  fontWeight: "300",
  color: "rgba(242,239,233,0.68)",
};


// Canvas labels (positioned imperatively)
const labelNumStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.14em",
  color: "rgba(242,239,233,0.55)",
  marginBottom: "4px",
};

const labelNameStyle = {
  fontSize: "18px",
  fontWeight: "300",
  color: CREAM,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

const listNavStyle = {
  position: "absolute",
  bottom: "44px",
  left: "48px",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  pointerEvents: "auto",
};

const listCompactBtnStyle = {
  background: "none",
  border: "none",
  padding: "0",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "var(--font-mono)",
  color: CREAM,
};

const listProgressStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  letterSpacing: "0.14em",
  color: "rgba(242,239,233,0.78)",
};

const listHeadingStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.55)",
  marginBottom: "12px",
};

const listBtnStyle = {
  background: "none",
  border: "none",
  padding: "5px 0",
  display: "flex",
  alignItems: "baseline",
  gap: "12px",
  textAlign: "left",
  fontFamily: "var(--font-display)",
  cursor: "pointer",
};

const listNumStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.12em",
  minWidth: "18px",
  transition: "color 0.3s",
};

const listNameStyle = {
  fontSize: "17px",
  fontWeight: "400",
  transition: "color 0.3s, border-bottom-color 0.3s",
  borderBottom: "1px solid transparent",
  paddingBottom: "1px",
};

// Floating project card
const floatingCardStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "clamp(300px, 30vw, 390px)",
  maxHeight: "80vh",
  zIndex: 20,
  background: "rgba(5,5,5,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(242,239,233,0.10)",
  borderRadius: "4px",
  display: "flex",
  flexDirection: "column",
  padding: "32px 36px",
  overflowY: "auto",
  transition: "box-shadow 0.6s, filter 0.6s",
  pointerEvents: "none",
};

const thumbImgStyle = {
  width: "100%",
  aspectRatio: "16/9",
  objectFit: "cover",
  marginBottom: "24px",
  opacity: 0.85,
  borderRadius: "2px",
};

const thumbPlaceholderStyle = {
  width: "100%",
  aspectRatio: "16/9",
  background: "rgba(242,239,233,0.04)",
  border: "1px solid rgba(242,239,233,0.08)",
  marginBottom: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "2px",
};

const thumbLabelStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.18)",
};

const stopNumStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.45)",
};

const dividerStyle = {
  width: "28px",
  height: "1px",
  background: "rgba(242,239,233,0.35)",
  margin: "16px 0",
};

const titleStyle = {
  fontSize: "34px",
  fontWeight: "300",
  lineHeight: "1.05",
  letterSpacing: "-0.01em",
};

const catStyle = {
  marginTop: "8px",
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.50)",
};

const descStyle = {
  marginTop: "18px",
  fontSize: "13px",
  lineHeight: "1.65",
  fontWeight: "300",
  color: "rgba(242,239,233,0.75)",
};

const tagsRowStyle = {
  marginTop: "16px",
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const tagStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.50)",
  border: "1px solid rgba(242,239,233,0.14)",
  padding: "3px 7px",
  borderRadius: "2px",
};

const linksRowStyle = {
  marginTop: "24px",
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
};

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: CREAM,
  textDecoration: "none",
  borderBottom: `1px solid rgba(242,239,233,0.45)`,
  paddingBottom: "3px",
  transition: "color 0.25s, border-bottom-color 0.25s",
};
