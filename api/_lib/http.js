/**
 * Utilidades HTTP compartidas por las funciones de la API.
 * Sin dependencias externas: solo módulos nativos de Node.
 */

const MAX_BODY_BYTES = 512 * 1024;

export function json(res, status, body) {
  const payload = JSON.stringify(body ?? {});
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

export function methodNotAllowed(res, methods = ['GET']) {
  res.writeHead(405, { Allow: methods.join(', '), 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: `Método no permitido. Usa ${methods.join(' o ')}.` }));
}

/** Lee el cuerpo JSON con un límite de tamaño y devuelve { ok, data, error }. */
export function readJsonBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve({ ok: false, error: 'El contenido enviado es demasiado grande.' });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({ ok: true, data: {} });
      try {
        resolve({ ok: true, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
      } catch {
        resolve({ ok: false, error: 'El contenido no es un JSON válido.' });
      }
    });
    req.on('error', () => resolve({ ok: false, error: 'No se pudo leer la petición.' }));
  });
}

/**
 * Comprueba que las peticiones de escritura venga del mismo origen.
 * Evita que otro sitio use la sesión del administrador (CSRF).
 */
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // clientes sin Origin (curl, servidor a servidor)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Normaliza un objeto de headers de Node o de Vercel a un objeto simple. */
export function headersToObject(headers = {}) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) out[key.toLowerCase()] = value;
  return out;
}

export function getCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = raw.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined && options.maxAge !== null) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${options.sameSite || 'Strict'}`);
  if (options.secure) parts.push('Secure');
  const existing = res.getHeader('Set-Cookie');
  const cookie = parts.join('; ');
  res.setHeader('Set-Cookie', existing ? [].concat(existing, cookie) : [cookie]);
}
