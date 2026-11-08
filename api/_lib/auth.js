/**
 * Autenticación del panel de administración.
 *
 * - La contraseña vive SOLO en variables de entorno del servidor
 *   (ADMIN_PASSWORD o ADMIN_PASSWORD_HASH). Nunca en el código del frontend.
 * - La sesión es una cookie httpOnly firmada con HMAC-SHA256 (SESSION_SECRET).
 * - Se aplica un límite de intentos por IP para frenar ataques de fuerza bruta.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'yoecell_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const MAX_ATTEMPTS = 6;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

const attempts = new Map();

export function isProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

/** Secreto de firma. En producción es obligatorio; en local se genera uno efímero. */
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProduction()) {
    throw new Error('SESSION_SECRET no está definido. Configúralo en el panel de Vercel (valor aleatorio de 32 caracteres o más).');
  }
  if (!globalThis.__yoecellEphemeralSecret) {
    globalThis.__yoecellEphemeralSecret = randomBytes(32).toString('hex');
    console.warn('[YoeCell] SESSION_SECRET no definido: se usa un secreto temporal para esta sesión de desarrollo.');
  }
  return globalThis.__yoecellEphemeralSecret;
}

/** Hash scrypt con sal, formato: scrypt$<sal-hex>$<hash-hex> */
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyScrypt(password, stored) {
  const [, salt, hash] = String(stored).split('$');
  if (!salt || !hash) return false;
  const derived = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Comprueba la contraseña contra ADMIN_PASSWORD_HASH o ADMIN_PASSWORD. */
export function verifyPassword(password) {
  if (!password || typeof password !== 'string') return false;
  const hashed = process.env.ADMIN_PASSWORD_HASH;
  if (hashed) return verifyScrypt(password, hashed);
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  const a = Buffer.from(plain);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hasAdminCredentials() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);
}

/** Firma y crea el token de sesión. */
export function createSessionToken() {
  const payload = JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

/** Valida el token de sesión y devuelve sus datos o null. */
export function readSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

/* --------------------------------------------------- límite de intentos --- */

function clientKey(req) {
  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim()
    || headers['x-real-ip'] || 'local';
  return ip;
}

export function attemptStatus(req) {
  const key = clientKey(req);
  const entry = attempts.get(key);
  if (!entry) return { blocked: false, remaining: MAX_ATTEMPTS };
  if (Date.now() - entry.first > ATTEMPT_WINDOW_MS) {
    attempts.delete(key);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }
  return { blocked: entry.count >= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - entry.count) };
}

export function registerFailedAttempt(req) {
  const key = clientKey(req);
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(req) {
  attempts.delete(clientKey(req));
}
