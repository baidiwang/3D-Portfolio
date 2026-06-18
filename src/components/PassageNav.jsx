import { useRef, useState, useLayoutEffect, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PATH_D } from "../constants/categories";

const N = 600;
const VIEWBOX = "0 0 1440 900";
const CREAM = "#f2efe9";
const BG = "#050505";

// --- Pure geometry helpers (outside component, no closures) ---

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

function buildWalls(pts) {
  const wob = (i) => Math.sin(i * 0.6) * 1.3 + Math.sin(i * 0.17) * 2.2;
  const width = (f) =>
    30 + 15 * Math.sin(f * Math.PI * 3) + 5 * Math.sin(f * Math.PI * 7);
  let L = "", R = "", H = "";
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    const rad = (p.a * Math.PI) / 180;
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const w = width(p.frac) + wob(i);
    const lx = p.x + nx * w, ly = p.y + ny * w;
    const rx = p.x - nx * w, ry = p.y - ny * w;
    L += (L ? " L " : "M ") + lx.toFixed(1) + " " + ly.toFixed(1);
    R += (R ? " L " : "M ") + rx.toFixed(1) + " " + ry.toFixed(1);
    if (i % 12 === 0) {
      const h = 9 + (i % 24 === 0 ? 9 : 0);
      H += `M ${lx.toFixed(1)} ${ly.toFixed(1)} L ${(lx + nx * h).toFixed(1)} ${(ly + ny * h).toFixed(1)} `;
      H += `M ${rx.toFixed(1)} ${ry.toFixed(1)} L ${(rx - nx * h).toFixed(1)} ${(ry - ny * h).toFixed(1)} `;
    }
  }
  return { L, R, H };
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

// --- Component ---

