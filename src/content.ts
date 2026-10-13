/**
 * All copy lives here. FIRNLIGHT is an invented concept goggle maker for this
 * demo — the product, specs and prices are fictional.
 */

export const brand = {name: 'Firnlight', mark: '®'};
export const nav = ['Optics', 'Field notes', 'Our story'];

export const hero = {
  model: 'Model 01 — Whiteout',
  tagline: ['Spherical optics for the', 'last light on the mountain.'],
  side: 'A single toric lens, cut from one blank and mirrored in eleven layers, so flat light still shows every ridge, every drift and every edge of the run.',
  markers: ['(Drop 01)', '(Winter 26)'],
};

export type Callout = {
  /** Scroll window [in, out] in stage progress (0–1) */
  at: [number, number];
  /** Where it sits: tl, tr, bl, br */
  pos: 'tl' | 'tr' | 'bl' | 'br';
  text: string;
  table: [string, string][];
};

export const callouts: Callout[] = [
  {
    at: [0.5, 0.66],
    pos: 'tr',
    text: 'One toric lens, ground from a single blank — no seam, no distortion, a field of view that wraps past your peripheral vision.',
    table: [
      ['Field of view', '210°'],
      ['Clarity', '99%'],
      ['UV filter', '400 nm · 100%'],
    ],
  },
  {
    at: [0.68, 0.82],
    pos: 'bl',
    text: 'Eleven-layer amber-to-violet mirror tuned for flat light: contrast lifts where the snow goes grey.',
    table: [
      ['VLT', '22%'],
      ['Contrast gain', '+31%'],
      ['Anti-fog', 'Hydrophilic core'],
    ],
  },
  {
    at: [0.84, 0.97],
    pos: 'tr',
    text: 'Graphite outriggers pivot with the strap, so the seal stays even from first chair to last light.',
    table: [
      ['Frame weight', '86 g'],
      ['Strap', 'Jacquard · 45 mm'],
      ['Rating', 'EN 174 · Cat. 3'],
    ],
  },
];

export const closing = {
  title: ['See the run', 'before you ride it.'],
  price: '$290',
  cta: 'Add to cart',
};

export const concept = 'FIRNLIGHT is a concept brand made for a design study. Product, specs and price are fictional.';
