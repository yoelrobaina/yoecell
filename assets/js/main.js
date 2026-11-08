/**
 * Punto de entrada de las páginas públicas de YoeCell.
 * Carga la configuración y el catálogo, monta cabecera y pie, y lanza el
 * módulo de la página según data-page.
 */
import { getCatalog, getSite } from './store.js';
import { bindHeaderBehaviour, renderFab, renderFooter, renderHeader, toast } from './ui.js';
import { generalLink } from './whatsapp.js';
import { initHome } from './pages/home.js';
import { initCatalog } from './pages/catalog.js';
import { initProduct } from './pages/product.js';
import { initOffers } from './pages/offers.js';
import { initInfo } from './pages/info.js';
import { initContact } from './pages/contact.js';

const PAGES = {
  home: initHome,
  catalogo: initCatalog,
  producto: initProduct,
  ofertas: initOffers,
  informacion: initInfo,
  contacto: initContact
};

function showFatalError(message) {
  const main = document.getElementById('main') || document.body;
  main.innerHTML = `<div class="wrap section">
    <div class="empty-state">
      <h3>No pudimos cargar el contenido</h3>
      <p>${message}</p>
      <p style="margin-top:1.2rem"><button class="btn btn--signal" type="button" onclick="location.reload()">Reintentar</button></p>
    </div>
  </div>`;
}

async function boot() {
  const page = document.body.dataset.page || 'home';
  let site;
  let catalog;

  try {
    site = await getSite();
    catalog = await getCatalog();
  } catch (error) {
    showFatalError(error.message || 'Error desconocido al cargar los datos.');
    return;
  }

  const headerHost = document.getElementById('app-header');
  if (headerHost) headerHost.innerHTML = renderHeader(site, page);
  const footerHost = document.getElementById('app-footer');
  if (footerHost) footerHost.innerHTML = renderFooter(site);
  const fabHost = document.getElementById('app-fab');
  if (fabHost) fabHost.innerHTML = renderFab(site);
  bindHeaderBehaviour();

  const init = PAGES[page];
  if (init) {
    try {
      init({ site, catalog });
    } catch (error) {
      console.error(error);
      toast('Ocurrió un error al mostrar esta sección.', 'error');
    }
  }

  // Enlaces de WhatsApp genéricos declarados en el HTML
  document.querySelectorAll('[data-wa-general]').forEach((node) => {
    node.href = generalLink(site, node.dataset.waGeneral || 'Consulta general');
    node.target = '_blank';
    node.rel = 'noopener';
  });
}

document.addEventListener('DOMContentLoaded', boot);
