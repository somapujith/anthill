import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import "./page-backdrop.css";

const Silk = lazy(() => import("./reactbits/Silk.jsx"));

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

export function HeroBackdrop({ paused = false, variation = 3 }) {
  const ref = useRef(null);
  const running = useActivity(ref, paused);
  return (
    <div ref={ref} className="hero-backdrop" data-background-kind="silk" data-running={running} aria-hidden="true">
      <Suspense fallback={null}>
        <Silk color="#b90f24" sheenColor="#ff646c" speed={3.2} scale={1.45} rotation={-0.25} sheen={0.45} depth={0.7} glow={0} noiseIntensity={0} dpr={0.6} ripple={0.8} wave={1.2} variation={variation} intro mouseInteraction clickRipple={false} paused={!running} />
      </Suspense>
    </div>
  );
}
