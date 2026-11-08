/**
 * API de sesión del panel de administración.
 *
 *   GET    /api/session -> estado de la sesión y modo de persistencia
 *   POST   /api/session -> iniciar sesión (contraseña del administrador)
 *   DELETE /api/session -> cerrar sesión
 */
import { attemptStatus, clearAttempts, createSessionToken, hasAdminCredentials, isProduction, readSessionToken, registerFailedAttempt, SESSION_MAX_AGE, sessionCookieName, verifyPassword } from './_lib/auth.js';
import { getCookie, json, methodNotAllowed, readJsonBody, sameOrigin, setCookie } from './_lib/http.js';
import { storageMode } from './_lib/store.js';

export default async function handler(req, res) {
  const method = req.method.toUpperCase();

  if (method === 'GET') {
    const token = getCookie(req, sessionCookieName());
    const session = readSessionToken(token);
    return json(res, 200, {
      authenticated: Boolean(session),
      storage: await storageMode(),
      credentialsConfigured: hasAdminCredentials()
    });
  }

  if (method === 'POST') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Origen no permitido.' });

    const limit = attemptStatus(req);
    if (limit.blocked) {
      return json(res, 429, { error: 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.' });
    }

    if (!hasAdminCredentials()) {
      return json(res, 503, {
        error: 'El administrador no tiene contraseña configurada. Define ADMIN_PASSWORD (o ADMIN_PASSWORD_HASH) en las variables de entorno del servidor.'
      });
    }

    const body = await readJsonBody(req);
    if (!body.ok) return json(res, 400, { error: body.error });
    const password = String(body.data.password || '');
    if (!password) return json(res, 400, { error: 'Escribe la contraseña.' });

    if (!verifyPassword(password)) {
      registerFailedAttempt(req);
      return json(res, 401, { error: 'Contraseña incorrecta.' });
    }

    clearAttempts(req);
    const token = createSessionToken();
    setCookie(res, sessionCookieName(), token, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: 'Strict',
      secure: isProduction()
    });
    return json(res, 200, { authenticated: true, storage: await storageMode() });
  }

  if (method === 'DELETE') {
    setCookie(res, sessionCookieName(), '', { maxAge: 0, httpOnly: true, sameSite: 'Strict', secure: isProduction() });
    return json(res, 200, { authenticated: false });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
}
