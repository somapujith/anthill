import { useReducedMotion } from "motion/react";
import Threads from "./reactbits/Threads.jsx";
import "./brand-atmosphere.css";

export default function BrandAtmosphere({
  variant = "dark",
  paused = false,
  className = "",
}) {
  const reduced = useReducedMotion();
  const light = variant === "light";
  return (
    <div
      className={`brand-atmosphere brand-atmosphere--${light ? "light" : "dark"} ${className}`}
      aria-hidden="true"
    >
      <Threads
        color="#e6212b"
        accentColor={light ? "#302426" : "#ff898d"}
        amplitude={1.45}
        distance={0.46}
        lineCount={64}
        thickness={0.85}
        softness={0.65}
        speed={0.7}
        waves={1.15}
        split={0.06}
        fray={0.58}
        angle={-22}
        seed={1.2}
        taper={0.5}
        brightness={1.8}
        opacity={light ? 0.62 : 1}
        fade={0.12}
        paused={paused || Boolean(reduced)}
      />
    </div>
  );
}
