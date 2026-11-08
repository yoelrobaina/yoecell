/**
 * Página de inicio: producto destacado, novedades, ofertas, accesorios y dudas.
 */
import { icon } from '../icons.js';
import { escapeHtml, formatCup, formatUsd, tintFor } from '../ui.js';
import { countBy, productCard, productUrl } from '../products.js';
import { generalLink, productLink } from '../whatsapp.js';

function renderRail(products, site) {
  if (!products.length) {
    return '<p class="section__lead">No hay productos para mostrar en esta sección todavía.</p>';
  }
  return `<div class="rail">${products.map((product) => productCard(product, site)).join('')}</div>`;
}

export function initHome({ site, catalog }) {
  const phones = catalog.products.filter((p) => p.type === 'telefono');
  const accessories = catalog.products.filter((p) => p.type === 'accesorio');
  const cupRate = site.cupRate || 0;

  // Producto destacado del hero
  const spotlight = phones.find((p) => p.featured && p.stock > 0) || phones[0];
  if (spotlight) {
    const image = document.getElementById('hero-device-image');
    const name = document.getElementById('hero-device-name');
    const meta = document.getElementById('hero-device-meta');
    const price = document.getElementById('hero-device-price');
    const link = document.getElementById('hero-device-link');
    const stage = document.getElementById('hero-stage');
    if (image) {
      image.src = spotlight.images[0];
      image.alt = spotlight.name;
    }
    if (name) name.textContent = spotlight.name;
    if (meta) meta.textContent = [spotlight.ram, spotlight.storage, spotlight.condition === 'nuevo' ? 'Nuevo' : 'Usado'].filter(Boolean).join(' · ');
    if (price) price.textContent = formatUsd(spotlight.price);
    if (link) link.href = productUrl(spotlight);
    if (stage) stage.style.setProperty('--brand-tint', tintFor(spotlight));
  }

  // WhatsApp general del hero
  document.querySelectorAll('[data-wa-general]').forEach((node) => {
    node.href = generalLink(site, node.dataset.waGeneral || 'Consulta general');
  });

  // Marcas
  const brands = document.getElementById('brand-rail');
  if (brands) {
    const counts = countBy(phones, 'brand');
    brands.innerHTML = counts
      .map(([brand, count]) => `<a class="brandrail__item" href="catalogo.html?marca=${encodeURIComponent(brand)}">${escapeHtml(brand)}<span style="color:var(--text-mute);font-weight:500"> ${count}</span></a>`)
      .join('');
  }

  // Destacados
  const featured = document.getElementById('home-featured');
  if (featured) {
    const list = phones.filter((p) => p.featured).slice(0, 6);
    featured.innerHTML = renderRail(list.length ? list : phones.slice(0, 6), site);
  }

  // Novedades
  const news = document.getElementById('home-new');
  if (news) {
    const list = [...phones].sort((a, b) => Number(b.isNew) - Number(a.isNew)).slice(0, 6);
    news.innerHTML = renderRail(list, site);
  }

  // Ofertas
  const offers = document.getElementById('home-offers');
  if (offers) {
    const active = (catalog.offers || []).filter((o) => o.active !== false);
    offers.innerHTML = active
      .map((offer) => {
        const linked = (offer.productIds || [])
          .map((id) => phones.find((p) => p.id === id))
          .filter(Boolean);
        const first = linked[0];
        return `
        <article class="offer-card">
          <span class="offer-card__badge">${icon('tag', { size: 14 })}${escapeHtml(offer.badge || 'Oferta')}</span>
          <h3>${escapeHtml(offer.title)}</h3>
          <p>${escapeHtml(offer.subtitle || '')}${first ? ` · desde ${formatUsd(Math.min(...linked.map((p) => p.price)))}` : ''}</p>
          <div class="offer-card__foot">
            <span class="offer-card__discount">-${offer.discountPercent}%</span>
            <a class="btn btn--sm btn--outline" href="catalogo.html?oferta=${encodeURIComponent(offer.id)}">Ver productos</a>
          </div>
        </article>`;
      })
      .join('');
  }

  // Accesorios
  const acc = document.getElementById('home-accessories');
  if (acc) {
    acc.innerHTML = accessories.slice(0, 4).map((product) => productCard(product, site)).join('');
  }

  // Valores de compra
  const values = document.getElementById('home-values');
  if (values) {
    const items = [
      { icon: 'package', title: 'Todo incluido', text: 'Cover, mica, cargador con cable y adaptador, y llave SIM en cada teléfono.' },
      { icon: 'shield', title: '7 días de garantía', text: 'Una semana de garantía por defectos de fábrica en cada equipo.' },
      { icon: 'truck', title: 'Entrega en la ciudad', text: 'Entrega gratuita dentro de la ciudad y envío a otros municipios.' },
      { icon: 'wallet', title: 'Cinco formas de pago', text: 'USD, CUP, Zelle, MEX e IBAN para que pagues como prefieras.' }
    ];
    values.innerHTML = items
      .map((item) => `<div class="value-card">
        <span class="value-card__icon">${icon(item.icon)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </div>`)
      .join('');
  }

  // Preguntas frecuentes
  const faq = document.getElementById('home-faq');
  if (faq) {
    faq.innerHTML = (site.faq || [])
      .map((item) => `<details class="faq-item">
        <summary>${escapeHtml(item.q)}${icon('plus')}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`)
      .join('');
  }

  // Bloque final de contacto
  const cta = document.getElementById('cta-band');
  if (cta) {
    const priceExample = phones.length ? formatUsd(Math.min(...phones.map((p) => p.price))) : '';
    cta.innerHTML = `
      <div>
        <h2>¿Lo encontramos hoy mismo?</h2>
        <p>Escríbenos con el modelo que te interesa y te confirmamos disponibilidad, precio y forma de entrega. ${priceExample ? `Desde ${priceExample}.` : ''} Atención de ${escapeHtml(site.business?.hours || '')}.</p>
      </div>
      <div class="cta-band__actions">
        <a class="btn btn--signal btn--lg" href="${generalLink(site, 'Consultar disponibilidad y precio')}" target="_blank" rel="noopener">${icon('whatsapp')}Escribir por WhatsApp</a>
        <a class="btn btn--ghost-light btn--lg" href="catalogo.html">Ver catálogo</a>
      </div>`;
  }

  // Precio en CUP de ejemplo en la sección de novedades
  document.querySelectorAll('[data-cup-rate]').forEach((node) => {
    node.textContent = formatCup(cupRate);
  });
}
