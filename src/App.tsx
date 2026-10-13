import {useCallback, useEffect, useState} from 'react';
import {startScroll} from './lib/scroll';
import {useReducedMotion} from './hooks/useReducedMotion';
import {Stage} from './components/Stage';
import {brand, closing, concept, nav} from './content';

const media = (f: string) => `${import.meta.env.BASE_URL}media/${f}`;

export default function App() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(0);
  const [cart, setCart] = useState(0);
  const onReady = useCallback((p: number) => setReady((c) => Math.max(c, p)), []);
  useEffect(() => startScroll(reduced), [reduced]);

  return (
    <>
      {/* Preloader: lens gradient line fills while the first frames decode */}
      <div aria-hidden className={`fixed inset-0 z-[70] grid place-items-center bg-snow transition-opacity duration-700 ${ready >= 1 ? 'pointer-events-none opacity-0' : ''}`}>
        <div className="w-48">
          <p className="mono mb-3 text-center text-ink/60">{brand.name}</p>
          <div className="h-px w-full bg-ink/10">
            <div className="lens h-full origin-left transition-transform duration-300" style={{transform: `scaleX(${ready})`}} />
          </div>
        </div>
      </div>

      {/* Top bar: tiny centred nav + cart, in difference blend so it reads on snow and on black */}
      <header className="fixed inset-x-0 top-0 z-40 text-white mix-blend-difference">
        <div className="flex items-start justify-between px-5 pt-5 md:px-8">
          <a href="#top" className="mono">
            {brand.name}
          </a>
          <nav className="flex flex-col items-center gap-0.5 text-[12px] font-medium leading-tight max-md:hidden" aria-label="Primary">
            {nav.map((n) => (
              <a key={n} href="#top" className="opacity-80 hover:opacity-100">
                {n}
              </a>
            ))}
          </nav>
          <button type="button" className="mono" onClick={() => document.getElementById('buy')?.scrollIntoView({behavior: 'smooth'})}>
            + Cart ({cart})
          </button>
        </div>
      </header>

      <main>
        <Stage onReady={onReady} />

        <section id="buy" className="relative bg-ink px-5 pt-[16vh] pb-10 text-white md:px-8">
          <div className="mx-auto grid max-w-[1500px] items-end gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mono text-white/50">Model 01 — Whiteout</p>
              <h2 className="mt-4 text-[clamp(48px,7vw,124px)] leading-[0.9] font-bold tracking-[-0.05em]">
                {closing.title[0]}
                <br />
                <span className="lens-text">{closing.title[1]}</span>
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <img src={media('product.webp')} alt="Firnlight Model 01 Whiteout goggles" className="w-full rounded-2xl" loading="lazy" />
              <div className="flex items-center justify-between gap-4">
                <p className="text-[34px] font-semibold tracking-[-0.03em]">{closing.price}</p>
                <button type="button" onClick={() => setCart((c) => c + 1)} className="lens mono rounded-full px-8 py-4 text-ink transition-transform duration-300 hover:scale-[1.03]">
                  {closing.cta}
                </button>
              </div>
            </div>
          </div>
          <p className="mono mx-auto mt-[12vh] max-w-[1500px] border-t border-white/10 pt-5 text-white/40">
            © 2026 {brand.name}® · {concept}
          </p>
        </section>
      </main>
    </>
  );
}
