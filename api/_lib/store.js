/**
 * Persistencia del catálogo y de la configuración.
 *
 * Dos modos, elegidos por variables de entorno:
 *
 *  1. GitHub (gratis, recomendado en Vercel): si existen GITHUB_TOKEN y
 *     GITHUB_REPO, el catálogo se guarda como commit en data/catalog.json.
 *  2. Sistema de archivos: si el directorio data/ es escribible (servidor
 *     local con `npm start` o `vercel dev`), se guarda en disco.
 *
 * Si no hay ninguno de los dos, la API responde 503 y el panel de
 * administración avisa de que debe configurar la persistencia.
 */
import { constants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo || !repo.includes('/')) return null;
  return { token, repo, branch: process.env.GITHUB_BRANCH || 'main' };
}

async function filesystemWritable() {
  try {
    await access(resolve(ROOT, 'data'), constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function storageMode() {
  if (githubConfig()) return 'github';
  if (await filesystemWritable()) return 'filesystem';
  return 'none';
}

/* ------------------------------------------------------------ GitHub --- */

async function githubRequest(url, options = {}) {
  const { token, repo } = githubConfig();
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yoecell-site',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub respondió ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function githubRead(path) {
  const { repo, branch } = githubConfig();
  try {
    const data = await githubRequest(`/repos/${repo}/contents/${path}?ref=${branch}`);
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  } catch (error) {
    if (String(error.message).includes('404')) return null;
    throw error;
  }
}

async function githubWrite(path, value) {
  const { repo, branch } = githubConfig();
  const current = await githubRead(path);
  const message = `chore(actualiza ${path}) desde el panel de YoeCell`;
  await githubRequest(`/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8').toString('base64'),
      branch,
      ...(current?.sha ? { sha: current.sha } : {})
    })
  });
}

/* -------------------------------------------------- sistema de archivos -- */

async function fsRead(path) {
  try {
    const raw = await readFile(resolve(ROOT, path), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function fsWrite(path, value) {
  await writeFile(resolve(ROOT, path), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/* ------------------------------------------------------------- API ----- */

export async function readData(path) {
  const mode = await storageMode();
  if (mode === 'github') return githubRead(path);
  if (mode === 'filesystem') return fsRead(path);
  throw new Error('Persistencia no configurada: define GITHUB_TOKEN y GITHUB_REPO, o usa el servidor local (npm start).');
}

export async function writeData(path, value) {
  const mode = await storageMode();
  if (mode === 'github') return githubWrite(path, value);
  if (mode === 'filesystem') return fsWrite(path, value);
  throw new Error('Persistencia no configurada: define GITHUB_TOKEN y GITHUB_REPO, o usa el servidor local (npm start).');
}

/* ------------------------------------------------------ validación ------ */

const LIMITS = {
  name: 90,
  description: 4000,
  shortDescription: 220,
  brand: 40,
  slug: 90
};

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Valida y normaliza el catálogo recibido del panel de administración.
 * @returns {{ok: boolean, errors: string[], value: object}}
 */
export function validateCatalog(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['El catálogo no es un objeto válido.'], value: null };
  }
  const products = Array.isArray(input.products) ? input.products : [];
  if (!products.length) errors.push('El catálogo debe tener al menos un producto.');

  const seenSlugs = new Set();
  const cleanProducts = products.map((product, index) => {
    const name = cleanText(product.name, LIMITS.name);
    if (!name) errors.push(`Producto ${index + 1}: falta el nombre.`);
    let slug = slugify(product.slug || name);
    if (!slug) slug = `producto-${index + 1}`;
    if (seenSlugs.has(slug)) slug = `${slug}-${index + 1}`;
    seenSlugs.add(slug);
    const price = toNumber(product.price, -1);
    if (price < 0) errors.push(`Producto "${name || index + 1}": el precio no es válido.`);
    const stock = Math.max(0, Math.trunc(toNumber(product.stock, 0)));
    const status = ['disponible', 'ultimas-unidades', 'agotado'].includes(product.status)
      ? product.status
      : stock > 0 ? 'disponible' : 'agotado';
    return {
      ...product,
      id: cleanText(product.id, 60) || `prd-${slug}`,
      slug,
      name,
      brand: cleanText(product.brand, LIMITS.brand) || 'YoeCell',
      category: cleanText(product.category, 40) || 'smartphones',
      type: product.type === 'accesorio' ? 'accesorio' : 'telefono',
      condition: product.condition === 'usado' ? 'usado' : 'nuevo',
      price,
      previousPrice: product.previousPrice ? toNumber(product.previousPrice, 0) : null,
      currency: 'USD',
      stock,
      status,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      ram: cleanText(product.ram, 30) || null,
      storage: cleanText(product.storage, 30) || null,
      color: cleanText(product.color, 60) || null,
      colors: Array.isArray(product.colors) ? product.colors.map((c) => cleanText(c, 60)).filter(Boolean) : [],
      shortDescription: cleanText(product.shortDescription, LIMITS.shortDescription),
      description: cleanText(product.description, LIMITS.description),
      specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
      included: Array.isArray(product.included) ? product.included.map((i) => cleanText(i, 80)).filter(Boolean) : [],
      warranty: cleanText(product.warranty, 200),
      paymentMethods: Array.isArray(product.paymentMethods)
        ? product.paymentMethods.map((p) => cleanText(p, 20)).filter(Boolean)
        : ['USD', 'CUP', 'Zelle', 'MEX', 'IBAN'],
      tags: Array.isArray(product.tags) ? product.tags.map((t) => cleanText(t, 30)).filter(Boolean) : [],
      images: Array.isArray(product.images)
        ? product.images.map((src) => cleanText(src, 300)).filter((src) => /^(https?:\/\/|\/)/.test(src)).slice(0, 8)
        : [],
      art: product.art && typeof product.art === 'object' ? product.art : { body: '#2B3038', accent: '#00B8FF', glow: '#00B8FF' },
      demo: Boolean(product.demo)
    };
  });

  const categories = (Array.isArray(input.categories) ? input.categories : []).map((category) => ({
    id: cleanText(category.id, 60) || slugify(category.name),
    name: cleanText(category.name, 60),
    slug: slugify(category.slug || category.name || category.id),
    description: cleanText(category.description, 200),
    order: toNumber(category.order, 0)
  })).filter((category) => category.name);

  const offers = (Array.isArray(input.offers) ? input.offers : []).map((offer) => ({
    id: cleanText(offer.id, 60) || `ofe-${Date.now()}`,
    title: cleanText(offer.title, 90),
    subtitle: cleanText(offer.subtitle, 160),
    productIds: Array.isArray(offer.productIds) ? offer.productIds.map((id) => cleanText(id, 60)).filter(Boolean) : [],
    discountPercent: Math.min(90, Math.max(0, Math.trunc(toNumber(offer.discountPercent, 0)))),
    badge: cleanText(offer.badge, 40) || 'Oferta',
    until: cleanText(offer.until, 20),
    active: offer.active !== false
  })).filter((offer) => offer.title);

  const brands = [...new Set([
    ...(Array.isArray(input.brands) ? input.brands : []).map((b) => cleanText(b, LIMITS.brand)),
    ...cleanProducts.map((p) => p.brand)
  ].filter(Boolean))];

  return {
    ok: errors.length === 0,
    errors,
    value: {
      demo: Boolean(input.demo),
      demoNotice: cleanText(input.demoNotice, 200),
      version: toNumber(input.version, 1),
      updatedAt: new Date().toISOString().slice(0, 10),
      categories,
      brands,
      products: cleanProducts,
      offers
    }
  };
}

/** Valida y normaliza la configuración del negocio. */
export function validateSite(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['La configuración no es un objeto válido.'], value: null };
  }
  const business = input.business || {};
  const number = String(business.whatsappNumber || '').replace(/\D/g, '');
  if (number && number.length < 8) errors.push('El número de WhatsApp debe tener al menos 8 dígitos.');

  const value = {
    demo: Boolean(input.demo),
    demoNotice: cleanText(input.demoNotice, 200),
    business: {
      name: cleanText(business.name, 60) || 'YoeCell',
      tagline: cleanText(business.tagline, 200),
      whatsappNumber: number,
      whatsappDisplay: cleanText(business.whatsappDisplay, 40),
      whatsappLabel: cleanText(business.whatsappLabel, 20),
      email: cleanText(business.email, 120),
      address: cleanText(business.address, 160),
      city: cleanText(business.city, 60),
      hours: cleanText(business.hours, 80),
      instagram: cleanText(business.instagram, 200),
      facebook: cleanText(business.facebook, 200),
      tiktok: cleanText(business.tiktok, 200)
    },
    cupRate: Math.max(0, toNumber(input.cupRate, 240)),
    cupRateNote: cleanText(input.cupRateNote, 300),
    payments: (Array.isArray(input.payments) ? input.payments : []).map((payment) => ({
      id: cleanText(payment.id, 30),
      label: cleanText(payment.label, 20),
      detail: cleanText(payment.detail, 200)
    })).filter((payment) => payment.label),
    conditions: {
      warranty: cleanText(input.conditions?.warranty, 300),
      warrantyShort: cleanText(input.conditions?.warrantyShort, 60),
      delivery: cleanText(input.conditions?.delivery, 300),
      setup: cleanText(input.conditions?.setup, 300),
      included: Array.isArray(input.conditions?.included) ? input.conditions.included.map((i) => cleanText(i, 80)) : []
    },
    faq: (Array.isArray(input.faq) ? input.faq : []).map((item) => ({
      q: cleanText(item.q, 160),
      a: cleanText(item.a, 600)
    })).filter((item) => item.q)
  };

  return { ok: errors.length === 0, errors, value };
}
