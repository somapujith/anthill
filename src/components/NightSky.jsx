import { useEffect, useId, useRef, useState } from "react";
import "./night-sky.css";

/*
 * A living night sky on one canvas: twinkling pinpoints, a few shining stars
 * with a halo and a glint, and shooting stars at random intervals.
 *
 * clipRef: ref to an SVG <path> (viewBox 0 0 100 100, preserveAspectRatio none)
 * outlining the dark region. Its `d` is mirrored into a CSS clip-path so stars
 * and meteors only show inside it. The wrapper stays hidden until that path
 * exists, so no star ever paints over the bright side of the curve.
 *
 * QA hooks on the wrapper element:
 *   dispatchEvent(new CustomEvent("nightsky:shoot"))  spawns a meteor now.
 *   "nightsky:meteor" is fired on every spawn, detail { kind: "auto" | "follow" | "manual", t }.
 */

const MAX_STARS = 240;
const AREA_PER_STAR = 6500;
const ALPHA_CAP = 0.9;
const SHINING_SHARE = 0.07;
const WARM_SHARE = 0.12;
const MAX_METEORS = 2;
const FIRST_MS = [1500, 4000];
const GAP_MS = [4000, 11000];
const FOLLOW_CHANCE = 0.15;
const FOLLOW_MS = [200, 700];
const MAX_FRAME_MS = 100;
const IDLE_FRAME_MS = 30; // twinkle is slow, so ~30 fps is plenty until a meteor is in flight
const CLIP_RETRY_FRAMES = 120;
const TAU = Math.PI * 2;
const WHITE = "255,255,255";
const WARM = "255,215,218";

