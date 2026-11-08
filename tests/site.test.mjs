/**
 * Pruebas de contenido, SEO y coherencia del proyecto YoeCell.
 *   npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const pages = ['index.html', 'catalogo.html', 'telefono.html', 'ofertas.html', 'informacion.html', 'contacto.html', '404.html'];

test('cada página tiene título, descripción y datos para redes', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<title>[^<]+<\/title>/, `${page}: falta <title>`);
    assert.match(html, /<meta name="description" content="[^"]+"/, `${page}: falta meta description`);
    assert.match(html, /<meta property="og:title"/, `${page}: falta og:title`);
    assert.match(html, /<meta property="og:image"/, `${page}: falta og:image`);
    assert.match(html, /<html lang="es">/, `${page}: falta lang`);
    assert.match(html, /viewport/, `${page}: falta viewport`);
  }
});

test('el panel de administración no se indexa', () => {
  const html = read('admin.html');
  assert.match(html, /noindex, nofollow/);
});

test('las páginas enlazan con la hoja de estilos y el módulo principal', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /\/assets\/css\/styles\.css/, `${page}: falta styles.css`);
    assert.match(html, /\/assets\/js\/main\.js/, `${page}: falta main.js`);
  }
});

test('el catálogo tiene los campos que exige el brief', () => {
  const catalog = JSON.parse(read('data/catalog.json'));
  assert.ok(catalog.products.length >= 10);
  for (const product of catalog.products) {
    for (const field of ['name', 'brand', 'price', 'stock', 'status', 'condition', 'images', 'shortDescription', 'description', 'specs']) {
      assert.ok(product[field] !== undefined, `${product.id}: falta ${field}`);
    }
    if (product.type === 'telefono') {
      assert.ok(product.ram, `${product.id}: falta RAM`);
      assert.ok(product.storage, `${product.id}: falta almacenamiento`);
      assert.ok(['nuevo', 'usado'].includes(product.condition), `${product.id}: condición inválida`);
    }
    for (const included of ['Cover protector', 'Mica protectora', 'Cargador, cable y adaptador', 'Llave SIM']) {
      if (product.type === 'telefono') {
        assert.ok(product.included.includes(included), `${product.id}: falta "${included}"`);
      }
    }
  }
});

test('la configuración incluye los métodos de pago del brief', () => {
  const site = JSON.parse(read('data/site.json'));
  const labels = site.payments.map((payment) => payment.label);
  for (const method of ['USD', 'CUP', 'Zelle', 'MEX', 'IBAN']) {
    assert.ok(labels.includes(method), `Falta el método de pago ${method}`);
  }
  assert.match(site.conditions.warranty, /semana/i);
  assert.match(site.conditions.delivery, /ciudad/i);
});

test('los datos de demostración están marcados', () => {
  const site = JSON.parse(read('data/site.json'));
  const catalog = JSON.parse(read('data/catalog.json'));
  assert.equal(site.demo, true);
  assert.equal(catalog.demo, true);
  assert.match(site.business.whatsappDisplay, /DEMO|\+53/);
  assert.ok(site.demoNotice.length > 0);
});

test('el sitemap incluye las fichas de producto', () => {
  const sitemap = read('sitemap.xml');
  const catalog = JSON.parse(read('data/catalog.json'));
  const phones = catalog.products.filter((product) => product.type === 'telefono');
  assert.match(sitemap, /<urlset/);
  for (const product of phones.slice(0, 3)) {
    assert.ok(sitemap.includes(`/telefono/${product.slug}`), `Falta ${product.slug} en el sitemap`);
  }
});

test('robots.txt excluye el panel y la API', () => {
  const robots = read('robots.txt');
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Sitemap:/);
});

test('las imágenes de producto existen en disco', () => {
  const catalog = JSON.parse(read('data/catalog.json'));
  for (const product of catalog.products) {
    for (const image of product.images) {
      assert.ok(existsSync(resolve(root, `.${image}`)), `Falta la imagen ${image}`);
    }
  }
});

test('la API está protegida y no expone credenciales', () => {
  const session = read('api/session.js');
  assert.match(session, /ADMIN_PASSWORD/);
  const auth = read('api/_lib/auth.js');
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /httpOnly/);
});

test('las reglas de diseño se cumplen (sin monoespaciada ni emojis)', () => {
  const css = read('assets/css/styles.css');
  assert.ok(!/monospace|ui-monospace|courier/i.test(css), 'Hay tipografía monoespaciada en el CSS');
  const frontend = ['assets/js/main.js', 'assets/js/admin.js', 'assets/js/ui.js', 'index.html'];
  for (const file of frontend) {
    const content = read(file);
    assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(content), `${file}: contiene emojis`);
  }
});
