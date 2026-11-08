/**
 * Servidor local de YoeCell (sin dependencias).
 *
 * Sirve el sitio estático y expone la misma API que usa Vercel, para que el
 * panel de administración funcione exactamente igual en local:
 *
 *   npm start            -> http://localhost:3000
 *
 * La contraseña del administrador se lee de ADMIN_PASSWORD. Si no existe, el
 * servidor genera una temporal y la muestra en la consola (no se guarda en el
 * repositorio ningún secreto).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import sessionHandler from './api/session.js';
import productsHandler from './api/products.js';
import siteHandler from './api/site.js';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

/** Rutas amigables: /catalogo -> catalogo.html, /telefono/<slug> -> telefono.html?id=<slug> */
const ROUTES = [
  { pattern: /^\/$/, file: 'index.html' },
  { pattern: /^\/catalogo\/?$/, file: 'catalogo.html' },
  { pattern: /^\/ofertas\/?$/, file: 'ofertas.html' },
  { pattern: /^\/informacion\/?$/, file: 'informacion.html' },
  { pattern: /^\/contacto\/?$/, file: 'contacto.html' },
  { pattern: /^\/admin\/?$/, file: 'admin.html' },
  { pattern: /^\/telefono\/([^/]+)\/?$/, file: 'telefono.html', id: (match) => decodeURIComponent(match[1]) }
];

const API = {
  '/api/session': sessionHandler,
  '/api/products': productsHandler,
  '/api/site': siteHandler
};

function safeJoin(base, target) {
  const path = normalize(join(base, target));
  if (!path.startsWith(base + sep) && path !== base) return null;
  return path;
}

async function serveFile(res, filePath, status = 200) {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not a file');
    const body = await readFile(filePath);
    res.writeHead(status, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': filePath.includes(`${sep}assets${sep}fonts${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'
    });
    res.end(body);
  } catch {
    const notFound = await readFile(join(ROOT, '404.html')).catch(() => null);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFound || '<h1>404</h1>');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  // API
  const apiHandler = API[pathname.replace(/\/$/, '')];
  if (apiHandler) {
    try {
      await apiHandler(req, res);
    } catch (error) {
      console.error('[api]', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
      }
    }
    return;
  }

  // Rutas amigables: se sirve el HTML correspondiente directamente
  for (const route of ROUTES) {
    const match = pathname.match(route.pattern);
    if (!match) continue;
    const filePath = safeJoin(ROOT, route.file);
    if (!filePath) break;
    await serveFile(res, filePath);
    return;
  }

  // Archivos estáticos
  const filePath = safeJoin(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath) {
    res.writeHead(400).end('Ruta no válida');
    return;
  }
  await serveFile(res, filePath);
});

// Nota: las rutas amigables se resuelven sirviendo el HTML correspondiente;
// el JavaScript del sitio interpreta /telefono/<slug> sin necesidad de query.

server.listen(PORT, HOST, () => {
  const generated = !process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH;
  console.log('');
  console.log('  YoeCell — servidor local');
  console.log(`  → http://localhost:${PORT}`);
  console.log('');
  if (generated) {
    const password = randomBytes(9).toString('base64url');
    process.env.ADMIN_PASSWORD = password;
    console.log('  Panel de administración: /admin');
    console.log(`  Contraseña temporal de esta ejecución: ${password}`);
    console.log('  (define ADMIN_PASSWORD en el entorno para fijarla)');
  } else {
    console.log('  Panel de administración: /admin (contraseña tomada del entorno)');
  }
  console.log('');
});
