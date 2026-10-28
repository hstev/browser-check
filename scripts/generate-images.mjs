#!/usr/bin/env node
/**
 * Renders the social preview image, README banner and app icons from HTML templates.
 *
 *   npx playwright install chromium   # once
 *   npm run images
 *
 * Output is committed to the repo, so this only needs to run when the artwork changes.
 */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MARK = (size) => `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path d="M8 11.5A2.5 2.5 0 0 1 10.5 9h11a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 8 20.5z" fill="none" stroke="#fff" stroke-width="2"/>
  <path d="M8 13h16" stroke="#fff" stroke-width="2"/>
  <path d="m12.5 17.5 2 2 4-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CHECK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body {
    font-family: 'Noto Sans', 'Open Sans', 'Segoe UI', system-ui, sans-serif;
    color: #f1f5f9;
    background:
      radial-gradient(900px 500px at 85% 20%, rgba(99,102,241,.35), transparent 60%),
      radial-gradient(700px 400px at 0% 100%, rgba(16,185,129,.14), transparent 60%),
      linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px) 0 0 / 40px 40px,
      linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px) 0 0 / 40px 40px,
      #0b0f19;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { display: flex; height: 100%; align-items: center; gap: 56px; padding: 0 72px; }
  .copy { flex: 1 1 0; min-width: 0; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 700; letter-spacing: -.01em; }
  h1 { margin-top: 36px; font-size: 56px; line-height: 1.08; font-weight: 800; letter-spacing: -.025em; }
  h1 span { color: #a5b4fc; }
  p.sub { margin-top: 22px; font-size: 24px; line-height: 1.4; color: #94a3b8; }
  .chips { display: flex; gap: 12px; margin-top: 34px; flex-wrap: wrap; }
  .chip { padding: 9px 16px; border-radius: 999px; font-size: 18px; font-weight: 600; color: #e2e8f0;
          background: rgba(148,163,184,.12); border: 1px solid rgba(148,163,184,.22); }
  .card { width: 440px; flex: none; border-radius: 22px; padding: 26px; background: rgba(15,23,42,.85);
          border: 1px solid rgba(148,163,184,.22); box-shadow: 0 30px 80px rgba(0,0,0,.45); }
  .id { border: 2px solid rgba(99,102,241,.7); border-radius: 14px; padding: 14px 16px; background: rgba(30,27,75,.5); }
  .id small { display: block; font-size: 14px; color: #a5b4fc; font-weight: 600; }
  .id b { display: block; margin-top: 2px; font-size: 24px; letter-spacing: .01em; }
  .rows { margin-top: 14px; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 2px;
         border-bottom: 1px solid rgba(148,163,184,.14); font-size: 17px; }
  .row:last-child { border-bottom: 0; }
  .row span { color: #94a3b8; }
  .row b { display: flex; align-items: center; gap: 8px; font-weight: 600; }
  .meta { margin-top: 12px; font: 13px 'DejaVu Sans Mono', ui-monospace, monospace; color: #64748b; }
`;

function socialCard({ headline, sub, chips, rows, idLabel, footer }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>
  <div class="wrap">
    <div class="copy">
      <div class="brand">${MARK(56)} Browser Check</div>
      <h1>${headline}</h1>
      <p class="sub">${sub}</p>
      <div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
    </div>
    <div class="card">
      <div class="id"><small>${idLabel}</small><b>INC-2026-1042</b></div>
      <div class="rows">
        ${rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v} ${CHECK}</b></div>`).join('')}
      </div>
      <div class="meta">${footer}</div>
    </div>
  </div></body></html>`;
}

const ES = {
  headline: 'Información de tu navegador, <span>lista para soporte técnico.</span>',
  sub: 'Cópiala, descárgala como imagen o JSON y envíala en un clic.',
  chips: ['100 % local', 'Sin registro', 'Código abierto'],
  idLabel: 'Ticket de soporte',
  rows: [
    ['Navegador', 'Chrome 131'],
    ['Sistema operativo', 'Windows 11'],
    ['Pantalla', '1920 × 1080'],
    ['Zona horaria', 'America/Bogota'],
    ['Conexión', 'En línea'],
  ],
  footer: 'BC-7K3F-9QX2 · 2026-10-28T15:30:00Z',
};

function iconPage(size, { maskable = false } = {}) {
  // Maskable icons need the artwork inside the central 80% "safe zone".
  // Full-bleed gradient and the glyph alone; the platform applies its own mask/corners.
  const inner = maskable ? Math.round(size * 0.9) : size;
  const bg = maskable ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'transparent';
  const svg = maskable ? MARK(inner).replace(/<rect[^>]*\/>/, '') : MARK(inner);
  return `<!doctype html><html><head><style>
    html,body{margin:0;width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center}
  </style></head><body>${svg}</body></html>`;
}

const outputs = [
  { file: 'public/og-image.png', width: 1200, height: 630, html: socialCard(ES) },
  { file: 'docs/banner.png', width: 1280, height: 640, html: socialCard(ES) },
  { file: 'public/icon-192.png', width: 192, height: 192, html: iconPage(192), transparent: true },
  { file: 'public/icon-512.png', width: 512, height: 512, html: iconPage(512), transparent: true },
  { file: 'public/icon-maskable-512.png', width: 512, height: 512, html: iconPage(512, { maskable: true }) },
  // iOS ignores transparency and adds its own rounded corners, so use a solid square.
  { file: 'public/apple-touch-icon.png', width: 180, height: 180, html: iconPage(180, { maskable: true }) },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
try {
  for (const { file, width, height, html, transparent } of outputs) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    const path = resolve(root, file);
    mkdirSync(dirname(path), { recursive: true });
    await page.screenshot({ path, omitBackground: !!transparent });
    await page.close();
    console.log(`✓ ${file} (${width}×${height})`);
  }
} finally {
  await browser.close();
}
