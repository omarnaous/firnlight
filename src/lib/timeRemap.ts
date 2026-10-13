/**
 * Speed ramping, the way an editor does it: scroll progress (0–1) maps to
 * film time through a smooth monotone curve instead of a straight line. Flat
 * stretches of the curve are slow-motion holds on the hero beats; steep
 * stretches are fast-forwards through the travelling shots. Monotone cubic
 * (Fritsch–Carlson) interpolation keeps every ramp eased in and out and
 * guarantees the film never runs backwards while you scroll forwards.
 */

export type Beat = readonly [u: number, seconds: number];

export type Remap = {
  /** Film time in seconds for scroll progress `u`. */
  at: (u: number) => number;
  /** Playback speed at `u`, relative to the film's average (1 = even). */
  speed: (u: number) => number;
};

export function createRemap(beats: readonly Beat[], duration: number): Remap {
  const n = beats.length;
  const xs = beats.map((b) => b[0]);
  const ys = beats.map((b) => b[1]);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));

  // Tangents: harmonic-style mean of neighbouring slopes, zeroed at extrema.
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }

  const segment = (u: number) => {
    let i = 0;
    while (i < n - 2 && u > xs[i + 1]) i++;
    return i;
  };

  const at = (u: number) => {
    const x = Math.min(xs[n - 1], Math.max(xs[0], u));
    const i = segment(x);
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };

  const avg = duration / (xs[n - 1] - xs[0]);
  const speed = (u: number) => {
    const e = 0.004;
    return (at(u + e) - at(u - e)) / (2 * e) / avg;
  };

  return {at, speed};
}
