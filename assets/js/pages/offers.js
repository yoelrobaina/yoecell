/**
 * Página de ofertas: promociones activas y los productos incluidos en cada una.
 */
import { icon } from '../icons.js';
import { escapeHtml, formatUsd } from '../ui.js';
import { productCard } from '../products.js';
import { generalLink } from '../whatsapp.js';

export function initOffers({ site, catalog }) {
  const root = document.getElementById('offers-root');
  if (!root) return;

  const offers = (catalog.offers || []).filter((offer) => offer.active !== false);
  const products = catalog.products;

  if (!offers.length) {
    root.innerHTML = `<div class="empty-state"><h3>No hay ofertas activas ahora mismo</h3>
      <p>Deja tu consulta en WhatsApp y te avisamos en cuanto haya precios especiales.</p></div>`;
    return;
  }

  root.innerHTML = offers.map((offer) => {
    const linked = (offer.productIds || []).map((id) => products.find((p) => p.id === id)).filter(Boolean);
    const prices = linked.map((p) => p.price);
    const from = prices.length ? Math.min(...prices) : 0;
    return `
    <section class="offer-block">
      <header class="offer-block__head">
        <div>
          <span class="offer-card__badge">${icon('tag', { size: 14 })}${escapeHtml(offer.badge || 'Oferta')}</span>
          <h2 class="section__title" style="margin-top:.8rem">${escapeHtml(offer.title)}</h2>
          <p class="section__lead">${escapeHtml(offer.subtitle || '')}${offer.until ? ` · vigente hasta el ${escapeHtml(offer.until)}` : ''}</p>
        </div>
        <div class="offer-block__aside">
          <span class="offer-card__discount">-${offer.discountPercent}%</span>
          <span class="chip">Desde ${formatUsd(from)}</span>
        </div>
      </header>
      <div class="product-grid product-grid--wide">
        ${linked.map((product) => productCard(product, site)).join('')}
      </div>
      <div class="offer-block__cta">
        <a class="btn btn--signal" href="${generalLink(site, `Oferta: ${offer.title}`)}" target="_blank" rel="noopener">${icon('whatsapp')}Consultar esta oferta</a>
      </div>
    </section>`;
  }).join('');
}
