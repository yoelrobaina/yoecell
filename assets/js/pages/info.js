/**
 * Página de información comercial: qué incluye la compra, garantía,
 * métodos de pago, entregas y preguntas frecuentes.
 */
import { icon } from '../icons.js';
import { escapeHtml } from '../ui.js';
import { generalLink } from '../whatsapp.js';

export function initInfo({ site }) {
  const conditions = site.conditions || {};

  const included = document.getElementById('info-included');
  if (included) {
    const items = [
      { icon: 'shield', title: 'Cover protector', text: 'Funda rígida o flexible para el equipo, colocada antes de la entrega.' },
      { icon: 'image', title: 'Mica protectora', text: 'Cristal templado instalado o listo para instalar, sin costo adicional.' },
      { icon: 'bolt', title: 'Cargador, cable y adaptador', text: 'Cargador de pared, cable de datos y adaptador de carga.' },
      { icon: 'sim', title: 'Llave SIM', text: 'Llave para abrir la bandeja y activar la línea.' }
    ];
    included.innerHTML = items.map((item) => `
      <div class="value-card">
        <span class="value-card__icon">${icon(item.icon)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </div>`).join('');
  }

  const payments = document.getElementById('info-payments');
  if (payments) {
    payments.innerHTML = (site.payments || []).map((payment) => `
      <div class="value-card">
        <span class="value-card__icon">${icon('wallet')}</span>
        <h3>${escapeHtml(payment.label)}</h3>
        <p>${escapeHtml(payment.detail)}</p>
      </div>`).join('');
  }

  const terms = document.getElementById('info-terms');
  if (terms) {
    terms.innerHTML = `
      <div class="info-block">
        <span class="value-card__icon">${icon('shield')}</span>
        <div>
          <h3>Garantía</h3>
          <p>${escapeHtml(conditions.warranty || '')}</p>
        </div>
      </div>
      <div class="info-block">
        <span class="value-card__icon">${icon('truck')}</span>
        <div>
          <h3>Entregas</h3>
          <p>${escapeHtml(conditions.delivery || '')}</p>
        </div>
      </div>
      <div class="info-block">
        <span class="value-card__icon">${icon('settings')}</span>
        <div>
          <h3>Configuración</h3>
          <p>${escapeHtml(conditions.setup || '')}</p>
        </div>
      </div>`;
  }

  const faq = document.getElementById('info-faq');
  if (faq) {
    faq.innerHTML = (site.faq || []).map((item) => `
      <details class="faq-item">
        <summary>${escapeHtml(item.q)}${icon('plus')}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`).join('');
  }

  document.querySelectorAll('[data-wa-general]').forEach((node) => {
    node.href = generalLink(site, node.dataset.waGeneral || 'Consulta sobre condiciones de compra');
  });
}
