import {useEffect, useMemo, useRef, type CSSProperties} from 'react';
import {FPS, FRAME_COUNT, loadFrames, type FrameSet} from '../lib/frames';
import {clamp, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {createRemap, type Beat} from '../lib/timeRemap';
import {brand, callouts, hero} from '../content';

/**
 * Scroll progress → film seconds. Flat stretches hold a beat (goggles just on,
 * goggles alone in the dark, the three-quarter view); steep stretches play the
 * moves. The detach gets the most scroll — it's the moment.
 */
const DURATION = (FRAME_COUNT - 1) / FPS; // 20 s
const BEATS: Beat[] = [
  [0, 0],
  [0.03, 0],
  [0.17, 118 / FPS], // she pulls the goggles down
  [0.2, 118 / FPS],
  [0.24, 172 / FPS], // (the detach clip's first stretch is nearly still — pass it quickly)
  [0.37, 233 / FPS], // everything but the goggles dissolves
  [0.41, 233 / FPS],
  [0.57, 348 / FPS], // the goggles lift and turn
  [0.61, 348 / FPS],
  [0.97, DURATION], // macro along lens, outrigger, strap
  [1, DURATION],
];
const REMAP = createRemap(BEATS, DURATION);

/** Hero type and the CSS snow leave as the detach begins. */
const HERO_OUT: [number, number] = [0.19, 0.27];

type Props = {onReady: (p: number) => void};

export function Stage({onReady}: Props) {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroType = useRef<HTMLDivElement>(null);
  const snow = useRef<HTMLDivElement>(null);
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counter = useRef<HTMLDivElement>(null);

  const flakes = useMemo(
    () =>
      Array.from({length: 46}, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        size: 2 + ((i * 7) % 5),
        dur: 7 + ((i * 11) % 9),
        delay: -((i * 13) % 16),
        dx: `${((i * 17) % 60) - 20}px`,
        blur: i % 4 === 0 ? 2 : 0,
        o: 0.5 + ((i * 3) % 5) / 10,
      })),
    [],
  );

  useEffect(() => {
    const section = root.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', {alpha: false})!;
    const frames: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);
    let loaded = 0;
    let dirty = true;
    const set: FrameSet = window.innerWidth < 768 ? 'm' : 'd';
    const cancel = loadFrames(set, (i, img) => {
      frames[i] = img;
      loaded++;
      if (loaded <= 20) onReady(Math.min(1, loaded / 18));
      dirty = true;
    });

    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const nearest = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return frames[i - d]!;
        if (frames[i + d]) return frames[i + d]!;
      }
      return undefined;
    };

    // The playhead chases the remapped target but never runs slower than real time.
    let head = 0;
    let last = performance.now();
    let lastIdx = -1;
    let lastU = -1;
    let lastCounter = -1;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const {p: u, rect} = pinProgress(section);
      if (rect.bottom < 0 || rect.top > window.innerHeight || !W) return;

      const target = REMAP.at(u);
      const diff = target - head;
      const step = Math.max(1.25, Math.abs(diff) * 3.2) * dt;
      head = Math.abs(diff) <= step ? target : head + Math.sign(diff) * step;

      const idx = clamp(Math.round(head * FPS), 0, FRAME_COUNT - 1);
      if (dirty || idx !== lastIdx) {
        const img = nearest(idx);
        if (img) {
          const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
          const w = img.naturalWidth * s;
          const h = img.naturalHeight * s;
          ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
          lastIdx = idx;
          dirty = false;
        }
      }

      if (u === lastU) return;
      lastU = u;

      // Hero type + snow fade out as the detach starts.
      const k = range(u, HERO_OUT[0], HERO_OUT[1]);
      if (heroType.current) {
        heroType.current.style.opacity = String(1 - k);
        heroType.current.style.filter = k > 0.01 ? `blur(${(k * 12).toFixed(1)}px)` : 'none';
        heroType.current.style.visibility = k >= 1 ? 'hidden' : 'visible';
      }
      if (snow.current) {
        snow.current.style.opacity = String(1 - k);
        snow.current.style.visibility = k >= 1 ? 'hidden' : 'visible';
      }

      // Callouts type in and out.
      let active = -1;
      callouts.forEach((c, i) => {
        const el = calloutRefs.current[i];
        if (!el) return;
        const inK = range(u, c.at[0], c.at[0] + 0.05);
        const outK = range(u, c.at[1] - 0.03, c.at[1]);
        const vis = inK * (1 - outK);
        if (vis > 0.5) active = i;
        el.style.opacity = String(vis > 0.001 ? 1 - outK : 0);
        el.style.visibility = vis > 0.001 ? 'visible' : 'hidden';
        el.style.filter = outK > 0.01 ? `blur(${(outK * 10).toFixed(1)}px)` : 'none';
        el.querySelectorAll<HTMLElement>('[data-type]').forEach((line, j) => {
          line.style.setProperty('--t', clamp(inK * 1.6 - j * 0.12).toFixed(3));
        });
      });
      if (counter.current) {
        counter.current.style.opacity = u > 0.45 && u < 0.98 ? '1' : '0';
        if (active >= 0 && active !== lastCounter) {
          lastCounter = active;
          counter.current.querySelector('[data-n]')!.textContent = String(active + 1).padStart(2, '0');
        }
      }
    };

    const off = onFrame(tick);
    return () => {
      off();
      cancel();
      ro.disconnect();
    };
  }, [onReady]);

  const posClass: Record<string, string> = {
    tl: 'top-[16%] left-[5%]',
    tr: 'top-[16%] right-[5%] text-right items-end',
    bl: 'bottom-[12%] left-[5%]',
    br: 'bottom-[12%] right-[5%] text-right items-end',
  };

  return (
    <section ref={root} id="top" className="relative h-[1000svh] bg-ink">
      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-label="A woman in falling snow pulls her spherical ski goggles down; everything but the goggles dissolves into black, and the goggles turn and are seen up close"
        />

        {/* Falling snow over the hero */}
        <div ref={snow} data-snow aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {flakes.map((f, i) => (
            <span
              key={i}
              className="absolute top-0 rounded-full bg-white [animation:fall_var(--t)_linear_infinite]"
              style={{left: f.left, width: f.size, height: f.size, opacity: f.o, filter: f.blur ? `blur(${f.blur}px)` : undefined, animationDelay: `${f.delay}s`, '--t': `${f.dur}s`, '--dx': f.dx} as CSSProperties}
            />
          ))}
        </div>

        {/* Hero type */}
        <div ref={heroType} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-8 px-5 pb-6 md:px-8 md:pb-8">
            <div>
              <p className="mono mb-3 text-ink/70">{hero.model}</p>
              <h1 className="text-[clamp(84px,15.5vw,300px)] leading-[0.78] font-bold tracking-[-0.06em] text-ink">
                {brand.name}
                <sup className="ml-1 align-super text-[0.25em] font-medium tracking-normal">{brand.mark}</sup>
              </h1>
              <p className="mt-4 max-w-[360px] text-[14px] leading-[1.35] font-medium text-ink/80">
                {hero.tagline[0]}
                <br />
                {hero.tagline[1]}
              </p>
            </div>
            <div className="flex max-w-[260px] flex-col items-end gap-6 text-right max-md:hidden">
              <p className="text-[12.5px] leading-[1.5] text-ink/75">{hero.side}</p>
              <div className="mono flex gap-4 text-ink/60">
                {hero.markers.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Spec callouts */}
        {callouts.map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              calloutRefs.current[i] = el;
            }}
            style={{visibility: 'hidden'}}
            className={`pointer-events-none absolute flex w-[min(340px,40vw)] flex-col gap-4 text-white max-md:w-[78vw] ${posClass[c.pos]}`}
          >
            <span className="lens h-px w-16" />
            <p data-type className="type-line text-[clamp(16px,1.35vw,21px)] leading-[1.3] font-medium">
              {c.text}
            </p>
            <dl className="w-full">
              {c.table.map(([k, v]) => (
                <div key={k} data-type className="type-line mono flex justify-between gap-6 border-t border-white/15 py-2 text-white/80">
                  <dt>{k}</dt>
                  <dd className="text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <div ref={counter} className="mono pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 text-white/70 opacity-0 transition-opacity duration-500">
          <span data-n>01</span>
          <span className="lens h-px w-10" />
          <span>0{callouts.length}</span>
        </div>
      </div>
    </section>
  );
}
