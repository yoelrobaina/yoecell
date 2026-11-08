/**
 * Capa de datos de YoeCell.
 *
 * El sitio público lee los archivos estáticos data/site.json y data/catalog.json.
 * El panel de administración intenta guardar mediante la API (/api/products);
 * si la API no está disponible (hosting 100 % estático) usa almacenamiento
 * local del navegador y lo indica de forma explícita en la interfaz.
 */

const LOCAL_CATALOG_KEY = 'yoecell.catalog.v1';
const LOCAL_SITE_KEY = 'yoecell.site.v1';

let sitePromise = null;
let catalogPromise = null;

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.json();
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Configuración del negocio (número de WhatsApp, pagos, condiciones, FAQ). */
export function getSite() {
  if (!sitePromise) {
    sitePromise = fetchJson('/data/site.json')
      .then((site) => {
        const local = readLocal(LOCAL_SITE_KEY);
        return local ? { ...site, ...local, business: { ...site.business, ...(local.business || {}) } } : site;
      })
      .catch(() => {
        const local = readLocal(LOCAL_SITE_KEY);
        if (local) return local;
        throw new Error('No se pudo cargar la configuración del sitio.');
      });
  }
  return sitePromise;
}

/** Catálogo de productos, categorías y ofertas. */
export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchJson('/data/catalog.json')
      .then((catalog) => {
        const local = readLocal(LOCAL_CATALOG_KEY);
        return local ? { ...catalog, ...local } : catalog;
      })
      .catch(() => {
        const local = readLocal(LOCAL_CATALOG_KEY);
        if (local) return local;
        throw new Error('No se pudo cargar el catálogo.');
      });
  }
  return catalogPromise;
}

/** Descarta la caché en memoria para releer los archivos. */
export function resetDataCache() {
  sitePromise = null;
  catalogPromise = null;
}

/** Cliente HTTP de la API de administración. */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, timeout = 12000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        'X-Requested-With': 'yoecell-admin'
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      signal: controller.signal
    });
    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'Respuesta no válida del servidor.' };
      }
    }
    return { ok: res.ok, status: res.status, data, apiAvailable: res.status !== 404 };
  } catch (error) {
    const aborted = error.name === 'AbortError';
    return { ok: false, status: 0, data: { error: aborted ? 'El servidor tardó demasiado.' : 'Sin conexión con el servidor.' }, apiAvailable: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Guarda el catálogo.
 * @returns {Promise<{mode: 'server'|'local'|'error', message: string}>}
 */
export async function saveCatalog(catalog) {
  const payload = { ...catalog, updatedAt: new Date().toISOString().slice(0, 10) };
  const res = await apiRequest('/api/products', { method: 'PUT', body: payload });
  if (res.ok) {
    writeLocal(LOCAL_CATALOG_KEY, payload);
    resetDataCache();
    return { mode: 'server', message: 'Cambios guardados en el servidor.' };
  }
  if (res.apiAvailable) {
    return { mode: 'error', message: res.data?.error || 'El servidor rechazó el guardado.' };
  }
  const stored = writeLocal(LOCAL_CATALOG_KEY, payload);
  if (!stored) return { mode: 'error', message: 'No se pudo guardar ni en el navegador (almacenamiento lleno).' };
  resetDataCache();
  return { mode: 'local', message: 'Guardado solo en este navegador: la API del servidor no está disponible.' };
}

/** Guarda los ajustes del negocio (número de WhatsApp, horarios, redes). */
export async function saveSite(site) {
  const res = await apiRequest('/api/site', { method: 'PUT', body: site });
  if (res.ok) {
    writeLocal(LOCAL_SITE_KEY, site);
    resetDataCache();
    return { mode: 'server', message: 'Ajustes guardados en el servidor.' };
  }
  if (res.apiAvailable) return { mode: 'error', message: res.data?.error || 'El servidor rechazó el guardado.' };
  const stored = writeLocal(LOCAL_SITE_KEY, site);
  if (!stored) return { mode: 'error', message: 'No se pudieron guardar los ajustes en este navegador.' };
  resetDataCache();
  return { mode: 'local', message: 'Ajustes guardados solo en este navegador.' };
}

/** Indica si existen cambios locales pendientes de subir al servidor. */
export function hasLocalChanges() {
  return Boolean(readLocal(LOCAL_CATALOG_KEY) || readLocal(LOCAL_SITE_KEY));
}
