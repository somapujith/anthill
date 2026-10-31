// The silk surface shared by the home hero and page stages. All values are 0 to 1.
const SAMPLES = 64;

const smooth = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const curveY = (x, curve) => curve.ground - curve.rise * x ** curve.power;

// y for x once the curve has grown to t and lifted by the scroll flood.
export const surfaceY = (x, curve, t, lift) => {
  const grown = 1 - smooth(t - 0.1, t + 0.1, x);
  const y = 1.04 - (1.04 - curveY(x, curve)) * grown;
  return y * (1 - lift) - 0.06 * lift;
};

export function drawSurface(sky, edge, curve, t, lift) {
  const points = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = i / SAMPLES;
    points.push(
      `${(x * 100).toFixed(2)} ${(surfaceY(x, curve, t, lift) * 100).toFixed(2)}`,
    );
  }
  const line = points.join(" L");
  sky.setAttribute("d", `M0 0 L${line} L100 0 Z`);
  edge.setAttribute("d", `M${line}`);
}
