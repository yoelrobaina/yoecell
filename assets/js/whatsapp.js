/**
 * Integración con WhatsApp: arma los mensajes con los datos de cada producto
 * (nombre, precio, variante, disponibilidad e intención) y devuelve el enlace
 * wa.me. El número comercial vive únicamente en data/site.json.
 */
import { escapeHtml, formatCup, formatUsd } from './ui.js';

export function waUrl(message, number) {
  const clean = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/** Mensaje de consulta sobre un producto concreto. */
export function productMessage(product, options = {}) {
  const { variant, intent = 'compra', cupRate = 0, note = '' } = options;
  const lines = [];
  lines.push(`Hola YoeCell, ${intent === 'consulta' ? 'quiero información sobre' : 'quiero comprar'}:`);
  lines.push('');
  lines.push(`Producto: ${product.name}`);
  lines.push(`Precio: ${formatUsd(product.price)} USD`);
  if (cupRate > 0) lines.push(`Equivalente aprox.: ${formatCup(Math.round(product.price * cupRate))}`);
  if (variant) lines.push(`Variante: ${variant}`);
  lines.push(`Estado: ${product.condition === 'nuevo' ? 'Nuevo' : 'Usado'}`);
  if (product.ram) lines.push(`RAM: ${product.ram}`);
  if (product.storage) lines.push(`Almacenamiento: ${product.storage}`);
  lines.push(`Disponibilidad: ${availabilityText(product)}`);
  if (note) {
    lines.push('');
    lines.push(`Nota: ${note}`);
  }
  lines.push('');
  lines.push('¿Me confirmas disponibilidad y precio final?');
  return lines.join('\n');
}

export function availabilityText(product) {
  if (product.status === 'agotado' || product.stock === 0) return 'Agotado por ahora';
  if (product.status === 'ultimas-unidades') return `Últimas unidades (${product.stock})`;
  return `Disponible (${product.stock} unidades)`;
}

/** Mensaje general de la tienda. */
export function generalMessage(site, topic = 'Consulta general') {
  const business = site?.business || {};
  const lines = [
    `Hola YoeCell, escribo desde la web sobre: ${topic}.`,
    '',
    `Interés en: ${topic}`,
    business.city ? `Entrega en: ${business.city}` : '',
    '',
    '¿Me pueden confirmar precio y disponibilidad?'
  ].filter(Boolean);
  return lines.join('\n');
}

/** Enlaces de consulta ya listos para insertar en un botón. */
export function productLink(product, site, options = {}) {
  const number = site?.business?.whatsappNumber || '';
  return waUrl(productMessage(product, { ...options, cupRate: site?.cupRate || 0 }), number);
}

export function generalLink(site, topic = 'Consulta general') {
  const number = site?.business?.whatsappNumber || '';
  return waUrl(generalMessage(site, topic), number);
}

export { escapeHtml };
