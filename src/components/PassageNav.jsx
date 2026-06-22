import { useRef, useState, useLayoutEffect, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PATH_D } from "../constants/categories";

const N = 600;
const VIEWBOX = "0 0 1440 900";
const CREAM = "#f2efe9";
const BG = "#050505";

// ── Deterministic star field (LCG seed — same stars every render) ──────────
const STARS = (() => {
  let s = 42;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out = [];
  // Layer 0 — deep background: dust-fine, barely visible
  for (let i = 0; i < 180; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 0.3 + r() * 0.5, op: 0.08 + r() * 0.18, tw: false });
  // Layer 1 — midground: medium brightness
  for (let i = 0; i < 60; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 0.7 + r() * 1.0, op: 0.22 + r() * 0.28, tw: false });
  // Layer 2 — foreground: brighter, all twinkle
  for (let i = 0; i < 20; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 1.2 + r() * 1.8, op: 0.55 + r() * 0.38, tw: true });
  // Layer 3 — accent: a handful of very bright standout stars
  for (let i = 0; i < 5; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 2.4 + r() * 1.4, op: 0.75 + r() * 0.22, tw: true });
  return out;
})();

// ── Pure geometry helpers ───────────────────────────────────────────────────

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
    const p = pts[Math.max(0, Math.min(N - 1, idx))];
    const labelRight = p.x < 1080;
    return {
      x: p.x,
      y: p.y,
      labelX: labelRight ? p.x + 36 : p.x - 36,
      anchor: labelRight ? "start" : "end",
      nameY: p.y + 26,
    };
  });
}

// ── Easing / imperative DOM helpers (module-level, no hooks) ──────────────