const between = (lo, hi, rand = Math.random) => lo + (hi - lo) * rand();
const smooth = (t) => {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Always MAX_STARS in a fixed order, so a smaller box simply shows a prefix and a resize never reshuffles.
function buildStars(seed) {
  const rand = mulberry32(Math.floor(seed) || 0);
  const s = {
    x: new Float32Array(MAX_STARS),
    y: new Float32Array(MAX_STARS),
    r: new Float32Array(MAX_STARS),
    alpha: new Float32Array(MAX_STARS),
    phase: new Float32Array(MAX_STARS),
    omega: new Float32Array(MAX_STARS),
    warm: new Uint8Array(MAX_STARS),
    halo: new Float32Array(MAX_STARS),
    glint: new Float32Array(MAX_STARS),
    glintPhase: new Float32Array(MAX_STARS),
    glintOmega: new Float32Array(MAX_STARS),
  };
  for (let i = 0; i < MAX_STARS; i++) {
    // Best candidate of four keeps the sky even without looking like a grid.
    let bestD = -1;
    for (let c = 0; c < 4; c++) {
      const cx = rand();
      const cy = rand();
      let nearest = Infinity;
      for (let j = 0; j < i; j++) {
        const dx = cx - s.x[j];
        const dy = cy - s.y[j];
        const d = dx * dx + dy * dy;
        if (d < nearest) nearest = d;
      }
      if (nearest > bestD) {
        bestD = nearest;
        s.x[i] = cx;
        s.y[i] = cy;
      }
    }
    const shining = rand() < SHINING_SHARE;
    const size = rand();
    const lift = rand();
    const extra = rand();
    s.warm[i] = rand() < WARM_SHARE ? 1 : 0;
    s.phase[i] = rand() * TAU;
    s.omega[i] = TAU / between(2.5, 7, rand);
    s.glintPhase[i] = rand() * TAU;
    s.glintOmega[i] = TAU / between(5, 10, rand);
    if (shining) {
      s.r[i] = 1 + 0.5 * size;
      s.alpha[i] = 0.8 + 0.1 * lift;
      s.halo[i] = 7 + 6 * extra;
      s.glint[i] = 6 + 8 * rand();
    } else {
      s.r[i] = 0.4 + 0.8 * size ** 2.5;
      s.alpha[i] = Math.min(ALPHA_CAP, 0.5 + 0.28 * lift + 0.35 * ((s.r[i] - 0.4) / 0.8));
    }
  }
  return s;
}

// Brushes live in unit space and are placed with setTransform, so the frame loop allocates nothing.
function buildBrushes(ctx) {
  const glint = (rgb, vertical) => {
    const g = vertical ? ctx.createLinearGradient(0, -1, 0, 1) : ctx.createLinearGradient(-1, 0, 1, 0);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.3, `rgba(${rgb},0.2)`);
    g.addColorStop(0.5, `rgba(${rgb},1)`);
    g.addColorStop(0.7, `rgba(${rgb},0.2)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    return g;
  };
  const glow = (rgb, core, mid) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},${core})`);
    g.addColorStop(0.18, `rgba(${rgb},${mid})`);
    g.addColorStop(0.55, `rgba(${rgb},${mid * 0.22})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    return g;
  };
  const tail = ctx.createLinearGradient(0, 0, -1, 0);
  tail.addColorStop(0, "rgba(255,255,255,1)");
  tail.addColorStop(0.1, "rgba(255,246,247,0.85)");
  tail.addColorStop(0.32, "rgba(255,206,210,0.4)");
  tail.addColorStop(0.68, "rgba(255,125,135,0.13)");
  tail.addColorStop(1, "rgba(230,33,43,0)");
  return {
    glintX: [glint(WHITE, false), glint(WARM, false)],
    glintY: [glint(WHITE, true), glint(WARM, true)],
    halo: [glow(WHITE, 0.5, 0.2), glow(WARM, 0.5, 0.2)],
    tail,
    head: glow(WHITE, 0.95, 0.4),
  };
}

export default function NightSky({ density = 1, shooting = true, seed = 1, clipRef, className = "" }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const clipPathRef = useRef(null);
  const clipId = `night-sky-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [clipReady, setClipReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const stars = buildStars(seed);
    const brushes = buildBrushes(ctx);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let count = 0;
    let reduced = mq.matches;
    let inView = false;
    let docVisible = document.visibilityState === "visible";
    let clipOk = !clipRef;
    let raf = 0;
    let last = 0;
    let lastDraw = 0;
    let clock = 0; // ms of animated time; it stops while the loop is stopped, so resuming never bursts
    let nextAt = 0;
    let followAt = 0;
    let firstArmed = false;
    let syncClip = null;
    let clipObserver = null;
    let clipRaf = 0;

    // Meteor pool.
    const alive = new Uint8Array(MAX_METEORS);
    const mx = new Float64Array(MAX_METEORS);
    const my = new Float64Array(MAX_METEORS);
    const mdx = new Float64Array(MAX_METEORS);
    const mdy = new Float64Array(MAX_METEORS);
    const mspeed = new Float64Array(MAX_METEORS);
    const mtail = new Float64Array(MAX_METEORS);
    const mlife = new Float64Array(MAX_METEORS);
    const mage = new Float64Array(MAX_METEORS);

    const emit = (kind) =>
      root.dispatchEvent(new CustomEvent("nightsky:meteor", { detail: { kind, t: clock } }));

    const spawn = (kind) => {
      let slot = -1;
      for (let i = 0; i < MAX_METEORS; i++) {
        if (!alive[i]) {
          slot = i;
          break;
        }
      }
      if (slot < 0) return;
      const k = Math.min(1, Math.max(0.65, w / 900)); // small boxes get shorter, slower meteors
      const dir = Math.random() < 0.5 ? 1 : -1;
      const angle = (between(22, 42) * Math.PI) / 180;
      mdx[slot] = Math.cos(angle) * dir;
      mdy[slot] = Math.sin(angle);
      mspeed[slot] = between(500, 900) * k;
      mtail[slot] = between(90, 220) * k;
      mlife[slot] = between(0.8, 1.4);
      mage[slot] = 0;
      mx[slot] = dir > 0 ? w * between(-0.08, 0.72) : w * between(0.28, 1.08);
      my[slot] = h * (-0.04 + 0.64 * Math.random() ** 1.3);
      alive[slot] = 1;
      emit(kind);
    };

    const schedule = () => {
      if (clock >= nextAt) {
        spawn("auto");
        nextAt = clock + between(GAP_MS[0], GAP_MS[1]);
        if (Math.random() < FOLLOW_CHANCE) followAt = clock + between(FOLLOW_MS[0], FOLLOW_MS[1]);
      }
      if (followAt && clock >= followAt) {
        followAt = 0;
        spawn("follow");
      }
    };

    const drawMeteor = (i) => {
      const p = mage[i] / mlife[i];
      const env = smooth(p / 0.15) * smooth((1 - p) / 0.5) * 0.95;
      if (env <= 0.003) return;
      const length = mtail[i] * (0.4 + 0.6 * smooth(mage[i] / 0.3));
      const hx = mx[i] + mdx[i] * mspeed[i] * mage[i];
      const hy = my[i] + mdy[i] * mspeed[i] * mage[i];
      // Local frame: x runs along the flight path scaled by the tail length, y is in CSS px.
      ctx.setTransform(
        dpr * mdx[i] * length, dpr * mdy[i] * length,
        -dpr * mdy[i], dpr * mdx[i],
        dpr * hx, dpr * hy,
      );
      ctx.fillStyle = brushes.tail;
      ctx.globalAlpha = env * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -2.4);
      ctx.quadraticCurveTo(-0.3, -1.1, -1, 0);
      ctx.quadraticCurveTo(-0.3, 1.1, 0, 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = env;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.quadraticCurveTo(-0.35, -0.5, -1, 0);
      ctx.quadraticCurveTo(-0.35, 0.5, 0, 1);
      ctx.closePath();
      ctx.fill();
      ctx.setTransform(dpr * 9, 0, 0, dpr * 9, dpr * hx, dpr * hy);
      ctx.globalAlpha = env * 0.75;
      ctx.fillStyle = brushes.head;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.setTransform(dpr, 0, 0, dpr, dpr * hx, dpr * hy);
      ctx.globalAlpha = env;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, TAU);
      ctx.fill();
    };

    const draw = (animate) => {
      const t = clock / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? "#ffd7da" : "#fff";
        for (let i = 0; i < count; i++) {
          if (stars.warm[i] !== pass) continue;
          ctx.globalAlpha = animate
            ? stars.alpha[i] * (0.25 + 0.375 * (1 + Math.sin(stars.phase[i] + stars.omega[i] * t)))
            : stars.alpha[i];
          ctx.beginPath();
          ctx.arc(stars.x[i] * w, stars.y[i] * h, stars.r[i], 0, TAU);
          ctx.fill();
        }
      }
      for (let i = 0; i < count; i++) {
        const reach = stars.glint[i];
        if (!reach) continue;
        const swell = animate ? 0.5 + 0.5 * Math.sin(stars.glintPhase[i] + stars.glintOmega[i] * t) : 0.7;
        const warm = stars.warm[i];
        const px = dpr * stars.x[i] * w;
        const py = dpr * stars.y[i] * h;
        const halo = stars.halo[i] * (0.75 + 0.35 * swell);
        ctx.setTransform(dpr * halo, 0, 0, dpr * halo, px, py);
        ctx.globalAlpha = stars.alpha[i] * (0.3 + 0.5 * swell);
        ctx.fillStyle = brushes.halo[warm];
        ctx.fillRect(-1, -1, 2, 2);
        const arm = reach * (0.4 + 0.6 * swell);
        const hair = 0.45 / arm; // half a CSS px of line, in unit space
        ctx.setTransform(dpr * arm, 0, 0, dpr * arm, px, py);
        ctx.globalAlpha = stars.alpha[i] * (0.25 + 0.65 * swell);
        ctx.fillStyle = brushes.glintX[warm];
        ctx.fillRect(-1, -hair, 2, 2 * hair);
        ctx.fillStyle = brushes.glintY[warm];
        ctx.fillRect(-hair, -1, 2 * hair, 2);
      }
      for (let i = 0; i < MAX_METEORS; i++) if (alive[i]) drawMeteor(i);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };

    const frame = (ts) => {
      const dt = last ? Math.min(ts - last, MAX_FRAME_MS) : 0;
      last = ts;
      clock += dt;
      if (syncClip) syncClip();
      if (shooting) schedule();
      const sec = dt / 1000;
      for (let i = 0; i < MAX_METEORS; i++) {
        if (!alive[i]) continue;
        mage[i] += sec;
        if (mage[i] >= mlife[i]) alive[i] = 0;
      }
      if (alive[0] || alive[1] || ts - lastDraw >= IDLE_FRAME_MS) {
        lastDraw = ts;
        draw(true);
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (shooting) {
        const soon = clock + between(FIRST_MS[0], FIRST_MS[1]);
        nextAt = firstArmed ? Math.min(nextAt, soon) : soon;
        firstArmed = true;
      }
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      alive.fill(0);
      followAt = 0;
      draw(!reduced);
    };

    const sync = () => {
      const run = !reduced && inView && docVisible && clipOk && w > 0 && h > 0;
      if (run && !raf) start();
      else if (!run && raf) stop();
    };

    const resize = (width, height) => {
      w = width;
      h = height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      count = Math.min(MAX_STARS, Math.round((w * h * density) / AREA_PER_STAR));
      if (w > 0 && h > 0) draw(!reduced); // resizing wipes the bitmap
      sync();
    };

    // Clip outline: mirror the source path's `d` into the clipPath.
    if (clipRef) {
      const target = clipPathRef.current;
      let source = null;
      let copied = null;
      const copy = () => {
        const d = source.getAttribute("d") || "";
        if (d === copied) return;
        copied = d;
        target.setAttribute("d", d);
      };
      const attach = () => {
        const node = clipRef.current;
        if (!node) return;
        if (node === source) return;
        if (clipObserver) clipObserver.disconnect();
        source = node;
        clipObserver = new MutationObserver(copy);
        clipObserver.observe(node, { attributes: true, attributeFilter: ["d"] });
        copy();
      };
      let tries = 0;
      const poll = () => {
        clipRaf = 0;
        attach();
        if (source) {
          clipOk = true;
          setClipReady(true);
          syncClip = attach; // the loop re-checks each frame in case the source remounts
          sync();
        } else if (++tries < CLIP_RETRY_FRAMES) {
          clipRaf = requestAnimationFrame(poll);
        }
      };
      poll();
    }

    const onShoot = () => {
      if (shooting && raf) spawn("manual");
    };
    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      sync();
    };
    const onMotion = () => {
      reduced = mq.matches;
      if (reduced && raf) stop();
      else if (w > 0 && h > 0) draw(!reduced);
      sync();
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1].contentRect;
      resize(box.width, box.height);
    });
    const intersection = new IntersectionObserver(
      (entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        sync();
      },
      { rootMargin: "100px" },
    );
    resizeObserver.observe(root);
    intersection.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    mq.addEventListener("change", onMotion);
    root.addEventListener("nightsky:shoot", onShoot);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(clipRaf);
      raf = 0;
      resizeObserver.disconnect();
      intersection.disconnect();
      if (clipObserver) clipObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onMotion);
      root.removeEventListener("nightsky:shoot", onShoot);
    };
  }, [density, shooting, seed, clipRef]);

  return (
    <div
      ref={rootRef}
      className={`night-sky ${className}`.trim()}
      aria-hidden="true"
      data-clip={clipRef ? (clipReady ? "on" : "wait") : undefined}
      style={clipRef ? { clipPath: `url(#${clipId})` } : undefined}
    >
      <canvas ref={canvasRef} />
      {clipRef ? (
        <svg className="night-sky-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path ref={clipPathRef} transform="scale(0.01)" />
          </clipPath>
        </svg>
      ) : null}
    </div>
  );
}
