/**
 * API de la configuración del negocio (protegida).
 * Permite cambiar el número de WhatsApp, horarios, redes y condiciones
 * desde el panel de administración.
 */
import { readSessionToken, sessionCookieName } from './_lib/auth.js';
import { getCookie, json, methodNotAllowed, readJsonBody, sameOrigin } from './_lib/http.js';
import { readData, storageMode, validateSite, writeData } from './_lib/store.js';

const SITE_PATH = 'data/site.json';

function authorized(req) {
  return Boolean(readSessionToken(getCookie(req, sessionCookieName())));
}

export default async function handler(req, res) {
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    if (!authorized(req)) return json(res, 401, { error: 'Sesión no válida.' });
    try {
      const site = await readData(SITE_PATH);
      return json(res, 200, { site, storage: await storageMode() });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }

  if (method === 'PUT') {
    if (!authorized(req)) return json(res, 401, { error: 'Sesión no válida.' });
    if (!sameOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });

    const body = await readJsonBody(req);
    if (!body.ok) return json(res, 400, { error: body.error });

    const result = validateSite(body.data);
    if (!result.ok) return json(res, 422, { error: 'Revisa los datos del formulario.', details: result.errors });

    try {
      await writeData(SITE_PATH, result.value);
      return json(res, 200, { ok: true, storage: await storageMode() });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
}
