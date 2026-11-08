/**
 * Página de producto: galería, ficha técnica, condiciones de compra,
 * mensajes de WhatsApp con la variante elegida y botones de compartir.
 */
import { icon } from '../icons.js';
import { escapeHtml, formatCup, formatUsd, tintFor } from '../ui.js';
import { productCard } from '../products.js';
import { generalLink, productLink, waUrl } from '../whatsapp.js';

function currentSlug() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('id') || params.get('slug');
  if (fromQuery) return fromQuery;
  const match = window.location.pathname.match(/\/telefono\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function setMeta(selector, attr, value) {
  const node = document.querySelector(selector);
  if (node && value) node.setAttribute(attr, value);
}

export function initProduct({ site, catalog }) {
  const root = document.getElementById('product-root');
  if (!root) return;

  const slug = currentSlug();
  const product = catalog.products.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    root.innerHTML = `<div class="empty-state">
      <h3>No encontramos ese teléfono</h3>
      <p>Puede que el equipo ya no esté disponible. Mira el catálogo o escríbenos por WhatsApp y te ayudamos a encontrar uno similar.</p>
      <p style="margin-top:1.2rem;display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center">
        <a class="btn btn--signal" href="catalogo.html">Ver catálogo</a>
        <a class="btn btn--outline" href="${generalLink(site, 'Busco un teléfono específico')}" target="_blank" rel="noopener">${icon('whatsapp')}Escribir</a>
      </p>
    </div>`;
    document.title = 'Producto no encontrado · YoeCell';
    return;
  }

  const cupRate = site.cupRate || 0;
  const images = product.images?.length ? product.images : ['/assets/img/products/samsung-galaxy-a54-1.png'];
  const variants = product.colors?.length ? product.colors : [product.color].filter(Boolean);
  let selectedVariant = variants[0] || '';
  let quantity = 1;

  document.title = `${product.name} — ${formatUsd(product.price)} USD | YoeCell`;
  setMeta('meta[name="description"]', 'content', `${product.shortDescription} Precio ${formatUsd(product.price)} USD. ${product.condition === 'nuevo' ? 'Nuevo' : 'Usado'}, con garantía de 7 días, accesorios incluidos y entrega en la ciudad.`);
  setMeta('meta[property="og:title"]', 'content', `${product.name} | YoeCell`);
  setMeta('meta[property="og:description"]', 'content', product.shortDescription);
  setMeta('meta[property="og:image"]', 'content', images[0]);
  setMeta('meta[property="og:url"]', 'content', window.location.href);
  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMeta('meta[name="twitter:image"]', 'content', images[0]);

  const structured = document.createElement('script');
  structured.type = 'application/ld+json';
  structured.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.shortDescription,
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: window.location.href
    }
  });
  document.head.appendChild(structured);

  const availability = product.stock > 0
    ? (product.status === 'ultimas-unidades'
      ? `<span class="badge badge--last">Últimas unidades: ${product.stock}</span>`
      : `<span class="badge badge--new">Disponible: ${product.stock} unidades</span>`)
    : '<span class="badge badge--out">Agotado por ahora</span>';

  root.innerHTML = `
  <nav class="breadcrumb" aria-label="Ruta de navegación">
    <ol>
      <li><a href="index.html">Inicio</a></li>
      <li><a href="catalogo.html">Catálogo</a></li>
      <li><a href="catalogo.html?marca=${encodeURIComponent(product.brand)}">${escapeHtml(product.brand)}</a></li>
      <li aria-current="page">${escapeHtml(product.name)}</li>
    </ol>
  </nav>

  <div class="pdp">
    <div class="pdp__media">
      <div class="gallery__main" id="gallery-main" style="--brand-tint:${tintFor(product)}">
        <img id="gallery-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}" width="900" height="900">
      </div>
      ${images.length > 1 ? `<div class="gallery__thumbs" id="gallery-thumbs">
        ${images.map((src, index) => `<button class="gallery__thumb" type="button" data-src="${escapeHtml(src)}" aria-current="${index === 0}" aria-label="Ver imagen ${index + 1}"><img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)} vista ${index + 1}" width="160" height="160" loading="lazy"></button>`).join('')}
      </div>` : ''}
      <ul class="pdp__highlights">
        <li>${icon('package')} Cover, mica, cargador con cable y llave SIM incluidos</li>
        <li>${icon('shield')} Una semana de garantía por defectos de fábrica</li>
        <li>${icon('truck')} Entrega gratuita dentro de la ciudad</li>
      </ul>
    </div>

    <div class="buybox">
      <span class="buybox__brand">${escapeHtml(product.brand)}</span>
      <h1 class="buybox__title">${escapeHtml(product.name)}</h1>
      <p class="buybox__desc">${escapeHtml(product.shortDescription)}</p>

      <div class="buybox__meta">
        ${availability}
        <span class="badge">${product.condition === 'nuevo' ? 'Nuevo' : 'Usado'}</span>
        ${product.ram ? `<span class="badge">${escapeHtml(product.ram)} RAM</span>` : ''}
        ${product.storage ? `<span class="badge">${escapeHtml(product.storage)}</span>` : ''}
        ${product.demo ? '<span class="demo-tag">Datos demo</span>' : ''}
      </div>

      <div class="buybox__price">
        <div class="price">
          ${product.previousPrice ? `<span class="price__old">${formatUsd(product.previousPrice)}</span>` : ''}
          <span class="price__now">${formatUsd(product.price)} <small>USD</small></span>
          ${cupRate ? `<span class="price__cup">Aproximado ${formatCup(Math.round(product.price * cupRate))} · la tasa se confirma antes de pagar</span>` : ''}
        </div>
      </div>

      ${variants.length > 1 ? `
      <div class="variant-group">
        <div class="variant-group__label">Color disponible: <strong id="variant-name">${escapeHtml(selectedVariant)}</strong></div>
        <div class="variant-list" id="variant-list">
          ${variants.map((variant, index) => `<button class="variant" type="button" data-variant="${escapeHtml(variant)}" aria-pressed="${index === 0}">${escapeHtml(variant)}</button>`).join('')}
        </div>
      </div>` : ''}

      <div class="buybox__actions">
        <a class="btn btn--signal btn--lg btn--block" id="wa-buy" href="#" target="_blank" rel="noopener">${icon('whatsapp')}Comprar por WhatsApp</a>
        <div class="buybox__actions-row">
          <a class="btn btn--outline" id="wa-ask" href="#" target="_blank" rel="noopener">${icon('whatsapp')}Consultar dudas</a>
          <button class="btn btn--outline" type="button" id="share-native">${icon('share')}Compartir</button>
        </div>
      </div>

      <div class="share-row" style="margin-top:1rem">
        <span class="chip">Compartir</span>
        <button class="share-btn" type="button" data-share="whatsapp" aria-label="Compartir por WhatsApp">${icon('whatsapp')}</button>
        <button class="share-btn" type="button" data-share="facebook" aria-label="Compartir en Facebook">${icon('facebook')}</button>
        <button class="share-btn" type="button" data-share="copy" aria-label="Copiar enlace">${icon('copy')}</button>
      </div>

      <div class="buybox__blocks">
        <div class="buybox__block">
          <h3>Formas de pago</h3>
          <div class="pay-list">${(product.paymentMethods || site.payments.map((p) => p.label)).map((method) => `<span class="pay-pill">${icon('wallet')}${escapeHtml(method)}</span>`).join('')}</div>
        </div>
        <div class="buybox__block">
          <h3>Qué incluye tu compra</h3>
          <ul class="info-list">
            ${(product.included || []).map((item) => `<li class="info-list__row">${icon('check')}${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </div>

  <section class="pdp__details">
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-tab="specs">Especificaciones</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="description">Descripción</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="terms">Condiciones de compra</button>
    </div>
    <div class="tab-panel" id="tab-specs">
      <table class="spec-table">
        <caption class="visually-hidden">Especificaciones técnicas de ${escapeHtml(product.name)}</caption>
        <tbody>
          ${Object.entries(product.specs || {}).map(([key, value]) => `<tr><th scope="row">${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="tab-panel" id="tab-description" hidden>
      <p>${escapeHtml(product.description)}</p>
    </div>
    <div class="tab-panel" id="tab-terms" hidden>
      <ul class="info-list">
        <li class="info-list__row">${icon('shield')}${escapeHtml(product.warranty || site.conditions.warranty)}</li>
        <li class="info-list__row">${icon('truck')}${escapeHtml(site.conditions.delivery)}</li>
        <li class="info-list__row">${icon('settings')}${escapeHtml(site.conditions.setup)}</li>
        <li class="info-list__row">${icon('wallet')}Pagos en ${escapeHtml((product.paymentMethods || []).join(', '))}.</li>
      </ul>
    </div>
  </section>

  <section class="section section--tight">
    <div class="section__head">
      <div>
        <span class="eyebrow">También te puede interesar</span>
        <h2 class="section__title">Teléfonos de la misma gama</h2>
      </div>
      <a class="section__link" href="catalogo.html">Ver todo el catálogo ${icon('arrowRight')}</a>
    </div>
    <div class="product-grid" id="related-grid"></div>
  </section>`;

  // --- galería ---------------------------------------------------------------
  const thumbs = document.getElementById('gallery-thumbs');
  const mainImage = document.getElementById('gallery-image');
  if (thumbs && mainImage) {
    thumbs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-src]');
      if (!button) return;
      mainImage.src = button.dataset.src;
      thumbs.querySelectorAll('.gallery__thumb').forEach((item) => item.setAttribute('aria-current', String(item === button)));
    });
  }

  // --- variantes y mensajes --------------------------------------------------
  const variantButtons = document.getElementById('variant-list');
  const variantName = document.getElementById('variant-name');
  const buyLink = document.getElementById('wa-buy');
  const askLink = document.getElementById('wa-ask');

  function refreshLinks() {
    const options = { variant: selectedVariant, cupRate };
    if (buyLink) buyLink.href = productLink(product, site, { ...options, intent: 'compra' });
    if (askLink) askLink.href = productLink(product, site, { ...options, intent: 'consulta' });
  }

  if (variantButtons) {
    variantButtons.addEventListener('click', (event) => {
      const button = event.target.closest('[data-variant]');
      if (!button) return;
      selectedVariant = button.dataset.variant;
      variantButtons.querySelectorAll('.variant').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      if (variantName) variantName.textContent = selectedVariant;
      refreshLinks();
    });
  }
  refreshLinks();

  // --- pestañas --------------------------------------------------------------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.hidden = panel.id !== `tab-${tab.dataset.tab}`;
      });
    });
  });

  // --- compartir -------------------------------------------------------------
  const shareText = `${product.name} — ${formatUsd(product.price)} USD`;
  const shareUrl = window.location.href;
  document.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const kind = button.dataset.share;
      if (kind === 'whatsapp') {
        window.open(waUrl(`Mira este teléfono en YoeCell: ${shareText} ${shareUrl}`, site.business.whatsappNumber), '_blank', 'noopener');
      } else if (kind === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
      } else if (kind === 'copy') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          const label = button.getAttribute('aria-label');
          button.setAttribute('aria-label', 'Enlace copiado');
          setTimeout(() => button.setAttribute('aria-label', label), 2000);
        } catch {
          window.prompt('Copia el enlace:', shareUrl);
        }
      }
    });
  });

  const nativeShare = document.getElementById('share-native');
  if (nativeShare) {
    nativeShare.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: product.name, text: shareText, url: shareUrl });
        } catch {
          /* el usuario canceló */
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          nativeShare.innerHTML = `${icon('check')}Enlace copiado`;
          setTimeout(() => { nativeShare.innerHTML = `${icon('share')}Compartir`; }, 2200);
        } catch {
          window.prompt('Copia el enlace:', shareUrl);
        }
      }
    });
  }

  // --- relacionados ----------------------------------------------------------
  const related = document.getElementById('related-grid');
  if (related) {
    const list = catalog.products
      .filter((p) => p.type === product.type && p.id !== product.id && p.brand === product.brand)
      .slice(0, 4);
    const fallback = catalog.products.filter((p) => p.type === product.type && p.id !== product.id).slice(0, 4);
    const finalList = list.length >= 3 ? list : fallback;
    related.innerHTML = finalList.map((item) => productCard(item, site)).join('');
  }
}
