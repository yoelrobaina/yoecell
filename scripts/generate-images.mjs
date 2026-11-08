/**
 * Generador de imágenes de producto para YoeCell.
 *
 * Renderiza maquetas de teléfono en HTML/CSS y las convierte a PNG con
 * Chromium headless (sin dependencias de npm). Todos los recursos son
 * originales y no requieren archivos externos.
 *
 * Uso:  node scripts/generate-images.mjs [--force]
 *
 * Salida: assets/img/products/<slug>-{1,2,3}.png  (900x900)
 *         assets/img/og-default.png              (1200x630)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'assets/img/products');
const tmpDir = resolve(root, '.img-tmp');
const force = process.argv.includes('--force');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
  '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error('No se encontró Chromium. Define CHROME_PATH con la ruta al binario.');
}

const chrome = findChrome();
const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));

function fontFace() {
  const fontsDir = resolve(root, 'assets/fonts');
  const face = (family, weight, file) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url('file://${fontsDir}/${file}') format('woff2');}`;
  return [
    face('Sora', 600, 'sora-600-latin.woff2'),
    face('Sora', 700, 'sora-700-latin.woff2'),
    face('Sora', 800, 'sora-800-latin.woff2'),
    face('Inter', 500, 'inter-500-latin.woff2'),
    face('Inter', 700, 'inter-700-latin.woff2')
  ].join('\n');
}

function finishCss(art) {
  switch (art.finish) {
    case 'glass':
      return `background:
        linear-gradient(115deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,0) 26%),
        linear-gradient(300deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 30%),
        linear-gradient(160deg, ${art.body} 0%, ${shade(art.body, -18)} 100%);`;
    case 'metal':
      return `background:
        repeating-linear-gradient(102deg, rgba(255,255,255,.06) 0 1px, rgba(0,0,0,.05) 1px 3px),
        linear-gradient(160deg, ${shade(art.body, 14)} 0%, ${art.body} 55%, ${shade(art.body, -16)} 100%);`;
    case 'leather':
      return `background:
        radial-gradient(circle at 30% 20%, rgba(255,255,255,.10), transparent 45%),
        repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 2px, rgba(0,0,0,.04) 2px 4px),
        linear-gradient(160deg, ${shade(art.body, 10)} 0%, ${shade(art.body, -14)} 100%);`;
    default:
      return `background:
        linear-gradient(160deg, ${shade(art.body, 12)} 0%, ${art.body} 60%, ${shade(art.body, -14)} 100%);`;
  }
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:900px;height:900px;overflow:hidden;background:transparent}
.stage{position:relative;width:900px;height:900px;overflow:hidden;background:transparent;}
.band{position:absolute;inset:-30% -10%;transform:rotate(-14deg);
  background:linear-gradient(90deg, transparent 42%, rgba(255,255,255,.34) 50%, transparent 58%);}
.halo{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);width:640px;height:640px;border-radius:50%;
  background:radial-gradient(circle, var(--glow-soft) 0%, transparent 66%);}
.band.two{transform:rotate(-14deg) translateY(120px);opacity:.5}
.grain{position:absolute;inset:0;opacity:.35;
  background-image:radial-gradient(rgba(15,25,45,.09) .5px, transparent .6px);background-size:6px 6px;}
.floor{position:absolute;left:50%;bottom:78px;transform:translateX(-50%);
  width:420px;height:44px;border-radius:50%;
  background:radial-gradient(ellipse at center, rgba(11,16,23,.30) 0%, rgba(11,16,23,.10) 45%, transparent 72%);filter:blur(7px);}
.device{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);
  width:336px;height:688px;border-radius:46px;padding:11px;
  box-shadow:0 44px 70px -28px rgba(11,16,23,.48), 0 2px 0 rgba(255,255,255,.5) inset;}
.screen{position:relative;width:100%;height:100%;border-radius:36px;overflow:hidden;}
.punch{position:absolute;top:16px;left:50%;transform:translateX(-50%);
  width:20px;height:20px;border-radius:50%;background:#07090d;
  box-shadow:0 0 0 2px rgba(255,255,255,.10), inset 0 0 6px rgba(120,180,255,.35);}
.arc{position:absolute;border-radius:50%;}
.buttons{position:absolute;right:-3px;top:190px;width:3px;height:74px;border-radius:2px;background:rgba(255,255,255,.22);}
.buttons.v{top:290px;height:52px;}
.buttons.p{right:auto;left:-3px;top:120px;height:38px;}
.cam{position:absolute;top:34px;left:30px;width:132px;height:132px;border-radius:38px;
  padding:14px;background:linear-gradient(150deg, rgba(255,255,255,.16), rgba(0,0,0,.30));
  box-shadow:0 12px 26px -12px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.12);}
.lens{position:relative;width:44px;height:44px;border-radius:50%;margin:2px;
  background:radial-gradient(circle at 32% 28%, #2b3446 0%, #0a0d12 52%, #05070a 100%);
  box-shadow:inset 0 0 0 3px rgba(255,255,255,.10), 0 2px 5px rgba(0,0,0,.5);}
.lens::after{content:'';position:absolute;inset:13px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%, rgba(120,190,255,.55), transparent 60%);}
.lens.s::after{inset:16px;}
.flash{position:absolute;right:14px;bottom:16px;width:16px;height:16px;border-radius:50%;
  background:radial-gradient(circle at 40% 35%, #fff8e0, #d8c48a 60%, rgba(120,105,60,.5));}
.wordmark{position:absolute;left:0;right:0;text-align:center;color:rgba(255,255,255,.62);
  font-family:'Inter',sans-serif;font-weight:700;font-size:22px;letter-spacing:.30em;text-transform:uppercase;}
`;

function page(body, vars, extraCss = '') {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
${fontFace()}
:root{${vars}}
${BASE_CSS}
${extraCss}
</style></head><body>${body}</body></html>`;
}

function screenArt(art) {
  return `background:
    radial-gradient(120% 80% at 22% 8%, ${alpha(art.glow, .55)} 0%, transparent 55%),
    linear-gradient(168deg, ${art.glow} 0%, ${art.accent} 46%, #05070c 100%);`;
}

function frontHtml(product) {
  const art = product.art;
  const body = `
  <div class="stage" style="--glow-soft:${alpha(art.glow, .26)}">
    <div class="halo"></div><div class="band"></div><div class="band two"></div><div class="grain"></div>
    <div class="floor"></div>
    <div class="device" style="${finishCss(art)}">
      <div class="buttons p"></div><div class="buttons"></div><div class="buttons v"></div>
      <div class="screen" style="${screenArt(art)}">
        <div class="punch"></div>
        <div class="arc" style="width:520px;height:520px;left:-120px;bottom:-190px;background:linear-gradient(140deg, ${alpha('#ffffff', .34)}, transparent 62%);"></div>
        <div class="arc" style="width:300px;height:300px;right:-110px;top:120px;border:2px solid ${alpha('#ffffff', .22)};"></div>
      </div>
    </div>
  </div>`;
  return page(body, `--glow-soft:${alpha(art.glow, .22)}`);
}

function backHtml(product) {
  const art = product.art;
  const brand = product.brand === 'YoeCell' ? 'YOE CELL' : product.brand;
  const body = `
  <div class="stage" style="--glow-soft:${alpha(art.glow, .24)}">
    <div class="halo"></div><div class="band"></div><div class="grain"></div>
    <div class="floor"></div>
    <div class="device" style="${finishCss(art)}">
      <div class="buttons p"></div><div class="buttons"></div>
      <div class="cam">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div class="lens"></div><div class="lens s"></div>
          <div class="lens"></div><div class="lens s"></div>
        </div>
        <div class="flash"></div>
      </div>
      <div class="wordmark" style="bottom:120px">${brand}</div>
      <div style="position:absolute;left:0;right:0;bottom:78px;text-align:center;color:rgba(255,255,255,.28);
        font-family:'Inter',sans-serif;font-weight:500;font-size:15px;letter-spacing:.22em;text-transform:uppercase;">5G</div>
    </div>
  </div>`;
  return page(body, `--glow-soft:${alpha(art.glow, .20)}`);
}

function detailHtml(product) {
  const art = product.art;
  const body = `
  <div class="stage" style="--glow-soft:${alpha(art.glow, .32)}">
    <div class="halo"></div><div class="band"></div><div class="grain"></div>
    <div class="device" style="${finishCss(art)};transform:translate(-38%,-50%) rotate(-14deg) scale(1.35);box-shadow:0 60px 90px -30px rgba(11,16,23,.55)">
      <div class="cam" style="transform:scale(1.15)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div class="lens"></div><div class="lens s"></div>
          <div class="lens"></div><div class="lens s"></div>
        </div>
        <div class="flash"></div>
      </div>
      <div class="wordmark" style="bottom:120px">${product.brand === 'YoeCell' ? 'YOE CELL' : product.brand}</div>
    </div>
    <div style="position:absolute;right:70px;bottom:120px;width:250px;height:250px;border-radius:50%;
      background:radial-gradient(circle at 34% 30%, ${alpha(art.accent, .75)}, ${alpha(art.glow, .10)} 62%, transparent 72%);
      filter:blur(3px);"></div>
  </div>`;
  return page(body, `--glow-soft:${alpha(art.glow, .30)}`);
}

function ogHtml(products) {
  const picks = products.filter((p) => p.type === 'telefono').slice(0, 3);
  const phones = picks.map((p, i) => `
    <div class="og-phone" style="--i:${i};--body:${p.art.body};--accent:${p.art.accent};--glow:${p.art.glow}">
      <div class="og-screen"></div>
    </div>`).join('');
  const css = `
  html,body{width:1200px;height:630px}
  .og-stage{position:relative;width:1200px;height:630px;overflow:hidden;
    background:radial-gradient(760px 520px at 84% 22%, rgba(0,184,255,.30) 0%, transparent 60%),
      radial-gradient(680px 520px at 12% 108%, rgba(90,91,255,.34) 0%, transparent 62%),
      linear-gradient(140deg,#080C12 0%,#0E1520 55%,#111C2B 100%);}
  .og-grid{position:absolute;inset:0;opacity:.5;
    background-image:linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);background-size:60px 60px;}
  .og-band{position:absolute;left:-10%;top:-40%;width:130%;height:120%;transform:rotate(-16deg);
    background:linear-gradient(90deg, transparent 44%, rgba(255,255,255,.09) 50%, transparent 56%);}
  .og-copy{position:absolute;left:76px;top:104px;width:470px;}
  .og-brand{display:flex;align-items:center;gap:14px;}
  .og-mark{width:52px;height:52px;}
  .og-name{font-family:'Sora';font-weight:800;font-size:42px;color:#F3F7FF;letter-spacing:-.5px;}
  .og-kicker{margin-top:34px;font-family:'Inter';font-weight:700;font-size:15px;letter-spacing:.18em;
    text-transform:uppercase;color:#00B8FF;}
  .og-title{margin-top:16px;font-family:'Sora';font-weight:700;font-size:38px;line-height:1.16;color:#F3F7FF;max-width:460px;}
  .og-sub{margin-top:18px;font-family:'Inter';font-weight:500;font-size:19px;line-height:1.5;color:#A9B7CC;max-width:430px;}
  .og-chips{margin-top:26px;display:flex;gap:9px;flex-wrap:wrap;max-width:430px;}
  .og-chip{padding:9px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.16);
    background:rgba(255,255,255,.06);color:#D6E1F2;font-family:'Inter';font-weight:500;font-size:15px;}
  .og-phones{position:absolute;right:-110px;bottom:-190px;width:620px;height:620px;}
  .og-phone{position:absolute;width:196px;height:400px;border-radius:26px;padding:7px;
    background:linear-gradient(150deg, rgba(255,255,255,.22), rgba(255,255,255,.02)), var(--body);
    box-shadow:0 50px 80px -30px rgba(0,0,0,.75);
    transform:translate(calc(var(--i) * 142px), calc(var(--i) * -22px)) rotate(calc((var(--i) - 1) * 8deg));}
  .og-screen{width:100%;height:100%;border-radius:24px;
    background:radial-gradient(120% 80% at 25% 10%, rgba(255,255,255,.5), transparent 55%),
      linear-gradient(165deg, var(--glow), var(--accent) 48%, #05070c 100%);}
  .og-foot{position:absolute;left:76px;bottom:38px;font-family:'Inter';font-weight:500;font-size:17px;color:#8FA0B8;}
  `;
  const body = `
  <div class="og-stage">
    <div class="og-grid"></div><div class="og-band"></div>
    <div class="og-copy">
      <div class="og-brand">
        <svg class="og-mark" viewBox="0 0 48 48" fill="none">
          <rect x="14" y="3" width="20" height="42" rx="5" stroke="url(#g1)" stroke-width="2.4"/>
          <path d="M21 12l8 12h-5l4 8-9-13h5l-3-7z" fill="url(#g1)"/>
          <defs><linearGradient id="g1" x1="14" y1="3" x2="34" y2="45"><stop stop-color="#00B8FF"/><stop offset="1" stop-color="#5A5BFF"/></linearGradient></defs>
        </svg>
        <span class="og-name">YoeCell</span>
      </div>
      <div class="og-kicker">Teléfonos y accesorios</div>
      <div class="og-title">Compra con alguien que responde en WhatsApp</div>
      <div class="og-sub">Equipos nuevos y usados, garantía de una semana y entrega en la ciudad.</div>
      <div class="og-chips">
        <span class="og-chip">Garantía 7 días</span>
        <span class="og-chip">USD · CUP · Zelle · MEX · IBAN</span>
        <span class="og-chip">Accesorios incluidos</span>
      </div>
    </div>
    <div class="og-phones">${phones}</div>
    <div class="og-foot">yoecell · Datos de demostración</div>
  </div>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${fontFace()}
  *{box-sizing:border-box;margin:0;padding:0}${css}</style></head><body>${body}</body></html>`;
}

function shoot(html, outFile, width, height) {
  const tmpFile = resolve(tmpDir, `${outFile.replace(/[^a-z0-9]+/gi, '_')}.html`);
  writeFileSync(tmpFile, html, 'utf8');
  execFileSync(chrome, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--force-color-profile=srgb', '--default-background-color=00000000',
    '--virtual-time-budget=2500', `--window-size=${width},${height}`,
    `--screenshot=${outFile}`, `file://${tmpFile}`
  ], { stdio: 'ignore' });
  rmSync(tmpFile, { force: true });
}

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

let generated = 0;
for (const product of catalog.products) {
  const views = product.type === 'accesorio'
    ? [frontHtml(product)]
    : [frontHtml(product), backHtml(product), detailHtml(product)];
  const names = product.type === 'accesorio'
    ? [`${product.slug}-1.png`]
    : [`${product.slug}-1.png`, `${product.slug}-2.png`, `${product.slug}-3.png`];
  views.forEach((html, i) => {
    const out = resolve(outDir, names[i]);
    if (existsSync(out) && !force) return;
    shoot(html, out, 900, 900);
    generated += 1;
  });
}

const og = resolve(root, 'assets/img/og-default.png');
if (force || !existsSync(og)) {
  shoot(ogHtml(catalog.products), og, 1200, 630);
  generated += 1;
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`Imágenes generadas: ${generated}. Salida en assets/img/`);