export default function PassageNav({ category }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const shipRef = useRef(null);

  // All animation state lives in refs — no re-renders per frame
  const samplesRef = useRef([]);
  const curFracRef = useRef(category.stops[0].frac);
  const mouseFracRef = useRef(category.stops[0].frac);
  const lockFracRef = useRef(null);
  const selectedRef = useRef(null);
  const lastFocusRef = useRef(null);
  const rafRef = useRef(null);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // React state — only what drives re-renders
  const [selected, setSelected] = useState(null);
  const [wallPaths, setWallPaths] = useState({ L: "", R: "", H: "" });
  const [stopsXY, setStopsXY] = useState([]);

  // Sample path geometry — runs synchronously after mount so ship is placed before paint
  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;

    const pts = samplePath(pathEl);
    samplesRef.current = pts;

    setWallPaths(buildWalls(pts));
    setStopsXY(computeStopsXY(pts, category.stops));

    // Reset animation fractions for new category
    curFracRef.current = category.stops[0].frac;
    mouseFracRef.current = curFracRef.current;
    lockFracRef.current = null;

    // Place ship immediately so it doesn't flash at origin
    const ship = shipRef.current;
    if (ship) {
      const idx = Math.round(curFracRef.current * (N - 1));
      const p = pts[idx];
      ship.setAttribute(
        "transform",
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})`
      );
    }
  }, [category]);

  // Reset selection when category changes
  useEffect(() => {
    setSelected(null);
    selectedRef.current = null;
  }, [category]);

  // Mouse/touch tracking + RAF loop
  useEffect(() => {
    const svg = svgRef.current;
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
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      return pts[best].frac;
    };

    const handleMouseMove = (e) => {
      const sp = toSVGPoint(e.clientX, e.clientY);
      if (!sp) return;
      mouseFracRef.current = nearestFrac(sp);
      lockFracRef.current = null;
    };

    const handleTouchMove = (e) => {
      if (!e.touches.length) return;
      const sp = toSVGPoint(e.touches[0].clientX, e.touches[0].clientY);
      if (!sp) return;
      mouseFracRef.current = nearestFrac(sp);
      lockFracRef.current = null;
    };

    const placeShip = (frac) => {
      const pts = samplesRef.current;
      if (!pts.length) return;
      const idx = Math.round(Math.max(0, Math.min(1, frac)) * (pts.length - 1));
      const p = pts[idx];
      ship.setAttribute(
        "transform",
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})`
      );
    };

    const LERP = reducedMotion.current ? 1 : 0.14;
    const stops = category.stops;

    const loop = () => {
      const target =
        lockFracRef.current != null ? lockFracRef.current : mouseFracRef.current;
      curFracRef.current += (target - curFracRef.current) * LERP;
      placeShip(curFracRef.current);

      // Release lock once ship has arrived
      if (
        lockFracRef.current != null &&
        Math.abs(curFracRef.current - lockFracRef.current) < 0.004
      ) {
        lockFracRef.current = null;
      }

      // Stop proximity detection
      let nearIdx = null, nearDist = 1;
      for (let i = 0; i < stops.length; i++) {
        const d = Math.abs(curFracRef.current - stops[i].frac);
        if (d < nearDist) { nearDist = d; nearIdx = i; }
      }

      if (nearDist < 0.028 && selectedRef.current !== nearIdx) {
        selectedRef.current = nearIdx;
        setSelected(nearIdx);
      } else if (
        nearDist > 0.06 &&
        lockFracRef.current == null &&
        selectedRef.current !== null
      ) {
        selectedRef.current = null;
        setSelected(null);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [category]);

  // Escape closes panel and restores focus
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

  const handleSelect = useCallback(
    (i) => {
      lastFocusRef.current = document.activeElement;
      lockFracRef.current = category.stops[i].frac;
      selectedRef.current = i;
      setSelected(i);
    },
    [category]
  );

  const handleClose = useCallback(() => {
    lastFocusRef.current?.focus();
    selectedRef.current = null;
    setSelected(null);
  }, []);

  const selStop = selected != null ? category.stops[selected] : null;

  return (
    <div className="passage-scene" style={sceneStyle}>
      {/* ── SVG Scene ── */}
      <svg
        ref={svgRef}
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        style={svgStyle}
        aria-hidden="true"
      >
        <defs>
          <filter id="scInk" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.35" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="scGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.2" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ink flecks */}
        <g fill={CREAM} opacity="0.5">
          <circle cx="150"  cy="120" r="1.1" opacity="0.32" />
          <circle cx="1290" cy="180" r="1.4" opacity="0.28" />
          <circle cx="980"  cy="120" r="1"   opacity="0.22" />
          <circle cx="320"  cy="780" r="1.2" opacity="0.30" />
          <circle cx="1180" cy="800" r="1"   opacity="0.24" />
          <circle cx="700"  cy="60"  r="1"   opacity="0.20" />
          <circle cx="60"   cy="520" r="1.3" opacity="0.26" />
          <circle cx="1380" cy="540" r="1.1" opacity="0.24" />
          <circle cx="520"  cy="850" r="1"   opacity="0.20" />
          <circle cx="450"  cy="300" r="0.9" opacity="0.18" />
          <circle cx="850"  cy="750" r="1.2" opacity="0.22" />
          <circle cx="100"  cy="680" r="1"   opacity="0.20" />
        </g>

        {/* Carved passage walls */}
        {wallPaths.L && (
          <path
            d={wallPaths.L}
            fill="none"
            stroke={CREAM}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#scInk)"
            opacity="0.92"
          />
        )}
        {wallPaths.R && (
          <path
            d={wallPaths.R}
            fill="none"
            stroke={CREAM}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#scInk)"
            opacity="0.92"
          />
        )}
        {wallPaths.H && (
          <path
            d={wallPaths.H}
            fill="none"
            stroke={CREAM}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.28"
          />
        )}

        {/* Dashed travel guide — also the sampling path */}
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke={CREAM}
          strokeWidth="1.4"
          strokeDasharray="1.5 11"
          strokeLinecap="round"
          opacity="0.28"
        />

        {/* Stop markers */}
        {category.stops.map((stop, i) => {
          const xy = stopsXY[i];
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

        {/* Spacecraft — positioned by RAF, never by React */}
        <g ref={shipRef} style={{ pointerEvents: "none" }} filter="url(#scGlow)">
          <path d="M 13 0 L -9 -7.5 L -3.5 0 L -9 7.5 Z" fill={CREAM} />
          <circle cx="-1" cy="0" r="1.4" fill={BG} />
        </g>
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
            animation: reducedMotion.current ? "none" : "scPanel 0.6s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <button onClick={handleClose} autoFocus style={closeBtnStyle} aria-label="Close panel">
            Close ×
          </button>

          {/* Thumbnail */}
          {selStop.thumbnail ? (
            <img
              src={selStop.thumbnail}
              alt={selStop.title}
              style={thumbImgStyle}
            />
          ) : (
            <div style={thumbPlaceholderStyle} aria-hidden="true">
              <span style={thumbLabelStyle}>Thumbnail</span>
            </div>
          )}

          {/* Stop number */}
          <div style={stopNumStyle}>Stop {String(selected + 1).padStart(2, "0")}</div>

          {/* Divider */}
          <div style={dividerStyle} />

          {/* Title */}
          <div style={titleStyle}>{selStop.title}</div>

          {/* Category */}
          <div style={catStyle}>{selStop.category}</div>

          {/* Description */}
          <div style={descStyle}>{selStop.oneLineDescription}</div>

          {/* Tags */}
          <div style={tagsRowStyle}>
            {selStop.tags.map((tag) => (
              <span key={tag} style={tagStyle}>{tag}</span>
            ))}
          </div>

          {/* Links */}
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

// ── Style objects (extracted to keep JSX readable) ──

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
  background: "rgba(242,239,233,0.06)",
  border: "1px solid rgba(242,239,233,0.12)",
  marginBottom: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const thumbLabelStyle = {
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(242,239,233,0.25)",
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
  border: "1px solid rgba(242,239,233,0.2)",
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
