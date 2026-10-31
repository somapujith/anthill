import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import "./page-backdrop.css";

const Silk = lazy(() => import("./reactbits/Silk.jsx"));
const DotGrid = lazy(() => import("./reactbits/DotGrid.jsx"));
const LightRays = lazy(() => import("./reactbits/LightRays.jsx"));

function useActivity(ref, paused) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(true);
  useEffect(() => {
    let inView = true;
    const refresh = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      refresh();
    });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", refresh);
    refresh();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ref]);
  return !paused && !reduced && active;
}

export function HeroBackdrop({ paused = false }) {
  const ref = useRef(null);
  const running = useActivity(ref, paused);
  return (
    <div ref={ref} className="hero-backdrop" data-background-kind="silk" data-running={running} aria-hidden="true">
      <Suspense fallback={null}>
        <Silk color="#b90f24" sheenColor="#ff646c" speed={3.2} scale={1.45} rotation={-0.25} sheen={0.45} depth={0.7} glow={0.04} noiseIntensity={0.2} ripple={0.8} wave={1.2} variation={3} intro={false} mouseInteraction={false} clickRipple={false} paused={!running} />
      </Suspense>
    </div>
  );
}

const nodes = [[76, 92], [222, 54], [382, 102], [134, 224], [306, 206], [438, 280], [66, 366], [230, 346], [384, 418]];
const connections = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [2, 5], [3, 4], [3, 6], [3, 7], [4, 5], [4, 7], [5, 8], [6, 7], [7, 8]];
const familyFor = (pathname) => {
  if (pathname === "/about") return "contour-planes";
  if (pathname === "/philosophy") return "precision-grid";
  if (pathname === "/programs") return "ascending-rays";
  if (pathname === "/portfolio") return "portfolio-dots";
  if (pathname === "/team") return "portrait-mosaic";
  if (pathname === "/speedscalers") return "mentor-network";
  if (pathname === "/stories") return "editorial-print";
  if (pathname === "/insights") return "publication-grid";
  if (pathname === "/contact") return "signal-arcs";
  if (pathname.startsWith("/portfolio/")) return "company-dots";
  if (pathname.startsWith("/team/")) return "person-mosaic";
  if (pathname.startsWith("/mentors/")) return "person-network";
  if (pathname.startsWith("/stories/")) return "story-print";
  if (pathname.startsWith("/playbooks/")) return "playbook-grid";
  return "reading-surface";
};

function Architecture({ seed }) {
  return <svg className="backdrop-architecture" viewBox="0 0 500 500" fill="none">
    {Array.from({ length: 11 }, (_, i) => <path className="contour-plane" key={i} style={{ "--plane": i }} d={`M${55 + i * 12} ${336 - i * 16} L${248 + i * 4} ${440 - i * 16} L${459 - i * 8} ${308 - i * 15} L${267 - i * 2} ${191 - i * 13} Z`} />)}
    <path d={`M87 405 L270 ${50 + seed % 35} L458 405`} stroke="#e6212b" strokeWidth="1.5" />
  </svg>;
}

function PrecisionGrid() {
  return <div className="backdrop-precision"><div className="precision-plane" /><span className="precision-axis horizontal" /><span className="precision-axis vertical" /><div className="precision-square" /></div>;
}

function Network({ seed }) {
  return <svg className="backdrop-network" viewBox="0 0 500 500" fill="none">
    {connections.map(([a, b], i) => <path className="network-edge" key={i} style={{ "--edge": i }} d={`M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}`} />)}
    {nodes.map(([x, y], i) => <g className="network-node" key={i} style={{ "--node": (i + seed) % 9 }}><circle cx={x} cy={y} r={i === 4 ? 18 : 9} /><circle className="node-halo" cx={x} cy={y} r={i === 4 ? 32 : 18} /></g>)}
  </svg>;
}

function Mosaic({ seed }) {
  return <div className="backdrop-mosaic">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ "--tile": i, "--tile-shift": `${(i * 7 + seed) % 24}px` }} />)}</div>;
}

function PrintPanels({ seed }) {
  return <div className="backdrop-print"><div className="print-ink"><span>ANTHILL</span><i /></div><div className="print-red"><span>Field<br />notes.</span></div><div className="print-column">{Array.from({ length: 15 }, (_, i) => <i key={i} style={{ width: `${65 + ((i * 13 + seed) % 35)}%` }} />)}</div></div>;
}

function Publication() {
  return <div className="backdrop-publication"><div className="publication-spine" /><div className="publication-title" /><div className="publication-rules">{Array.from({ length: 11 }, (_, i) => <span key={i} />)}</div><div className="publication-block" /></div>;
}

function Signal({ seed }) {
  return <svg className="backdrop-signal" viewBox="0 0 500 500" fill="none">{Array.from({ length: 8 }, (_, i) => <circle className="signal-ring" key={i} cx={340 - seed % 40} cy="250" r={28 + i * 36} style={{ "--ring": i }} />)}<circle cx={340 - seed % 40} cy="250" r="9" fill="#e6212b" /></svg>;
}

export default function PageBackdrop({ pathname = "/", paused = false }) {
  const ref = useRef(null);
  const running = useActivity(ref, paused);
  if (pathname === "/") return <HeroBackdrop paused={paused} />;
  const kind = familyFor(pathname);
  const seed = [...pathname].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 0);
  return <div ref={ref} className={`page-backdrop page-backdrop--${kind}`} data-background-kind={kind} data-running={running} style={{ "--composition-offset": `${(seed % 19) - 9}px`, "--composition-angle": `${(seed % 9) - 4}deg` }} aria-hidden="true">
    {kind === "contour-planes" && <Architecture seed={seed} />}
    {kind === "precision-grid" && <PrecisionGrid />}
    {kind === "ascending-rays" && <Suspense fallback={null}><LightRays raysOrigin="bottom-center" raysColor="#ffb1b7" raysSpeed={0.5} lightSpread={0.8} rayLength={2.7} rayDensity={2.5} raySharpness={0.7} glow={0.35} haze={0.14} intensity={1.7} tilt={-12} followMouse={false} cursorShadow={false} clickPulse={false} intro={false} paused={!running} /></Suspense>}
    {(kind === "portfolio-dots" || kind === "company-dots") && <Suspense fallback={null}><DotGrid dotSize={kind === "company-dots" ? 4 : 5} gap={kind === "company-dots" ? 15 + seed % 12 : 20} baseColor="#d73843" activeColor="#1c2020" proximity={130} strength={0.7} glow={0} fade={0.16} intro={running} mouseInteraction={running} clickShock={false} paused={!running} /></Suspense>}
    {(kind === "portrait-mosaic" || kind === "person-mosaic") && <Mosaic seed={seed} />}
    {(kind === "mentor-network" || kind === "person-network") && <Network seed={seed} />}
    {(kind === "editorial-print" || kind === "story-print") && <PrintPanels seed={seed} />}
    {(kind === "publication-grid" || kind === "playbook-grid") && <Publication />}
    {kind === "signal-arcs" && <Signal seed={seed} />}
  </div>;
}
