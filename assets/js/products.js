/**
 * Renderizado de tarjetas de producto y lógica de filtrado del catálogo.
 * Compartido por la página de inicio y la de catálogo.
 */
import { icon } from './icons.js';
import { escapeHtml, formatCup, formatUsd, tintFor } from './ui.js';
import { productLink } from './whatsapp.js';

export function productUrl(product) {
  return `telefono.html?id=${encodeURIComponent(product.slug)}`;
}

export function conditionBadge(product) {
  if (product.status === 'agotado' || product.stock === 0) {
    return '<span class="badge badge--out">Agotado</span>';
  }
  if (product.status === 'ultimas-unidades') {
    return '<span class="badge badge--last">Últimas unidades</span>';
  }
  if (product.condition === 'usado') return '<span class="badge badge--used">Usado</span>';
  if (product.isNew) return '<span class="badge badge--new">Nuevo</span>';
  return '';
}

export function stockLabel(product) {
  if (product.status === 'agotado' || product.stock === 0) {
    return '<span class="stock-dot stock-dot--out">Sin stock</span>';
  }
  if (product.status === 'ultimas-unidades' || product.stock <= 3) {
    return `<span class="stock-dot stock-dot--low">${product.stock} unidades</span>`;
  }
  return `<span class="stock-dot">${product.stock} unidades</span>`;
}

/**
 * Tarjeta de producto.
 * @param {object} product
 * @param {object} site configuración del negocio
 * @param {{compact?: boolean}} [options]
 */
export function productCard(product, site, options = {}) {
  const image = product.images?.[0] || '/assets/img/products/samsung-galaxy-a54-1.png';
  const chips = [product.ram, product.storage].filter(Boolean);
  const discount = product.previousPrice && product.previousPrice > product.price
    ? Math.round((1 - product.price / product.previousPrice) * 100)
    : 0;
  const waHref = productLink(product, site, { intent: 'compra' });
  const demo = product.demo ? '<span class="demo-tag">DEMO</span>' : '';

  return `
  <article class="product-card" style="--brand-tint:${tintFor(product)}" data-product-id="${escapeHtml(product.id)}">
    <div class="product-card__media">
      <div class="product-card__flags">
        ${conditionBadge(product)}
        ${discount ? `<span class="badge badge--offer">-${discount}%</span>` : ''}
        ${demo}
      </div>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="900" height="900" loading="lazy" decoding="async">
    </div>
    <div class="product-card__body">
      <span class="product-card__brand">${escapeHtml(product.brand)}</span>
      <h3 class="product-card__name"><a href="${productUrl(product)}">${escapeHtml(product.name)}</a></h3>
      ${chips.length ? `<div class="product-card__chips">${chips.map((c) => `<span class="chip">${icon('chip')}${escapeHtml(c)}</span>`).join('')}</div>` : ''}
      <div class="product-card__foot">
        <div class="price">
          ${product.previousPrice ? `<span class="price__old">${formatUsd(product.previousPrice)}</span>` : ''}
          <span class="price__now">${formatUsd(product.price)} <small>USD</small></span>
          ${site?.cupRate ? `<span class="price__cup">${formatCup(Math.round(product.price * site.cupRate))} aprox.</span>` : ''}
        </div>
        ${stockLabel(product)}
      </div>
      <div class="product-card__cta">
        <a class="btn btn--sm btn--outline btn--block" href="${waHref}" target="_blank" rel="noopener">
          ${icon('whatsapp', { size: 16 })} Consultar por WhatsApp
        </a>
      </div>
    </div>
  </article>`;
}

/** Aplica los filtros activos del catálogo. */
export function filterProducts(products, filters) {
  const term = (filters.q || '').trim().toLowerCase();
  const brands = filters.brands || [];
  const conditions = filters.conditions || [];
  const rams = filters.rams || [];
  const storages = filters.storages || [];
  const maxPrice = Number(filters.maxPrice) || 0;
  const onlyAvailable = Boolean(filters.onlyAvailable);

  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.type && product.type !== filters.type) return false;
    if (term) {
      const haystack = [product.name, product.brand, product.shortDescription, ...(product.tags || [])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (brands.length && !brands.includes(product.brand)) return false;
    if (conditions.length && !conditions.includes(product.condition)) return false;
    if (rams.length && !rams.includes(product.ram)) return false;
    if (storages.length && !storages.includes(product.storage)) return false;
    if (maxPrice && product.price > maxPrice) return false;
    if (onlyAvailable && (product.status === 'agotado' || product.stock === 0)) return false;
    return true;
  });
}

export function sortProducts(products, sort) {
  const list = [...products];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    case 'new':
      return list.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.id.localeCompare(a.id));
    case 'offers':
      return list.sort((a, b) => discountOf(b) - discountOf(a));
    default:
      return list;
  }
}

export function discountOf(product) {
  if (!product.previousPrice || product.previousPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.previousPrice) * 100);
}

/** Cuenta cuántos productos hay por marca (para los filtros). */
export function countBy(products, key) {
  const map = new Map();
  products.forEach((product) => {
    const value = key === 'brand' ? product.brand : product[key];
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
