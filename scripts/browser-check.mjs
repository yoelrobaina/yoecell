/**
 * Comprobación end-to-end con navegador real (Playwright).
 *
 * Es opcional: si Playwright no está instalado, el script avisa y termina
 * sin fallar. Para usarlo:
 *
 *   npm install --save-dev playwright
 *   npm run test:e2e
 *
 * Requiere un Chromium disponible. Se busca en CHROME_PATH o en las rutas
 * habituales de Playwright y de Chrome.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT) || 4180;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = process.env.E2E_PASSWORD || 'prueba-e2e';
const SHOTS = resolve(root, '.screenshots');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('Playwright no está instalado. Ejecuta "npm install --save-dev playwright" para habilitar esta prueba.');
  process.exit(0);
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

const CATALOG_PATH = resolve(root, 'data/catalog.json');
const catalogBackup = readFileSync(CATALOG_PATH, 'utf8');
const results = [];
const consoleErrors = [];
let allowAuthErrors = false; // los 401 del intento con contraseña incorrecta son esperados

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`  ${condition ? 'ok  ' : 'FALLA'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const server = spawn(process.execPath, ['serve.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT), ADMIN_PASSWORD: PASSWORD, SESSION_SECRET: 'secreto-e2e-0123456789abcdefghijkl' },
  stdio: ['ignore', 'pipe', 'pipe']
});

await new Promise((resolvePromise, reject) => {
  const timer = setTimeout(() => reject(new Error('El servidor no arrancó')), 15000);
  server.stdout.on('data', (chunk) => {
    if (String(chunk).includes(`http://localhost:${PORT}`)) {
      clearTimeout(timer);
      resolvePromise();
    }
  });
  server.on('error', reject);
});

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: findBrowser() || undefined, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on('console', (message) => {
  if (message.type() !== 'error') return;
  if (allowAuthErrors) return;
  consoleErrors.push(`${page.url()} :: ${message.text()}`);
});
page.on('pageerror', (error) => consoleErrors.push(`${page.url()} :: ${error.message}`));

try {
  /* --------------------------------------------------------- portada -- */
  console.log('\nPortada');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('el título contiene YoeCell', (await page.title()).includes('YoeCell'));
  check('se renderiza el hero', await page.locator('.hero__title').isVisible());
  check('se muestran tarjetas de producto', (await page.locator('.product-card').count()) >= 6);
  check('la cabecera trae el menú', await page.locator('#primary-nav .nav__link').first().isVisible());
  check('el pie incluye los métodos de pago', (await page.locator('.footer__grid .pay-pill').count()) >= 5);
  const faq = page.locator('#home-faq .faq-item').first();
  await faq.locator('summary').click();
  check('la pregunta frecuente se despliega', await faq.evaluate((node) => node.hasAttribute('open')));
  await page.screenshot({ path: resolve(SHOTS, '01-portada.png'), fullPage: true });

  /* -------------------------------------------------------- catálogo -- */
  console.log('\nCatálogo');
  await page.goto(`${BASE}/catalogo`, { waitUntil: 'networkidle' });
  const total = await page.locator('#catalog-grid .product-card').count();
  check('el catálogo lista productos', total > 10, `${total} tarjetas`);
  await page.locator('#catalog-search').fill('galaxy');
  await page.waitForTimeout(500);
  const afterSearch = await page.locator('#catalog-grid .product-card').count();
  check('la búsqueda filtra resultados', afterSearch > 0 && afterSearch < total, `${afterSearch} resultados`);
  check('la búsqueda se refleja en la URL', page.url().includes('q=galaxy'));
  await page.locator('#catalog-search').fill('');
  await page.waitForTimeout(400);
  await page.locator('#filters-panel input[value="Samsung"]').check();
  await page.waitForTimeout(400);
  const samsung = await page.locator('#catalog-grid .product-card').count();
  check('el filtro de marca reduce el listado', samsung > 0 && samsung < total, `${samsung} resultados`);
  check('aparece la etiqueta del filtro activo', await page.locator('.chip-filter').first().isVisible());
  await page.locator('#catalog-sort').selectOption('price-asc');
  await page.waitForTimeout(300);
  const prices = await page.locator('#catalog-grid .price__now').allInnerTexts();
  const numbers = prices.map((text) => Number(text.replace(/[^0-9.]/g, '')));
  check('el orden por precio ascending funciona', numbers.every((value, index) => index === 0 || value >= numbers[index - 1]), numbers.slice(0, 3).join(', '));
  await page.screenshot({ path: resolve(SHOTS, '02-catalogo.png'), fullPage: false });

  /* ------------------------------------------------- ficha de producto -- */
  console.log('\nFicha de producto');
  await page.goto(`${BASE}/telefono/samsung-galaxy-a54`, { waitUntil: 'networkidle' });
  check('la ficha muestra el nombre', (await page.locator('.buybox__title').innerText()).includes('Galaxy A54'));
  check('la ficha muestra el precio', (await page.locator('.buybox__price .price__now').innerText()).includes('$'));
  const waHref = await page.locator('#wa-buy').getAttribute('href');
  check('el enlace de WhatsApp incluye el producto y el precio', waHref.includes('wa.me') && decodeURIComponent(waHref).includes('Galaxy A54') && decodeURIComponent(waHref).includes('379'));
  check('el enlace de WhatsApp incluye la variante', decodeURIComponent(waHref).includes('Awesome Graphite'));
  const variant = page.locator('#variant-list .variant').nth(1);
  await variant.click();
  const waHref2 = await page.locator('#wa-buy').getAttribute('href');
  check('cambiar de variante actualiza el mensaje', decodeURIComponent(waHref2).includes('Awesome Navy'));
  await page.locator('.gallery__thumb').nth(1).click();
  const mainSrc = await page.locator('#gallery-image').getAttribute('src');
  check('la galería cambia de imagen', mainSrc.includes('-2.png'));
  check('la tabla de especificaciones tiene filas', (await page.locator('#tab-specs tr').count()) > 5);
  await page.locator('.tab[data-tab="terms"]').click();
  check('la pestaña de condiciones se muestra', await page.locator('#tab-terms').isVisible());
  await page.screenshot({ path: resolve(SHOTS, '03-producto.png'), fullPage: true });

  /* ----------------------------------------------------------- admin -- */
  console.log('\nPanel de administración');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check('se muestra el inicio de sesión', await page.locator('#admin-login').isVisible());
  await page.locator('#login-password').fill('incorrecta');
  allowAuthErrors = true;
  await page.locator('#login-submit').click();
  await page.waitForTimeout(600);
  allowAuthErrors = false;
  check('una contraseña incorrecta muestra error', (await page.locator('#login-error').innerText()).length > 0);

  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-submit').click();
  await page.waitForSelector('#admin-app:not([hidden])', { timeout: 10000 });
  check('el acceso con contraseña correcta entra al panel', await page.locator('#admin-app').isVisible());
  check('el resumen muestra estadísticas', (await page.locator('.stat').count()) >= 4);

  await page.locator('.admin-nav__item[data-view="products"]').click();
  await page.waitForTimeout(300);
  const rows = await page.locator('#admin-main .admin-table tbody tr').count();
  check('la tabla de productos lista el catálogo', rows > 10, `${rows} filas`);

  const priceInput = page.locator('#admin-main .admin-table tbody tr').first().locator('input[data-field="price"]');
  const originalPrice = await priceInput.inputValue();
  await priceInput.fill(String(Number(originalPrice) + 11));
  await priceInput.press('Enter');
  await page.waitForTimeout(700);
  const changed = await page.locator('#admin-main .admin-table tbody tr').first().locator('input[data-field="price"]').inputValue();
  check('el precio se puede cambiar en línea', changed === String(Number(originalPrice) + 11), `valor ${changed} (antes ${originalPrice})`);

  await page.locator('.admin-nav__item[data-view="inventory"]').click();
  await page.waitForTimeout(300);
  const stockRow = page.locator('#admin-main .admin-table tbody tr', { hasText: 'Galaxy A15' });
  const stockBefore = (await stockRow.locator('td').nth(2).innerText()).trim();
  await stockRow.locator('[data-action="stock"][data-delta="1"]').click();
  await page.waitForTimeout(800);
  const stockAfter = (await page.locator('#admin-main .admin-table tbody tr', { hasText: 'Galaxy A15' }).locator('td').nth(2).innerText()).trim();
  check('el inventario permite ajustar existencias', stockAfter !== stockBefore, `${stockBefore} -> ${stockAfter}`);

  await page.locator('.admin-nav__item[data-view="products"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-action="add-product"]').first().click();
  await page.waitForSelector('#modal-form');
  await page.locator('#p-name').fill('Teléfono de prueba E2E');
  await page.locator('#p-brand').fill('Samsung');
  await page.locator('#p-price').fill('199');
  await page.locator('#p-stock').fill('2');
  await page.locator('#modal-form button[type="submit"]').click();
  await page.waitForTimeout(900);
  const found = await page.locator('#admin-main').innerText();
  check('se puede añadir un teléfono', found.includes('Teléfono de prueba E2E'));
  await page.screenshot({ path: resolve(SHOTS, '04-admin.png'), fullPage: false });

  page.once('dialog', (dialog) => dialog.accept());
  const row = page.locator('#admin-main .admin-table tbody tr', { hasText: 'Teléfono de prueba E2E' });
  await row.locator('[data-action="delete-product"]').click();
  await page.waitForTimeout(900);
  const afterDelete = await page.locator('#admin-main').innerText();
  check('se puede eliminar un teléfono', !afterDelete.includes('Teléfono de prueba E2E'));

  await page.locator('.admin-nav__item[data-view="settings"]').click();
  await page.waitForTimeout(300);
  check('los ajustes muestran el número de WhatsApp', (await page.locator('#site-wa').inputValue()).length > 0);

  /* ----------------------------------------------------------- móvil -- */
  console.log('\nMóvil (390x844)');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', (error) => consoleErrors.push(`móvil :: ${error.message}`));
  await mobilePage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('el botón de menú aparece en móvil', await mobilePage.locator('#nav-toggle').isVisible());
  await mobilePage.locator('#nav-toggle').click();
  check('el menú móvil se abre', await mobilePage.locator('#primary-nav').evaluate((node) => node.classList.contains('is-open')));
  await mobilePage.screenshot({ path: resolve(SHOTS, '05-movil-portada.png'), fullPage: false });
  await mobilePage.goto(`${BASE}/catalogo`, { waitUntil: 'networkidle' });
  await mobilePage.locator('#filters-toggle').click();
  await mobilePage.waitForTimeout(400);
  check('el panel de filtros se abre en móvil', await mobilePage.locator('#filters-panel').evaluate((node) => node.getAttribute('data-open') === 'true'));
  await mobilePage.screenshot({ path: resolve(SHOTS, '06-movil-catalogo.png'), fullPage: false });
  await mobile.close();

  console.log('\nErrores de consola detectados:');
  if (consoleErrors.length === 0) console.log('  ninguno');
  else consoleErrors.forEach((error) => console.log(`  ${error}`));
  check('no hay errores de consola', consoleErrors.length === 0, `${consoleErrors.length} errores`);
} finally {
  writeFileSync(CATALOG_PATH, catalogBackup);
  await browser.close();
  server.kill();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas.`);
if (failed.length) {
  console.log('Fallaron:');
  failed.forEach((result) => console.log(`  - ${result.name} ${result.detail}`));
  process.exit(1);
}
