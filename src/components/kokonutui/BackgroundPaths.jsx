// Background Paths by kokonutUI (Dorian Baffier), listed on 21st.dev.
// https://github.com/kokonut-labs/kokonutui/blob/main/components/kokonutui/background-paths.tsx
// MIT: see THIRD_PARTY_NOTICES.md. Ported to JSX as a bare layer with a pause control and a fixed color.

import { useEffect, useRef } from "react";

const SAMPLES = 40;
const FRAME_MS = 1000 / 30;
const OVERSCAN = 0.06;
const DRAW_MS = 1400;
const DRAW_STAGGER_MS = 40;
const PART_RADIUS = 150;
const PART_PUSH = 56;

const LAYERS = [
  { width: 1, opacity: 0.16, phase: 0.6, pace: 0.7, part: 0.45 },
  { width: 1.25, opacity: 0.26, phase: 0.3, pace: 0.85, part: 0.75 },
  { width: 1.5, opacity: 0.4, phase: 0, pace: 1, part: 1 },
];

function lineY(s, u, layer, frame, shape, band) {
  const t = frame.time * layer.pace;
  const x = u * frame.width;
  const center =
    frame.height * 0.5 +
    shape.slope * (x - frame.width / 2) +
    band *
      0.1 *
      Math.sin(Math.PI * 2 * (0.75 * u + 0.1) + layer.phase + t * 0.35);
  const turn = 0.22 + 0.09 * Math.sin(t * 0.21 + layer.phase);
  const breathe = 0.3 * Math.sin(t * 0.5 + s * 4 + layer.phase);
  const twist = Math.cos(
    Math.PI * (u - turn) + s * (0.6 + breathe) + layer.phase,
  );
  return center + s * shape.spread * band * twist;
}

function part(x, y, frame, strength) {
  const { pointer } = frame;
  if (pointer.amount < 0.001) return y;
  const dx = x - pointer.x;
  const dy = y - pointer.y;
  const falloff = Math.exp(-(dx * dx + dy * dy) / (PART_RADIUS * PART_RADIUS));
  const side = dy / (Math.abs(dy) + 24);
  return y + side * falloff * PART_PUSH * strength * pointer.amount;
}

function drawLines(ctx, frame, shape, color) {
  const { width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const band = Math.min(height, width * 1.1);
  const perLayer = Math.max(1, Math.round(shape.count / LAYERS.length));
  const xs = new Float32Array(SAMPLES + 1);
  const ys = new Float32Array(SAMPLES + 1);

  LAYERS.forEach((layer, layerIndex) => {
    ctx.lineWidth = layer.width;
    for (let i = 0; i < perLayer; i++) {
      const drawn = frame.drawn[layerIndex * perLayer + i] ?? 1;
      if (drawn <= 0) continue;
      const s = perLayer === 1 ? 0 : i / (perLayer - 1) - 0.5;
      const last = Math.max(1, Math.ceil(SAMPLES * drawn));
      for (let k = 0; k <= last; k++) {
        const u = -OVERSCAN + (k / SAMPLES) * (1 + OVERSCAN * 2);
        const x = u * width;
        const y = lineY(s, u, layer, frame, shape, band);
        xs[k] = x;
        ys[k] = shape.interactive ? part(x, y, frame, layer.part) : y;
      }
      ctx.globalAlpha = layer.opacity * (0.45 + 0.55 * (1 - Math.abs(s) * 2));
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let k = 1; k < last; k++) {
        const mx = (xs[k] + xs[k + 1]) / 2;
        const my = (ys[k] + ys[k + 1]) / 2;
        ctx.quadraticCurveTo(xs[k], ys[k], mx, my);
      }
      ctx.lineTo(xs[last], ys[last]);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
}

const easeOut = (t) => 1 - (1 - t) ** 3;

export default function BackgroundPaths({
  className = "",
  color = "#ffffff",
  count = 42,
  spread = 1,
  angle = -8,
  speed = 1,
  interactive = true,
  paused = false,
  fade = false,
}) {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef(null);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    // Touch devices get a still frame: the lines are subtle and the battery cost is not.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce), (pointer: coarse)",
    ).matches;
    const shape = {
      count,
      spread,
      slope: Math.tan((angle * Math.PI) / 180),
      interactive: interactive && !reduceMotion,
    };
    const perLayer = Math.max(1, Math.round(count / LAYERS.length));
    const frame = {
      width: 0,
      height: 0,
      time: 40,
      drawn: new Array(perLayer * LAYERS.length).fill(reduceMotion ? 1 : 0),
      pointer: { x: 0, y: 0, amount: 0, on: false },
    };
    let start = 0;
    let last = 0;
    let raf = 0;
    let onScreen = true;
    const visible = () => onScreen && !document.hidden;
    const paint = () => {
      drawLines(ctx, frame, shape, color);
      if (!fade) return;
      // Erasing here is far cheaper than a CSS mask over a canvas that repaints.
      const gradient = ctx.createLinearGradient(frame.width * 0.38, 0, frame.width * 0.82, 0);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(1, "transparent");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, frame.width, frame.height);
      ctx.globalCompositeOperation = "source-over";
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = 1;
      frame.width = rect.width;
      frame.height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const loop = (now) => {
      raf = 0;
      if (!start) {
        start = now;
        last = now;
      } else if (now - last < FRAME_MS - 0.25) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!pausedRef.current) frame.time += dt * speed;
      const elapsed = now - start;
      for (let i = 0; i < frame.drawn.length; i++) {
        if (frame.drawn[i] < 1) {
          const local = (elapsed - (i % perLayer) * DRAW_STAGGER_MS) / DRAW_MS;
          frame.drawn[i] = easeOut(Math.min(Math.max(local, 0), 1));
        }
      }
      const { pointer } = frame;
      pointer.amount += ((pointer.on ? 1 : 0) - pointer.amount) * 0.08;
      paint();
      const settling =
        frame.drawn.some((d) => d < 1) || pointer.amount > 0.001 || pointer.on;
      if (visible() && ((!pausedRef.current && speed > 0) || settling))
        raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!raf && visible() && !reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    wakeRef.current = play;

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      play();
    });
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", play);

    // The layer sits under the hero content, so the pointer is tracked on the window.
    const onMove = (event) => {
      if (event.pointerType !== "mouse" || !shape.interactive) return;
      const rect = canvas.getBoundingClientRect();
      frame.pointer.x = event.clientX - rect.left;
      frame.pointer.y = event.clientY - rect.top;
      frame.pointer.on =
        frame.pointer.x >= 0 &&
        frame.pointer.y >= 0 &&
        frame.pointer.x <= rect.width &&
        frame.pointer.y <= rect.height;
      if (frame.pointer.on) play();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    play();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", play);
      window.removeEventListener("pointermove", onMove);
    };
  }, [count, spread, angle, speed, interactive, color, fade]);

  useEffect(() => {
    if (!paused) wakeRef.current?.();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
