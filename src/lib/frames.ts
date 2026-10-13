/**
 * One continuous scroll-scrubbed film as a WebP frame sequence:
 *   0–118   she pulls the goggles down onto her eyes
 *   118–233 everything but the goggles dissolves into black (goggles never move)
 *   233–348 the goggles lift toward the camera and turn to a three-quarter view
 *   348–465 macro push along the lens edge, outrigger and strap weave
 * Four shots chained frame-to-frame with a
 * 6-frame blend at each join, so the handovers are part of the footage —
 * nothing is crossfaded in code.
 * Desktop set d (16:9), phone set m (centre 3:4 crop).
 */

export const FPS = 24;
export const FRAME_COUNT = 466;
/** Film-frame boundaries of the four beats. */
export const BEAT = {heroEnd: 118, detachEnd: 233, turnEnd: 348, end: FRAME_COUNT - 1};
export type FrameSet = 'd' | 'm';

export const frameUrl = (set: FrameSet, i: number) => `${import.meta.env.BASE_URL}frames/${set}/c${String(i + 1).padStart(3, '0')}.webp`;

function loadOne(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    const done = () => resolve(img);
    img.decode().then(done, () => (img.complete ? done() : (img.onload = done)));
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
  });
}

/** Coarse-to-fine: the opening frame, then every 16th, 8th… so scrubbing works early. */
export function loadFrames(set: FrameSet, onFrame: (i: number, img: HTMLImageElement) => void) {
  const seen = new Set<number>([0]);
  const queue = [0];
  for (let s = 16; s >= 1; s /= 2)
    for (let i = 0; i < FRAME_COUNT; i += s)
      if (!seen.has(i)) {
        seen.add(i);
        queue.push(i);
      }
  if (!seen.has(FRAME_COUNT - 1)) queue.push(FRAME_COUNT - 1);
  let cancelled = false;
  const worker = async () => {
    while (!cancelled && queue.length) {
      const i = queue.shift()!;
      try {
        const img = await loadOne(frameUrl(set, i));
        if (!cancelled) onFrame(i, img);
      } catch {
        // A missing frame just means its neighbour is drawn instead.
      }
    }
  };
  for (let k = 0; k < 6; k++) void worker();
  return () => {
    cancelled = true;
  };
}
