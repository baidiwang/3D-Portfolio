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
  // Layer 0 — background: tiny, very faint
  for (let i = 0; i < 72; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 0.35 + r() * 0.5, op: 0.07 + r() * 0.14, tw: false });
  // Layer 1 — midground: slightly brighter
  for (let i = 0; i < 26; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 0.65 + r() * 0.9, op: 0.18 + r() * 0.24, tw: false });
  // Layer 2 — foreground: brightest, some twinkle
  for (let i = 0; i < 10; i++)
    out.push({ x: r() * 1440, y: r() * 900, r: 1.1 + r() * 1.4, op: 0.50 + r() * 0.45, tw: true });
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

// ── Component ───────────────────────────────────────────────────────────────

export default function PassageNav({ category }) {
  const svgRef  = useRef(null);
  const pathRef = useRef(null);
  const shipRef = useRef(null);

  // Animation state — all refs, zero re-renders per frame
  const samplesRef     = useRef([]);
  const curFracRef     = useRef(category.stops[0].frac);
  const mouseFracRef   = useRef(category.stops[0].frac);
  const lockFracRef    = useRef(null);
  const selectedRef    = useRef(null);
  const lastFocusRef   = useRef(null);
  const rafRef         = useRef(null);
  const reducedMotion  = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [selected, setSelected] = useState(null);
  const [stopsXY,  setStopsXY]  = useState([]);

  // Sample path + place ship before first paint
  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    const pts = samplePath(pathEl);
    samplesRef.current = pts;
    setStopsXY(computeStopsXY(pts, category.stops));

    curFracRef.current   = category.stops[0].frac;
    mouseFracRef.current = curFracRef.current;
    lockFracRef.current  = null;

    const ship = shipRef.current;
    if (ship) {
      const idx = Math.round(curFracRef.current * (N - 1));
      const p   = pts[idx];
      ship.setAttribute(
        "transform",
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})`
      );
    }
  }, [category]);

  // Reset selection on category switch
  useEffect(() => {
    setSelected(null);
    selectedRef.current = null;
  }, [category]);

  // Mouse/touch tracking + RAF loop — interaction unchanged
  useEffect(() => {
    const svg  = svgRef.current;
    const ship = shipRef.current;
    if (!svg || !ship) return;

    const toSVGPoint = (clientX, clientY) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const nearestFrac = ({ x, y }) => {
      const pts = samplesRef.current;
      if (!pts.length) return 0;
      let best = 0, bd = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - x, dy = pts[i].y - y;
        const d  = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      return pts[best].frac;
    };

    const handleMouseMove = (e) => {
      const sp = toSVGPoint(e.clientX, e.clientY);
      if (!sp) return;
      mouseFracRef.current = nearestFrac(sp);
      lockFracRef.current  = null;
    };

    const handleTouchMove = (e) => {
      if (!e.touches.length) return;
      const sp = toSVGPoint(e.touches[0].clientX, e.touches[0].clientY);
      if (!sp) return;
      mouseFracRef.current = nearestFrac(sp);
      lockFracRef.current  = null;
    };

    const placeShip = (frac) => {
      const pts = samplesRef.current;
      if (!pts.length) return;
      const idx = Math.round(Math.max(0, Math.min(1, frac)) * (pts.length - 1));
      const p   = pts[idx];
      ship.setAttribute(
        "transform",
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})`
      );
    };

    const LERP  = reducedMotion.current ? 1 : 0.14;
    const stops = category.stops;

    const loop = () => {
      const target = lockFracRef.current != null ? lockFracRef.current : mouseFracRef.current;
      curFracRef.current += (target - curFracRef.current) * LERP;
      placeShip(curFracRef.current);

      if (lockFracRef.current != null &&
          Math.abs(curFracRef.current - lockFracRef.current) < 0.004)
        lockFracRef.current = null;

      let nearIdx = null, nearDist = 1;
      for (let i = 0; i < stops.length; i++) {
        const d = Math.abs(curFracRef.current - stops[i].frac);
        if (d < nearDist) { nearDist = d; nearIdx = i; }
      }

      if (nearDist < 0.028 && selectedRef.current !== nearIdx) {
        selectedRef.current = nearIdx;
        setSelected(nearIdx);
      } else if (nearDist > 0.06 && lockFracRef.current == null && selectedRef.current !== null) {
        selectedRef.current = null;
        setSelected(null);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("mousemove",  handleMouseMove);
    window.addEventListener("touchmove",  handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [category]);

  // Escape closes panel
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && selectedRef.current !== null) {
        lastFocusRef.current?.focus();
        selectedRef.current = null;
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback((i) => {
    lastFocusRef.current      = document.activeElement;
    lockFracRef.current       = category.stops[i].frac;
    selectedRef.current       = i;
    setSelected(i);
  }, [category]);

  const handleClose = useCallback(() => {
    lastFocusRef.current?.focus();
    selectedRef.current = null;
    setSelected(null);
  }, []);

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

          {/* Orbital trail glow */}
          <filter id="pathGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
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

        {/* Orbital trajectory — glow aura behind, dashed core on top */}
        <path
          d={PATH_D}
          fill="none"
          stroke="rgba(160,200,255,0.07)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke={CREAM}
          strokeWidth="1.3"
          strokeDasharray="4 13"
          strokeLinecap="round"
          opacity="0.42"
          filter="url(#pathGlow)"
        />

        {/* Stop markers */}
        {category.stops.map((stop, i) => {
          const xy     = stopsXY[i];
          if (!xy) return null;
          const active = selected === i;
          return (
            <g
              key={stop.id}
              role="button"
              tabIndex={0}
              aria-label={`Stop ${i + 1}: ${stop.title}`}
              aria-pressed={active}
              onClick={() => handleSelect(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(i);
                }
              }}
            >
              <circle
                cx={xy.x} cy={xy.y} r="22"
                fill={BG} stroke={CREAM} strokeWidth="1.3"
                opacity={active ? 0.95 : 0.4}
              />
              <circle
                cx={xy.x} cy={xy.y} r="4.5"
                fill={CREAM}
                opacity={active ? 1 : 0.55}
                style={active ? { animation: "scBreathe 2.4s ease-in-out infinite" } : undefined}
              />
              <text
                x={xy.labelX} y={xy.y}
                textAnchor={xy.anchor} dominantBaseline="middle"
                fill={CREAM} fillOpacity={active ? 0.85 : 0.4}
                style={{ fontSize: "13px", letterSpacing: "0.12em" }}
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={xy.labelX} y={xy.nameY}
                textAnchor={xy.anchor} dominantBaseline="middle"
                fill={CREAM} fillOpacity={active ? 1 : 0.55}
                style={{ fontSize: "21px", fontStyle: "italic", fontWeight: "300" }}
              >
                {stop.title}
              </text>
            </g>
          );
        })}

        {/* Spacecraft — placed by RAF, never by React */}
        <g ref={shipRef} style={{ pointerEvents: "none" }} filter="url(#scGlow)">
          <path d="M 13 0 L -9 -7.5 L -3.5 0 L -9 7.5 Z" fill={CREAM} />
          <circle cx="-1" cy="0" r="1.4" fill={BG} />
        </g>

        {/* Vignette overlay — rendered last to darken edges */}
        <rect x="0" y="0" width="1440" height="900" fill="url(#vignette)" />
      </svg>

      {/* ── Masthead ── */}
      <div style={mastheadStyle}>
        <Link to="/" style={backLinkStyle}>Baidi Wang</Link>
        <div style={categoryLabelStyle}>{category.label}</div>
        <div style={introStyle}>{category.intro}</div>
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
              <span style={{ ...listNumStyle, color: active ? "rgba(242,239,233,0.95)" : "rgba(242,239,233,0.4)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{
                ...listNameStyle,
                color: active ? CREAM : "rgba(242,239,233,0.7)",
                borderBottomColor: active ? "rgba(242,239,233,0.7)" : "transparent",
              }}>
                {stop.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Corner hint ── */}
      <div style={hintStyle} aria-hidden="true">
        Move to pilot · stop to arrive
      </div>

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
  fontFamily: "'Newsreader', Georgia, serif",
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
  maxWidth: "300px",
  pointerEvents: "auto",
};