function spacecraftEase(t) {
  // Cubic ease-in-out: gentle launch, smooth arrival
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function domPlaceShip(ship, pts, frac) {
  if (!ship || !pts.length) return;
  const idx = Math.round(Math.max(0, Math.min(1, frac)) * (N - 1));
  const p   = pts[idx];
  ship.setAttribute("transform",
    `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})`);
}

function domPlaceTrail(trail, pts, frac, dir) {
  if (!trail || !pts.length) return;
  const base = Math.round(Math.max(0, Math.min(1, frac)) * (N - 1));
  const sign = dir >= 0 ? -1 : 1;           // dots trail behind travel direction
  const offs = [5, 11, 20];
  const dots = trail.children;
  for (let i = 0; i < offs.length; i++) {
    const idx = Math.max(0, Math.min(N - 1, base + sign * offs[i]));
    dots[i].setAttribute("cx", pts[idx].x.toFixed(2));
    dots[i].setAttribute("cy", pts[idx].y.toFixed(2));
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PassageNav({ category }) {
  const svgRef   = useRef(null);
  const pathRef  = useRef(null);
  const shipRef  = useRef(null);
  const trailRef = useRef(null);

  const samplesRef     = useRef([]);
  const curFracRef     = useRef(category.stops[0].frac);
  const currentStopRef = useRef(0);      // index of the stop the ship is parked at
  const animatingRef   = useRef(false);  // true while flight animation is running
  const selectedRef    = useRef(null);
  const lastFocusRef   = useRef(null);
  const rafRef         = useRef(null);
  const reducedMotion  = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [selected,    setSelected]    = useState(null);
  const [stopsXY,     setStopsXY]     = useState([]);
  const [hoveredStop, setHoveredStop] = useState(null);

  // Thin wrappers so handlers can call without passing refs explicitly
  const placeShip  = (frac) => domPlaceShip(shipRef.current, samplesRef.current, frac);
  const placeTrail = (frac, dir) => domPlaceTrail(trailRef.current, samplesRef.current, frac, dir);

  // Sample path + park ship at stop 0 before first paint
  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;
    const pts = samplePath(pathEl);
    samplesRef.current     = pts;
    setStopsXY(computeStopsXY(pts, category.stops));
    curFracRef.current     = category.stops[0].frac;
    currentStopRef.current = 0;
    placeShip(curFracRef.current);
  }, [category]);

  // Cancel any in-flight animation when category switches
  useEffect(() => {
    setSelected(null);
    selectedRef.current = null;
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [category]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    lastFocusRef.current?.focus();
    selectedRef.current = null;
    setSelected(null);
  }, []);

  const animateToStop = useCallback((stopIdx) => {
    // Cancel any in-progress flight cleanly — ship stays at current position
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current       = null;
    animatingRef.current = false;

    const target = category.stops[stopIdx].frac;
    const start  = curFracRef.current;
    const delta  = target - start;

    // Already parked here — just open the panel
    if (Math.abs(delta) < 0.001) {
      currentStopRef.current = stopIdx;
      selectedRef.current    = stopIdx;
      if (trailRef.current) trailRef.current.setAttribute("opacity", "0");
      setSelected(stopIdx);
      return;
    }

    animatingRef.current = true;
    if (trailRef.current) trailRef.current.setAttribute("opacity", "1");

    // Max ~1 s for any flight; scales down for short hops
    const duration = reducedMotion.current
      ? 0
      : Math.max(300, Math.min(1000, Math.abs(delta) * 1600));

    if (duration === 0) {
      curFracRef.current     = target;
      currentStopRef.current = stopIdx;
      animatingRef.current   = false;
      placeShip(target);
      if (trailRef.current) trailRef.current.setAttribute("opacity", "0");
      selectedRef.current = stopIdx;
      setSelected(stopIdx);
      return;
    }

    const startTime = performance.now();
    const frame = (now) => {
      const t    = Math.min(1, (now - startTime) / duration);
      const frac = start + delta * spacecraftEase(t);
      curFracRef.current = frac;
      placeShip(frac);
      placeTrail(frac, delta);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        curFracRef.current     = target;
        animatingRef.current   = false;
        currentStopRef.current = stopIdx;
        placeShip(target);
        if (trailRef.current) trailRef.current.setAttribute("opacity", "0");
        selectedRef.current = stopIdx;
        setSelected(stopIdx);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [category]);

  const handleSelect = useCallback((i) => {
    lastFocusRef.current = document.activeElement;
    // Toggle: clicking the open stop closes the panel
    if (selectedRef.current === i) { handleClose(); return; }
    // Close any open panel, then fly to the new stop
    selectedRef.current = null;
    setSelected(null);
    animateToStop(i);
  }, [animateToStop, handleClose]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const n = category.stops.length;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && selectedRef.current !== null) {
        lastFocusRef.current?.focus();
        selectedRef.current = null;
        setSelected(null);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        handleSelect((currentStopRef.current + 1) % n);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleSelect((currentStopRef.current - 1 + n) % n);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [category, handleSelect]);

  const selStop = selected != null ? category.stops[selected] : null;

  return (
    <div className="passage-scene" style={sceneStyle}>

      {/* ── SVG Cosmos ── */}
      <svg
        ref={svgRef}
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        style={svgStyle}
        aria-hidden="true"
      >
        <defs>
          {/* Ship glow */}
          <filter id="scGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.2" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Exhaust trail glow */}
          <filter id="trailGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Orbital trail glow — wide bloom + tight halo + bare line */}
          <filter id="pathGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="9" result="bloom" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="halo" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Nebula blobs */}
          <radialGradient id="neb1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3a4a8a" stopOpacity="0.18" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="neb2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#6a3060" stopOpacity="0.13" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="neb3" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a4040" stopOpacity="0.12" />
            <stop offset="100%" stopColor={BG}      stopOpacity="0"    />
          </radialGradient>

          {/* Edge vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="35%"  stopColor={BG} stopOpacity="0"    />
            <stop offset="100%" stopColor={BG} stopOpacity="0.65" />
          </radialGradient>

          {/* Marker glow — soft bloom around stop rings */}
          <filter id="markerGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nebula blobs — rendered first so everything else sits on top */}
        <ellipse cx="280"  cy="380" rx="340" ry="220" fill="url(#neb1)" />
        <ellipse cx="1180" cy="560" rx="260" ry="190" fill="url(#neb2)" />
        <ellipse cx="900"  cy="200" rx="200" ry="150" fill="url(#neb3)" />

        {/* Star field — three depth layers */}
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={CREAM}
            opacity={star.op}
            style={star.tw ? {
              animation: `scBreathe ${1.8 + (i % 4) * 0.65}s ease-in-out ${(i * 0.47) % 3.5}s infinite`,
            } : undefined}
          />
        ))}

        {/* Orbital trajectory — single luminous line, no road fill */}
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke="rgba(195,220,255,0.72)"
          strokeWidth="1.1"
          strokeLinecap="round"
          filter="url(#pathGlow)"
        />

        {/* Stop markers */}
        {category.stops.map((stop, i) => {
          const xy      = stopsXY[i];
          if (!xy) return null;
          const active  = selected === i;
          const hovered = hoveredStop === i;
          const labelDx = xy.anchor === "start" ? 36 : -36;
          const outerDur = active ? "4s"   : "6s";
          const innerDur = active ? "2.7s" : "4s";

          return (
            <g
              key={stop.id}
              role="button"
              tabIndex={0}
              aria-label={`Stop ${i + 1}: ${stop.title}`}
              aria-pressed={active}
              transform={`translate(${xy.x} ${xy.y})`}
              style={{ cursor: "pointer", outline: "none" }}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => setHoveredStop(i)}
              onMouseLeave={() => setHoveredStop(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(i);
                }
              }}
            >
              {/* Hit target */}
              <circle cx="0" cy="0" r="30" fill="white" opacity="0" />

              {/* Keyboard-only focus ring (CSS :focus-visible drives opacity) */}
              <circle
                className="marker-kbd-ring"
                cx="0" cy="0" r="26"
                fill="none"
                stroke="rgba(195,220,255,0.75)"
                strokeWidth="1.5"
                strokeDasharray="5 3"
                style={{ opacity: 0, transition: "opacity 0.18s", pointerEvents: "none" }}
              />

              {/* Rings + dot in a scaling group for hover feedback */}
              <g
                filter="url(#markerGlow)"
                style={{
                  transform: (active || hovered) ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.22s ease",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                {/* Outer arc — slow clockwise */}
                <circle
                  cx="0" cy="0" r="20"
                  fill="none" stroke={CREAM} strokeWidth="1.2"
                  strokeDasharray="94 32"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: `svgSpin ${outerDur} linear infinite`,
                    opacity: active ? 0.88 : hovered ? 0.68 : 0.48,
                    transition: "opacity 0.4s",
                  }}
                />
                {/* Inner arc — counter-clockwise */}
                <circle
                  cx="0" cy="0" r="13"
                  fill="none" stroke={CREAM} strokeWidth="1.0"
                  strokeDasharray="54 28"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: `svgSpinR ${innerDur} linear infinite`,
                    opacity: active ? 0.75 : hovered ? 0.55 : 0.38,
                    transition: "opacity 0.4s",
                  }}
                />
                {/* Center dot — pulses when active */}
                <circle
                  cx="0" cy="0" r="3.5"
                  fill={CREAM}
                  style={{
                    opacity: active ? 0.95 : hovered ? 0.72 : 0.52,
                    transition: "opacity 0.4s",
                    ...(active ? { animation: "scBreathe 2.4s ease-in-out infinite" } : {}),
                  }}
                />
              </g>

              {/* Labels — outside scale group so text size is stable */}
              <text
                x={labelDx} y="0"
                textAnchor={xy.anchor} dominantBaseline="middle"
                fill={CREAM} fillOpacity={active ? 0.85 : hovered ? 0.65 : 0.4}
                style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.12em", transition: "fill-opacity 0.4s" }}
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={labelDx} y={26}
                textAnchor={xy.anchor} dominantBaseline="middle"
                fill={CREAM} fillOpacity={active ? 1 : hovered ? 0.94 : 0.82}
                style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: "300", transition: "fill-opacity 0.4s" }}
              >
                {stop.title}
              </text>
            </g>
          );
        })}

        {/* Exhaust trail — shown during animation, hidden at rest */}
        <g ref={trailRef} opacity="0" filter="url(#trailGlow)" style={{ pointerEvents: "none" }}>
          <circle r="3.2" fill={CREAM} opacity="0.5" />
          <circle r="2.0" fill={CREAM} opacity="0.3" />
          <circle r="1.1" fill={CREAM} opacity="0.15" />
        </g>

        {/* Spacecraft — positioned imperatively by animation RAF */}
        <g ref={shipRef} style={{ pointerEvents: "none" }} filter="url(#scGlow)">
          <path d="M 18 0 L -13 -10.5 L -5 0 L -13 10.5 Z" fill={CREAM} />
          <circle cx="-1.5" cy="0" r="2" fill={BG} />
        </g>

        {/* Vignette overlay — pointer-events:none so it doesn't block marker clicks */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#vignette)" style={{ pointerEvents: "none" }} />
      </svg>

      {/* ── Masthead ── */}
      <div style={mastheadStyle}>
        <Link to="/" style={backLinkStyle}>Baidi Wang</Link>
        <div style={categoryLabelStyle}>{category.label}</div>
        <div style={introStyle}>{category.intro}</div>
        <div style={mastheadHintStyle} aria-hidden="true">
          Pilot the craft — click or ↑↓
        </div>
      </div>

      {/* ── Direct-access list (primary accessible interface) ── */}
      <nav aria-label={`${category.label} projects`} style={listNavStyle}>
        <div style={listHeadingStyle}>The Passage</div>
        {category.stops.map((stop, i) => {
          const active = selected === i;
          return (
            <button
              key={stop.id}
              onClick={() => handleSelect(i)}
              style={listBtnStyle}
              aria-current={active ? "true" : undefined}
            >
              <span style={{ ...listNumStyle, color: active ? "rgba(242,239,233,0.95)" : "rgba(242,239,233,0.55)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{
                ...listNameStyle,
                color: active ? CREAM : "rgba(242,239,233,0.90)",
                borderBottomColor: active ? "rgba(242,239,233,0.7)" : "transparent",
              }}>
                {stop.title}
              </span>
            </button>
          );
        })}
      </nav>


      {/* ── Detail panel ── */}
      {selStop && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Project: ${selStop.title}`}
          style={{
            ...panelStyle,
            animation: reducedMotion.current
              ? "none"
              : "scPanel 0.6s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <button onClick={handleClose} autoFocus style={closeBtnStyle} aria-label="Close panel">
            Close ×
          </button>

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
        </div>
      )}
    </div>
  );
}

// ── Style objects ────────────────────────────────────────────────────────────

const sceneStyle = {
  position: "relative",
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background: BG,
  fontFamily: "var(--font-display)",
  color: CREAM,
};

const svgStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
};

const mastheadStyle = {
  position: "absolute",
  top: "42px",
  left: "48px",
  zIndex: 10,
  maxWidth: "340px",
  pointerEvents: "auto",
};

const backLinkStyle = {
  display: "block",
  fontFamily: "var(--font-accent)",
  fontSize: "44px",
  fontWeight: "400",
  letterSpacing: "0.04em",
  lineHeight: 1,
  color: CREAM,
  textDecoration: "none",
};

const categoryLabelStyle = {
  marginTop: "14px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.72)",
};

const introStyle = {
  marginTop: "18px",
  fontSize: "14px",
  lineHeight: "1.6",
  fontWeight: "300",
  color: "rgba(242,239,233,0.75)",
};

const mastheadHintStyle = {
  marginTop: "16px",
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.58)",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const listNavStyle = {
  position: "absolute",
  bottom: "44px",
  left: "48px",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const listHeadingStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.6)",
  marginBottom: "14px",
};

const listBtnStyle = {
  background: "none",
  border: "none",
  padding: "6px 0",
  display: "flex",
  alignItems: "baseline",
  gap: "14px",
  textAlign: "left",
  fontFamily: "var(--font-display)",
  cursor: "pointer",
};

const listNumStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.12em",
  minWidth: "20px",
  transition: "color 0.4s",
};

const listNameStyle = {
  fontSize: "19px",
  fontWeight: "400",
  transition: "color 0.4s",
  borderBottom: "1px solid transparent",
  paddingBottom: "1px",
};


const panelStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  height: "100vh",
  width: "52vw",
  minWidth: "420px",
  maxWidth: "100%",
  zIndex: 20,
  background: "rgba(5,5,5,0.82)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderLeft: "1px solid rgba(242,239,233,0.16)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "0 68px",
  overflowY: "auto",
};

const closeBtnStyle = {
  position: "absolute",
  top: "34px",
  right: "40px",
  background: "none",
  border: "none",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.5)",
  cursor: "pointer",
};

const thumbImgStyle = {
  width: "100%",
  aspectRatio: "16/9",
  objectFit: "cover",
  marginBottom: "28px",
  opacity: 0.85,
};

const thumbPlaceholderStyle = {
  width: "100%",
  aspectRatio: "16/9",
  background: "rgba(242,239,233,0.05)",
  border: "1px solid rgba(242,239,233,0.1)",
  marginBottom: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const thumbLabelStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.2)",
};

const stopNumStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.5)",
};

const dividerStyle = {
  width: "34px",
  height: "1px",
  background: "rgba(242,239,233,0.4)",
  margin: "18px 0",
};

const titleStyle = {
  fontSize: "44px",
  fontWeight: "300",
  lineHeight: "1.05",
  letterSpacing: "-0.01em",
};

const catStyle = {
  marginTop: "10px",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.55)",
};

const descStyle = {
  marginTop: "22px",
  fontSize: "15px",
  lineHeight: "1.62",
  fontWeight: "300",
  color: "rgba(242,239,233,0.78)",
};

const tagsRowStyle = {
  marginTop: "18px",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const tagStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.55)",
  border: "1px solid rgba(242,239,233,0.18)",
  padding: "3px 8px",
  borderRadius: "2px",
};

const linksRowStyle = {
  marginTop: "30px",
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
};

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: CREAM,
  textDecoration: "none",
  borderBottom: "1px solid rgba(242,239,233,0.5)",
  paddingBottom: "4px",
};
