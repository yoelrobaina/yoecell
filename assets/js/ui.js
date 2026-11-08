/**
 * Componentes compartidos de YoeCell: cabecera, pie, utilidades de formato
 * y avisos flotantes. Se usan desde todas las páginas públicas.
 */
import { icon } from './icons.js';

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatUsd(amount) {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCup(amount) {
  const value = Number(amount) || 0;
  return `${value.toLocaleString('es-CU', { maximumFractionDigits: 0 })} CUP`;
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('es-CU');
}

export function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Marca de la tienda: teléfono con rayo, en trazo. */
export function brandMark() {
  return `<svg class="brand__mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="13.5" y="3" width="21" height="42" rx="5.5" stroke="url(#yoecellBrand)" stroke-width="2.2"/>
    <path d="M21.5 13.5 29 25h-4.6l3.6 7.4-8.2-12h4.4L21.5 13.5z" fill="url(#yoecellBrand)"/>
    <defs><linearGradient id="yoecellBrand" x1="13" y1="3" x2="35" y2="45" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00B8FF"/><stop offset="1" stop-color="#5A5BFF"/>
    </linearGradient></defs>
  </svg>`;
}

const NAV = [
  { href: 'index.html', label: 'Inicio', key: 'home' },
  { href: 'catalogo.html', label: 'Catálogo', key: 'catalogo' },
  { href: 'ofertas.html', label: 'Ofertas', key: 'ofertas' },
  { href: 'informacion.html', label: 'Información', key: 'informacion' },
  { href: 'contacto.html', label: 'Contacto', key: 'contacto' }
];

export function renderHeader(site, active = 'home') {
  const business = site?.business || {};
  const wa = business.whatsappDisplay || '+53 5 000 0000';
  return `
  <div class="utility">
    <div class="wrap utility__inner">
      <ul class="utility__list">
        <li class="utility__item">${icon('truck')}<span>Entrega gratis en ${escapeHtml(business.city || 'la ciudad')}</span></li>
        <li class="utility__item">${icon('shield')}<span>Garantía de 7 días por defectos de fábrica</span></li>
      </ul>
      <ul class="utility__list utility__list--secondary">
        <li class="utility__item">${icon('clock')}<span>${escapeHtml(business.hours || '')}</span></li>
        <li class="utility__item">${icon('whatsapp')}<a href="https://wa.me/${escapeHtml(business.whatsappNumber || '')}" rel="noopener">${escapeHtml(wa)}</a>${business.whatsappLabel ? `<span class="demo-tag demo-tag--light">${escapeHtml(business.whatsappLabel)}</span>` : ''}</li>
      </ul>
    </div>
  </div>
  <header class="site-header" id="site-header">
    <div class="wrap header__inner">
      <a class="brand" href="index.html" aria-label="YoeCell, inicio">
        ${brandMark()}
        <span class="brand__text">
          <span class="brand__name">YoeCell</span>
          <span class="brand__sub">Móviles y accesorios</span>
        </span>
      </a>
      <nav class="nav" id="primary-nav" aria-label="Navegación principal">
        ${NAV.map((item) => `<a class="nav__link" href="${item.href}"${item.key === active ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}
      </nav>
      <div class="header__actions">
        <form class="header-search__form" role="search" action="catalogo.html" method="get">
          <span class="header-search__icon">${icon('search')}</span>
          <label class="visually-hidden" for="header-search">Buscar teléfonos</label>
          <input class="header-search__input" id="header-search" type="search" name="q" placeholder="Buscar modelo…" autocomplete="off">
        </form>
        <a class="btn btn--sm btn--signal" href="contacto.html" aria-label="Escríbenos por WhatsApp">${icon('whatsapp')}<span>Escríbenos</span></a>
        <button class="icon-btn burger" id="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Abrir menú">${icon('list')}</button>
      </div>
    </div>
  </header>`;
}

export function renderFooter(site) {
  const business = site?.business || {};
  const payments = (site?.payments || []).map((p) => `<span class="pay-pill">${icon('wallet')}${escapeHtml(p.label)}</span>`).join('');
  const social = [
    business.facebook ? `<a href="${escapeHtml(business.facebook)}" aria-label="Facebook" target="_blank" rel="noopener">${icon('facebook')}</a>` : '',
    business.instagram ? `<a href="${escapeHtml(business.instagram)}" aria-label="Instagram" target="_blank" rel="noopener">${icon('instagram')}</a>` : '',
    business.tiktok ? `<a href="${escapeHtml(business.tiktok)}" aria-label="TikTok" target="_blank" rel="noopener">${icon('tiktok')}</a>` : ''
  ].filter(Boolean).join('');

  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html" style="margin-bottom:1rem">
            ${brandMark()}
            <span class="brand__text">
              <span class="brand__name" style="color:#fff">YoeCell</span>
              <span class="brand__sub">Móviles y accesorios</span>
            </span>
          </a>
          <p style="max-width:38ch;font-size:.93rem">${escapeHtml(business.tagline || '')}</p>
          <p style="margin-top:1rem;font-size:.9rem">${icon('pin', { size: 16 })} ${escapeHtml(business.address || '')}</p>
          <p style="font-size:.9rem">${icon('clock', { size: 16 })} ${escapeHtml(business.hours || '')}</p>
        </div>
        <div>
          <h4 class="footer__title">Tienda</h4>
          <ul class="footer__list">
            <li><a href="catalogo.html">Todos los teléfonos</a></li>
            <li><a href="catalogo.html?condicion=nuevo">Teléfonos nuevos</a></li>
            <li><a href="catalogo.html?condicion=usado">Teléfonos usados</a></li>
            <li><a href="ofertas.html">Ofertas del mes</a></li>
            <li><a href="catalogo.html?categoria=accesorios">Accesorios</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer__title">Ayuda</h4>
          <ul class="footer__list">
            <li><a href="informacion.html">Qué incluye tu compra</a></li>
            <li><a href="informacion.html#garantia">Garantía</a></li>
            <li><a href="informacion.html#pagos">Métodos de pago</a></li>
            <li><a href="informacion.html#entregas">Entregas</a></li>
            <li><a href="contacto.html">Preguntas frecuentes</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer__title">Contacto</h4>
          <ul class="footer__list">
            <li><a href="https://wa.me/${escapeHtml(business.whatsappNumber || '')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 16 })} ${escapeHtml(business.whatsappDisplay || '')}</a>${business.whatsappLabel ? `<span class="demo-tag demo-tag--light" style="margin-left:.4rem">${escapeHtml(business.whatsappLabel)}</span>` : ''}</li>
            <li><a href="mailto:${escapeHtml(business.email || '')}">${icon('mail', { size: 16 })} ${escapeHtml(business.email || '')}</a></li>
            <li>${icon('pin', { size: 16 })} ${escapeHtml(business.city || '')}</li>
          </ul>
          <div style="margin-top:1.2rem">
            <h4 class="footer__title">Métodos de pago</h4>
            <div class="pay-list">${payments}</div>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p>© ${new Date().getFullYear()} YoeCell. Sitio de demostración: precios, existencias e imágenes son de ejemplo.</p>
        <div class="footer__social">${social}</div>
      </div>
    </div>
  </footer>`;
}

/** Botón flotante de WhatsApp (visible en móvil). */
export function renderFab(site) {
  const number = site?.business?.whatsappNumber || '';
  return `<a class="fab" id="wa-fab" href="https://wa.me/${escapeHtml(number)}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
    ${icon('whatsapp', { size: 20 })}<span class="fab__label">WhatsApp</span>
  </a>`;
}

/** Aviso flotante. */
export function toast(message, type = 'ok') {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const node = document.createElement('div');
  node.className = `toast toast--${type === 'error' ? 'error' : 'ok'}`;
  node.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${escapeHtml(message)}</span>`;
  host.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 250);
  }, 4200);
}

/** Degradado de fondo según el color del producto. */
export function tintFor(product) {
  const art = product?.art || {};
  const body = art.body || '#3A3F4B';
  const glow = art.glow || '#00B8FF';
  return `linear-gradient(155deg, rgba(${hexToRgb(glow)}, .16) 0%, rgba(${hexToRgb(body)}, .10) 45%, rgba(255,255,255,0) 100%), linear-gradient(160deg, #f8fafd 0%, #e9eef7 100%)`;
}

function hexToRgb(hex) {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16) || 0;
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Activa el menú móvil y la sombra de la cabecera al hacer scroll. */
export function bindHeaderBehaviour() {
  const nav = document.getElementById('primary-nav');
  const toggle = document.getElementById('nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const fab = document.getElementById('wa-fab');
  if (fab) {
    const toggleFab = () => fab.classList.toggle('is-visible', window.scrollY > 420);
    window.addEventListener('scroll', toggleFab, { passive: true });
    toggleFab();
  }
}