const backLinkStyle = {
  display: "block",
  fontSize: "30px",
  fontStyle: "italic",
  fontWeight: "300",
  letterSpacing: "0.01em",
  lineHeight: 1,
  color: CREAM,
  textDecoration: "none",
};

const categoryLabelStyle = {
  marginTop: "12px",
  fontSize: "11px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.5)",
};

const introStyle = {
  marginTop: "20px",
  fontSize: "14px",
  lineHeight: "1.55",
  fontWeight: "300",
  color: "rgba(242,239,233,0.62)",
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
  fontSize: "10px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.4)",
  marginBottom: "12px",
};

const listBtnStyle = {
  background: "none",
  border: "none",
  padding: "5px 0",
  display: "flex",
  alignItems: "baseline",
  gap: "14px",
  textAlign: "left",
  fontFamily: "'Newsreader', Georgia, serif",
};

const listNumStyle = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  minWidth: "20px",
  transition: "color 0.4s",
};

const listNameStyle = {
  fontSize: "17px",
  fontStyle: "italic",
  fontWeight: "300",
  transition: "color 0.4s",
  borderBottom: "1px solid transparent",
  paddingBottom: "1px",
};

const hintStyle = {
  position: "absolute",
  top: "46px",
  right: "48px",
  zIndex: 10,
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.35)",
  animation: "scBreathe 4s ease-in-out infinite",
  pointerEvents: "none",
};

const panelStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  height: "100vh",
  width: "392px",
  maxWidth: "100%",
  zIndex: 20,
  background: "rgba(5,5,5,0.82)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderLeft: "1px solid rgba(242,239,233,0.16)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "0 46px",
  overflowY: "auto",
};

const closeBtnStyle = {
  position: "absolute",
  top: "34px",
  right: "40px",
  background: "none",
  border: "none",
  fontSize: "13px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.5)",
  fontFamily: "'Newsreader', Georgia, serif",
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
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.2)",
};

const stopNumStyle = {
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
  fontSize: "46px",
  fontStyle: "italic",
  fontWeight: "300",
  lineHeight: "1.02",
};

const catStyle = {
  marginTop: "10px",
  fontSize: "12px",
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
  fontSize: "10px",
  letterSpacing: "0.22em",
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
  fontSize: "12px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: CREAM,
  textDecoration: "none",
  borderBottom: "1px solid rgba(242,239,233,0.5)",
  paddingBottom: "4px",
};
