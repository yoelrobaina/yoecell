/**
 * Iconos de línea de YoeCell.
 * Todos los iconos se dibujan con trazo (stroke) de 1.6 px, sin relleno,
 * salvo los que declaran fill explícitamente (marca de WhatsApp).
 */

const paths = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  arrowRight: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  check: '<path d="m5 13 4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16v4z"/><path d="m14 6 4 4"/>',
  box: '<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8z"/><path d="M3.5 8 12 12.5 20.5 8"/><path d="M12 12.5v8"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9V4z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5"/><rect x="12" y="8" width="3" height="8"/><rect x="17" y="13" width="3" height="3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3m13.4-6.4-1.8 1.8M9.4 14.6l-1.8 1.8m0-11.8 1.8 1.8m5.2 5.2 1.8 1.8"/>',
  logout: '<path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M10 12h10"/><path d="m17 9 3 3-3 3"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><path d="M12 14v2.5"/>',
  shield: '<path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6l7-2.5z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  share: '<circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
  camera: '<path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17v-7A1.5 1.5 0 0 1 4 8.5z"/><circle cx="12" cy="13" r="3.4"/>',
  battery: '<rect x="3" y="8" width="16" height="8" rx="2.5"/><path d="M21 11v2"/><path d="M6.5 11v2M10 11v2M13.5 11v2"/>',
  sim: '<path d="M7 4h7l3 3v13H7z"/><path d="M14 4v3h3"/><path d="M10 12h4M10 15.5h4"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><path d="M6.5 14h4"/>',
  package: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.8-4.5 3.4 3 2.6-2.3 4.2 3.8"/>',
  upload: '<path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4v12"/><path d="m7.5 11.5 4.5 4.5 4.5-4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
  alert: '<path d="M12 4.5 21 19.5H3L12 4.5z"/><path d="M12 10v4"/><path d="M12 16.8h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  bolt: '<path d="M13 3 5 13.5h6L11 21l8-10.5h-6L13 3z"/>',
  wallet: '<path d="M3.5 8A2.5 2.5 0 0 1 6 5.5h11A2.5 2.5 0 0 1 19.5 8v9A2.5 2.5 0 0 1 17 19.5H6A2.5 2.5 0 0 1 3.5 17V8z"/><path d="M3.5 9.5h13A2.5 2.5 0 0 1 19 12v3a2.5 2.5 0 0 1-2.5 2.5h-13"/><circle cx="16.5" cy="13.8" r="1.1"/>',
  facebook: '<path d="M14.5 8.5h2.2M13.2 20v-7h2.3M13.2 13c0-2.4 1.5-3.8 3.6-3.8h1.7v2.6h-1.3c-.9 0-1.4.5-1.4 1.5"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.6h.01"/>',
  tiktok: '<path d="M14 4v9.2a3.3 3.3 0 1 1-2.6-3.2"/><path d="M14 4c.4 2.4 2 3.9 4.4 4.1"/>',
  whatsapp: '<path d="M4 20l1.3-4.1A7.5 7.5 0 1 1 8.4 19L4 20z"/><path d="M9 8.4c-.3 1 .1 2 .6 2.7.8 1.1 1.9 2 3.1 2.6.7.3 1.4.3 1.9-.1l.7-.7-1.6-1-.7.6c-.7-.3-1.4-.8-2-1.4-.5-.5-.9-1.1-1.1-1.7l.6-.6-.8-1.6-.7.2z"/>',
  sparkle: '<path d="M12 4.5 13.6 9l4.4 1.6-4.4 1.6L12 16.5l-1.6-4.3L6 10.6 10.4 9 12 4.5z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
};

const filled = {
  whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3zm0 2a7 7 0 1 1-3.6 13l-.4-.2-2.4.6.6-2.3-.2-.4A7 7 0 0 1 12 5zm-3.1 3.3c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.2 3.8 2 .8 2.4.7 2.8.6.5 0 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.6-.3-1.5-.7c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a5.6 5.6 0 0 1-1.7-1 6.4 6.4 0 0 1-1.1-1.5c-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.4l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.4z"/>'
};

/**
 * Devuelve el marcado SVG de un icono.
 * @param {string} name clave del icono
 * @param {{size?: number, className?: string, label?: string}} [options]
 */
export function icon(name, options = {}) {
  const { size, className = '', label } = options;
  const body = filled[name] || paths[name];
  if (!body) return '';
  const isFilled = Boolean(filled[name]);
  const cls = className ? ` class="${className}"` : '';
  const style = size ? ` width="${size}" height="${size}"` : '';
  const a11y = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  const paint = isFilled
    ? 'fill="currentColor" stroke="none"'
    : 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg${cls}${style} viewBox="0 0 24 24" ${paint}${a11y}>${body}</svg>`;
}

export const iconNames = Object.keys(paths);
