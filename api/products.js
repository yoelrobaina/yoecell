/**
 * API del catálogo (protegida con sesión de administrador).
 *
 *   GET /api/products -> catálogo almacenado
 *   PUT /api/products -> guarda el catálogo validado
 */
import { readSessionToken, sessionCookieName } from './_lib/auth.js';
import { getCookie, json, methodNotAllowed, readJsonBody, sameOrigin } from './_lib/http.js';
import { readData, storageMode, validateCatalog, writeData } from './_lib/store.js';

const CATALOG_PATH = 'data/catalog.json';

function authorized(req) {
  return Boolean(readSessionToken(getCookie(req, sessionCookieName())));
}

export default async function handler(req, res) {
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    if (!authorized(req)) return json(res, 401, { error: 'Sesión no válida.' });
    try {
      const catalog = await readData(CATALOG_PATH);
      return json(res, 200, { catalog, storage: await storageMode() });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }

  if (method === 'PUT') {
    if (!authorized(req)) return json(res, 401, { error: 'Sesión no válida.' });
    if (!sameOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });

    const body = await readJsonBody(req);
    if (!body.ok) return json(res, 400, { error: body.error });

    const result = validateCatalog(body.data);
    if (!result.ok) return json(res, 422, { error: 'Revisa los datos del formulario.', details: result.errors });

    try {
      await writeData(CATALOG_PATH, result.value);
      return json(res, 200, { ok: true, storage: await storageMode(), products: result.value.products.length });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
}
