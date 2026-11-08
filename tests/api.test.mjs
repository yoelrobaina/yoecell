/**
 * Pruebas de integración del sitio y la API de YoeCell.
 * Se ejecuta contra el servidor local real (node serve.js).
 *
 *   npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'contrasena-de-prueba';

let server;
let cookie = '';
const backups = new Map();

function backup(file) {
  const path = resolve(root, file);
  backups.set(file, existsSync(path) ? readFileSync(path) : null);
}

function restore() {
  for (const [file, content] of backups) {
    if (content === null) continue;
    writeFileSync(resolve(root, file), content);
  }
}

before(async () => {
  backup('data/catalog.json');
  backup('data/site.json');
  server = spawn(process.execPath, ['serve.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(PORT),
      ADMIN_PASSWORD: PASSWORD,
      SESSION_SECRET: 'secreto-de-pruebas-0123456789abcdef',
      NODE_ENV: 'test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor no arrancó a tiempo')), 15000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes(`http://localhost:${PORT}`)) {
        clearTimeout(timer);
        resolvePromise();
      }
    });
    server.on('error', reject);
  });
});

after(() => {
  restore();
  if (server) server.kill();
});

/* ------------------------------------------------------------- sitio --- */

test('la portada responde 200 y contiene la marca', async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /YoeCell/);
  assert.match(html, /<title>/);
});

test('las rutas amigables sirven la página correcta', async () => {
  const routes = {
    '/catalogo': 'catálogo',
    '/ofertas': 'Ofertas del mes',
    '/informacion': 'Qué incluye tu compra',
    '/contacto': 'Escríbenos'
  };
  for (const [route, expected] of Object.entries(routes)) {
    const res = await fetch(`${BASE}${route}`);
    assert.equal(res.status, 200, `Ruta ${route}`);
    const html = await res.text();
    assert.match(html, new RegExp(expected, 'i'), `Contenido esperado en ${route}`);
  }
});

test('la ruta de producto devuelve la ficha', async () => {
  const res = await fetch(`${BASE}/telefono/samsung-galaxy-a54`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Ficha de producto/);
});

test('una ruta inexistente devuelve 404 con la página de error', async () => {
  const res = await fetch(`${BASE}/no-existe-esta-pagina`);
  assert.equal(res.status, 404);
  const html = await res.text();
  assert.match(html, /no existe/i);
});

test('no se puede escapar del directorio público', async () => {
  const res = await fetch(`${BASE}/%2e%2e%2f%2e%2e%2fetc%2fpasswd`);
  assert.ok(res.status === 404 || res.status === 400, `Estado inesperado: ${res.status}`);
  const text = await res.text();
  assert.ok(!text.includes('root:'), 'La respuesta no debe contener /etc/passwd');
});

/* --------------------------------------------------------------- API --- */

test('la API informa del estado de la sesión', async () => {
  const res = await fetch(`${BASE}/api/session`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.authenticated, false);
  assert.ok(['github', 'filesystem', 'none'].includes(data.storage));
});

test('rechaza una contraseña incorrecta', async () => {
  const res = await fetch(`${BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'yoecell-admin' },
    body: JSON.stringify({ password: 'incorrecta' })
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.match(data.error, /incorrecta/i);
});

test('acepta la contraseña correcta y abre sesión', async () => {
  const res = await fetch(`${BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'yoecell-admin' },
    body: JSON.stringify({ password: PASSWORD })
  });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'Debe devolver la cookie de sesión');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  cookie = setCookie.split(';')[0];
  assert.ok(cookie.startsWith('yoecell_session='));
});

test('sin sesión no se puede leer ni escribir el catálogo', async () => {
  const getRes = await fetch(`${BASE}/api/products`);
  assert.equal(getRes.status, 401);
  const putRes = await fetch(`${BASE}/api/products`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: [] })
  });
  assert.equal(putRes.status, 401);
});

test('con sesión se puede leer y guardar el catálogo', async () => {
  const getRes = await fetch(`${BASE}/api/products`, { headers: { Cookie: cookie } });
  assert.equal(getRes.status, 200);
  const { catalog } = await getRes.json();
  assert.ok(Array.isArray(catalog.products));
  assert.ok(catalog.products.length > 0);

  const modified = JSON.parse(JSON.stringify(catalog));
  modified.products[0].price = 123;
  const putRes = await fetch(`${BASE}/api/products`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-Requested-With': 'yoecell-admin' },
    body: JSON.stringify(modified)
  });
  assert.equal(putRes.status, 200);

  const saved = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));
  assert.equal(saved.products[0].price, 123);
});

test('la API rechaza catálogos inválidos', async () => {
  const res = await fetch(`${BASE}/api/products`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-Requested-With': 'yoecell-admin' },
    body: JSON.stringify({ products: [{ name: '', price: -5 }] })
  });
  assert.equal(res.status, 422);
  const data = await res.json();
  assert.ok(Array.isArray(data.details));
});

test('la API de ajustes guarda la configuración', async () => {
  const site = JSON.parse(readFileSync(resolve(root, 'data/site.json'), 'utf8'));
  const res = await fetch(`${BASE}/api/site`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-Requested-With': 'yoecell-admin' },
    body: JSON.stringify(site)
  });
  assert.equal(res.status, 200);
});

test('cerrar sesión expira la cookie del navegador', async () => {
  const res = await fetch(`${BASE}/api/session`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'Debe enviar la cookie expirada');
  assert.match(setCookie, /yoecell_session=;/);
  assert.match(setCookie, /Max-Age=0/);
  const data = await res.json();
  assert.equal(data.authenticated, false);
});
