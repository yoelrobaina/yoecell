/**
 * Página de contacto: canales de atención, formulario que arma el mensaje
 * de WhatsApp y preguntas frecuentes.
 */
import { icon } from '../icons.js';
import { escapeHtml, toast } from '../ui.js';
import { generalMessage, waUrl } from '../whatsapp.js';

export function initContact({ site }) {
  const business = site.business || {};

  const channels = document.getElementById('contact-channels');
  if (channels) {
    const items = [
      {
        icon: 'whatsapp',
        title: 'WhatsApp',
        value: business.whatsappDisplay || '',
        href: `https://wa.me/${business.whatsappNumber || ''}`,
        note: 'La vía más rápida: respuesta durante el horario de atención.'
      },
      {
        icon: 'mail',
        title: 'Correo',
        value: business.email || '',
        href: `mailto:${business.email || ''}`,
        note: 'Para consultas de facturación o empresas.'
      },
      {
        icon: 'pin',
        title: 'Tienda',
        value: business.address || '',
        href: '',
        note: `Entrega gratuita dentro de ${business.city || 'la ciudad'}.`
      },
      {
        icon: 'clock',
        title: 'Horario',
        value: business.hours || '',
        href: '',
        note: 'Fuera de horario puedes escribir por WhatsApp y te contestamos a la mañana siguiente.'
      }
    ];
    channels.innerHTML = items.map((item) => {
      const value = item.href
        ? `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener">${escapeHtml(item.value)}</a>`
        : escapeHtml(item.value);
      return `<div class="value-card">
        <span class="value-card__icon">${icon(item.icon)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p style="color:var(--text);font-weight:600">${value}</p>
        <p>${escapeHtml(item.note)}</p>
      </div>`;
    }).join('');
  }

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('nombre') || '').trim();
      const topic = String(data.get('motivo') || '').trim();
      const model = String(data.get('modelo') || '').trim();
      const message = String(data.get('mensaje') || '').trim();
      const errorNode = form.querySelector('.field__error');

      if (!name || !topic) {
        if (errorNode) errorNode.textContent = 'Escribe tu nombre y el motivo de la consulta.';
        form.querySelector('[name="nombre"]')?.focus();
        return;
      }
      if (errorNode) errorNode.textContent = '';

      const lines = [
        `Hola YoeCell, soy ${name}.`,
        `Motivo de la consulta: ${topic}.`
      ];
      if (model) lines.push(`Equipo de interés: ${model}.`);
      if (message) lines.push(`Detalle: ${message}`);
      lines.push('', 'Quedo atento a la respuesta.');

      const url = waUrl(lines.join('\n'), business.whatsappNumber);
      window.open(url, '_blank', 'noopener');
      toast('Abriendo WhatsApp con tu consulta.');
      form.reset();
    });
  }

  const faq = document.getElementById('contact-faq');
  if (faq) {
    faq.innerHTML = (site.faq || []).map((item) => `
      <details class="faq-item">
        <summary>${escapeHtml(item.q)}${icon('plus')}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`).join('');
  }

  const social = document.getElementById('contact-social');
  if (social) {
    const links = [
      business.facebook ? { icon: 'facebook', label: 'Facebook', href: business.facebook } : null,
      business.instagram ? { icon: 'instagram', label: 'Instagram', href: business.instagram } : null,
      business.tiktok ? { icon: 'tiktok', label: 'TikTok', href: business.tiktok } : null
    ].filter(Boolean);
    social.innerHTML = links.map((link) => `
      <a class="btn btn--outline" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${icon(link.icon)}${escapeHtml(link.label)}</a>`).join('');
  }

  const demoMessage = document.getElementById('contact-demo-message');
  if (demoMessage) {
    demoMessage.textContent = generalMessage(site, 'Consulta desde la página de contacto');
  }
}
