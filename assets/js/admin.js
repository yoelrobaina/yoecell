/**
 * Panel de administración de YoeCell.
 *
 * Acceso protegido por sesión del servidor (cookie httpOnly firmada).
 * Toda la escritura pasa por la API /api/products y /api/site; si la API no
 * está disponible, los cambios quedan en el navegador y la interfaz lo dice.
 */
import { apiRequest, getCatalog, getSite, saveCatalog, saveSite } from './store.js';
import { icon } from './icons.js';
import { escapeHtml, formatUsd, toast } from './ui.js';

const state = {
  catalog: null,
  site: null,
  storage: 'none',
  view: 'dashboard',
  search: '',
  statusFilter: 'todos'
};

const els = {
  login: document.getElementById('admin-login'),
  app: document.getElementById('admin-app'),
  main: document.getElementById('admin-main'),
  nav: document.getElementById('admin-nav'),
  modal: document.getElementById('admin-modal'),
  storage: document.getElementById('admin-storage'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  loginButton: document.getElementById('login-submit')
};

/* ------------------------------------------------------------- arranque -- */

async function boot() {
  const res = await apiRequest('/api/session');
  state.storage = res.data?.storage || 'none';
  if (res.ok && res.data?.authenticated) {
    await startApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  els.login.hidden = false;
  els.app.hidden = true;
  document.getElementById('login-password')?.focus();
}

async function startApp() {
  els.login.hidden = true;
  els.app.hidden = false;
  await loadData();
  render();
}

async function loadData() {
  const [catalog, site] = await Promise.all([getCatalog(), getSite()]);
  state.catalog = catalog;
  state.site = site;
}

function updateStorageTag() {
  const labels = {
    github: 'Guardado en GitHub (commit automático)',
    filesystem: 'Guardado en el servidor local (data/)',
    none: 'Sin servidor de guardado: los cambios quedan en este navegador'
  };
  els.storage.textContent = labels[state.storage] || state.storage;
  els.storage.style.color = state.storage === 'none' ? '#ffd489' : '';
}

/* --------------------------------------------------------------- login -- */

els.loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.loginError.textContent = '';
  els.loginButton.disabled = true;
  els.loginButton.textContent = 'Comprobando…';
  const password = new FormData(els.loginForm).get('password');
  const res = await apiRequest('/api/session', { method: 'POST', body: { password } });
  els.loginButton.disabled = false;
  els.loginButton.textContent = 'Entrar al panel';
  if (res.ok && res.data?.authenticated) {
    state.storage = res.data.storage || state.storage;
    await startApp();
    return;
  }
  els.loginError.textContent = res.data?.error || 'No se pudo iniciar sesión.';
});

document.getElementById('admin-logout')?.addEventListener('click', async () => {
  await apiRequest('/api/session', { method: 'DELETE' });
  window.location.reload();
});

els.nav?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  state.view = button.dataset.view;
  els.nav.querySelectorAll('[data-view]').forEach((item) => item.setAttribute('aria-current', String(item === button)));
  render();
});

/* ------------------------------------------------------------ guardado -- */

async function persistCatalog(message = 'Cambios guardados') {
  const result = await saveCatalog(state.catalog);
  if (result.mode === 'error') {
    toast(result.message, 'error');
    return false;
  }
  state.storage = result.mode === 'server' ? state.storage : 'none';
  updateStorageTag();
  toast(result.mode === 'server' ? message : `${message} (solo en este navegador)`);
  return true;
}

async function persistSite(message = 'Ajustes guardados') {
  const result = await saveSite(state.site);
  if (result.mode === 'error') {
    toast(result.message, 'error');
    return false;
  }
  state.storage = result.mode === 'server' ? state.storage : 'none';
  updateStorageTag();
  toast(result.mode === 'server' ? message : `${message} (solo en este navegador)`);
  return true;
}

/* ------------------------------------------------------------- render --- */

function render() {
  updateStorageTag();
  const views = {
    dashboard: renderDashboard,
    products: renderProducts,
    categories: renderCategories,
    offers: renderOffers,
    inventory: renderInventory,
    settings: renderSettings
  };
  els.main.innerHTML = (views[state.view] || renderDashboard)();
  bindView();
}

function phones() {
  return (state.catalog?.products || []).filter((p) => p.type !== 'accesorio');
}

function accessories() {
  return (state.catalog?.products || []).filter((p) => p.type === 'accesorio');
}

function statusBadge(product) {
  if (product.status === 'agotado' || product.stock === 0) return '<span class="badge badge--out">Agotado</span>';
  if (product.status === 'ultimas-unidades') return '<span class="badge badge--last">Últimas unidades</span>';
  return '<span class="badge badge--new">Disponible</span>';
}

/* ------------------------------------------------------------ resumen --- */

function renderDashboard() {
  const all = state.catalog?.products || [];
  const list = phones();
  const out = list.filter((p) => p.status === 'agotado' || p.stock === 0);
  const low = list.filter((p) => p.stock > 0 && p.stock <= 3);
  const units = list.reduce((total, product) => total + (Number(product.stock) || 0), 0);
  const value = list.reduce((total, product) => total + (Number(product.stock) || 0) * (Number(product.price) || 0), 0);

  return `
  <div class="stat-grid">
    <div class="stat"><span class="stat__label">Teléfonos en catálogo</span><div class="stat__value">${list.length}</div><span class="stat__hint">${accessories().length} accesorios aparte</span></div>
    <div class="stat"><span class="stat__label">Unidades en inventario</span><div class="stat__value">${units}</div><span class="stat__hint">${formatUsd(value)} en mercadería</span></div>
    <div class="stat"><span class="stat__label">Agotados</span><div class="stat__value">${out.length}</div><span class="stat__hint">${out.length ? 'Marca el reposición' : 'Todo con existencias'}</span></div>
    <div class="stat"><span class="stat__label">Stock bajo</span><div class="stat__value">${low.length}</div><span class="stat__hint">3 unidades o menos</span></div>
  </div>

  <div class="panel" style="margin-bottom:1.2rem">
    <div class="panel__head">
      <h2 class="panel__title">Acciones rápidas</h2>
    </div>
    <div class="panel__body" style="display:flex;gap:.6rem;flex-wrap:wrap">
      <button class="btn btn--signal" type="button" data-action="add-product">${icon('plus')}Añadir teléfono</button>
      <button class="btn btn--outline" type="button" data-action="add-offer">${icon('tag')}Crear oferta</button>
      <button class="btn btn--outline" type="button" data-action="export">${icon('download')}Exportar catálogo</button>
      <button class="btn btn--outline" type="button" data-action="import">${icon('upload')}Importar catálogo</button>
    </div>
  </div>

  ${low.length || out.length ? `
  <div class="panel">
    <div class="panel__head"><h2 class="panel__title">Necesitan atención</h2></div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>Producto</th><th>Estado</th><th>Stock</th><th>Precio</th><th></th></tr></thead>
        <tbody>
          ${[...out, ...low].map((product) => `
            <tr>
              <td><strong>${escapeHtml(product.name)}</strong><br><span style="font-size:.78rem">${escapeHtml(product.brand)}</span></td>
              <td>${statusBadge(product)}</td>
              <td>${product.stock}</td>
              <td>${formatUsd(product.price)}</td>
              <td>
                <div class="table-actions">
                  <button class="mini-btn" type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}" aria-label="Editar ${escapeHtml(product.name)}">${icon('edit')}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : ''}`;
}

/* ----------------------------------------------------------- productos -- */

function renderProducts() {
  const list = allProductsFiltered();
  return `
  <div class="panel">
    <div class="panel__head">
      <h2 class="panel__title">Productos</h2>
      <div class="catalog-search" style="max-width:280px;min-width:200px">
        <span class="catalog-search__icon">${icon('search')}</span>
        <label class="visually-hidden" for="admin-search">Buscar producto</label>
        <input class="input" id="admin-search" type="search" placeholder="Buscar por nombre o marca" value="${escapeHtml(state.search)}">
      </div>
      <select class="select" id="admin-status" style="max-width:170px">
        <option value="todos"${state.statusFilter === 'todos' ? ' selected' : ''}>Todos los estados</option>
        <option value="disponible"${state.statusFilter === 'disponible' ? ' selected' : ''}>Disponibles</option>
        <option value="agotado"${state.statusFilter === 'agotado' ? ' selected' : ''}>Agotados</option>
        <option value="ultimas-unidades"${state.statusFilter === 'ultimas-unidades' ? ' selected' : ''}>Últimas unidades</option>
        <option value="accesorio"${state.statusFilter === 'accesorio' ? ' selected' : ''}>Accesorios</option>
      </select>
      <button class="btn btn--sm btn--signal" type="button" data-action="add-product">${icon('plus')}Añadir</button>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr><th>Producto</th><th>Precio (USD)</th><th>Stock</th><th>Estado</th><th>Condición</th><th></th></tr>
        </thead>
        <tbody>
          ${list.length ? list.map((product) => `
            <tr data-id="${escapeHtml(product.id)}">
              <td>
                <div style="display:flex;align-items:center;gap:.7rem">
                  <img class="thumb" src="${escapeHtml(product.images?.[0] || '/assets/img/og-default.png')}" alt="" width="46" height="46">
                  <div>
                    <strong>${escapeHtml(product.name)}</strong><br>
                    <span style="font-size:.78rem">${escapeHtml(product.brand)} · ${escapeHtml(product.slug)}</span>
                  </div>
                </div>
              </td>
              <td>
                <input class="input" type="number" min="0" step="1" value="${product.price}" data-field="price" style="width:110px" aria-label="Precio de ${escapeHtml(product.name)}">
              </td>
              <td>
                <input class="input" type="number" min="0" step="1" value="${product.stock}" data-field="stock" style="width:90px" aria-label="Stock de ${escapeHtml(product.name)}">
              </td>
              <td>
                <select class="select" data-field="status" style="width:150px" aria-label="Estado de ${escapeHtml(product.name)}">
                  <option value="disponible"${product.status === 'disponible' ? ' selected' : ''}>Disponible</option>
                  <option value="ultimas-unidades"${product.status === 'ultimas-unidades' ? ' selected' : ''}>Últimas unidades</option>
                  <option value="agotado"${product.status === 'agotado' ? ' selected' : ''}>Agotado</option>
                </select>
              </td>
              <td>
                <select class="select" data-field="condition" style="width:120px" aria-label="Condición de ${escapeHtml(product.name)}">
                  <option value="nuevo"${product.condition === 'nuevo' ? ' selected' : ''}>Nuevo</option>
                  <option value="usado"${product.condition === 'usado' ? ' selected' : ''}>Usado</option>
                </select>
              </td>
              <td>
                <div class="table-actions">
                  <a class="mini-btn" href="/telefono/${encodeURIComponent(product.slug)}" target="_blank" rel="noopener" aria-label="Ver ficha">${icon('eye')}</a>
                  <button class="mini-btn" type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}" aria-label="Editar">${icon('edit')}</button>
                  <button class="mini-btn mini-btn--danger" type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}" aria-label="Eliminar">${icon('trash')}</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="6">No hay productos que coincidan.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

function allProductsFiltered() {
  const term = state.search.trim().toLowerCase();
  return (state.catalog?.products || []).filter((product) => {
    if (term && !`${product.name} ${product.brand} ${product.slug}`.toLowerCase().includes(term)) return false;
    if (state.statusFilter === 'accesorio') return product.type === 'accesorio';
    if (state.statusFilter === 'todos') return true;
    if (state.statusFilter === 'agotado') return product.status === 'agotado' || product.stock === 0;
    if (state.statusFilter === 'disponible') return product.status === 'disponible';
    if (state.statusFilter === 'ultimas-unidades') return product.status === 'ultimas-unidades';
    return true;
  });
}

/* ---------------------------------------------------------- categorías -- */

function renderCategories() {
  const categories = state.catalog?.categories || [];
  return `
  <div class="panel">
    <div class="panel__head">
      <h2 class="panel__title">Categorías</h2>
      <button class="btn btn--sm btn--signal" type="button" data-action="add-category">${icon('plus')}Nueva categoría</button>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>Nombre</th><th>Identificador</th><th>Productos</th><th>Descripción</th><th></th></tr></thead>
        <tbody>
          ${categories.length ? categories.map((category) => `
            <tr>
              <td><strong>${escapeHtml(category.name)}</strong></td>
              <td>${escapeHtml(category.id)}</td>
              <td>${(state.catalog.products || []).filter((p) => p.category === category.id).length}</td>
              <td>${escapeHtml(category.description || '')}</td>
              <td>
                <div class="table-actions">
                  <button class="mini-btn" type="button" data-action="edit-category" data-id="${escapeHtml(category.id)}" aria-label="Editar">${icon('edit')}</button>
                  <button class="mini-btn mini-btn--danger" type="button" data-action="delete-category" data-id="${escapeHtml(category.id)}" aria-label="Eliminar">${icon('trash')}</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="5">No hay categorías.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- ofertas -- */

function renderOffers() {
  const offers = state.catalog?.offers || [];
  const products = state.catalog?.products || [];
  return `
  <div class="panel">
    <div class="panel__head">
      <h2 class="panel__title">Ofertas</h2>
      <button class="btn btn--sm btn--signal" type="button" data-action="add-offer">${icon('plus')}Nueva oferta</button>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>Oferta</th><th>Descuento</th><th>Productos</th><th>Vigente hasta</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${offers.length ? offers.map((offer) => `
            <tr>
              <td><strong>${escapeHtml(offer.title)}</strong><br><span style="font-size:.78rem">${escapeHtml(offer.subtitle || '')}</span></td>
              <td>-${offer.discountPercent}%</td>
              <td>${(offer.productIds || []).length}</td>
              <td>${escapeHtml(offer.until || '—')}</td>
              <td>${offer.active !== false ? '<span class="badge badge--new">Activa</span>' : '<span class="badge badge--used">Pausada</span>'}</td>
              <td>
                <div class="table-actions">
                  <button class="mini-btn" type="button" data-action="edit-offer" data-id="${escapeHtml(offer.id)}" aria-label="Editar">${icon('edit')}</button>
                  <button class="mini-btn mini-btn--danger" type="button" data-action="delete-offer" data-id="${escapeHtml(offer.id)}" aria-label="Eliminar">${icon('trash')}</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="6">No hay ofertas definidas.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ---------------------------------------------------------- inventario -- */

function renderInventory() {
  const list = [...(state.catalog?.products || [])].sort((a, b) => (a.stock || 0) - (b.stock || 0));
  return `
  <div class="panel">
    <div class="panel__head">
      <h2 class="panel__title">Inventario</h2>
      <span class="chip">${list.length} referencias</span>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          ${list.map((product) => `
            <tr>
              <td><strong>${escapeHtml(product.name)}</strong></td>
              <td>${formatUsd(product.price)}</td>
              <td><span class="badge ${product.stock === 0 ? 'badge--out' : product.stock <= 3 ? 'badge--last' : 'badge--new'}">${product.stock}</span></td>
              <td>${statusBadge(product)}</td>
              <td>
                <div class="table-actions" style="justify-content:flex-start">
                  <button class="mini-btn" type="button" data-action="stock" data-delta="-1" data-id="${escapeHtml(product.id)}" aria-label="Quitar una unidad">${icon('minus')}</button>
                  <button class="mini-btn" type="button" data-action="stock" data-delta="1" data-id="${escapeHtml(product.id)}" aria-label="Añadir una unidad">${icon('plus')}</button>
                  <button class="mini-btn" type="button" data-action="toggle-stock" data-id="${escapeHtml(product.id)}" aria-label="Marcar agotado o disponible">${icon('refresh')}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- ajustes -- */

function renderSettings() {
  const site = state.site || {};
  const business = site.business || {};
  return `
  <div class="panel" style="margin-bottom:1.2rem">
    <div class="panel__head"><h2 class="panel__title">Datos del negocio</h2></div>
    <div class="panel__body">
      <form id="site-form">
        <div class="form-grid">
          <div class="field">
            <label class="field__label" for="site-name">Nombre</label>
            <input class="input" id="site-name" name="name" value="${escapeHtml(business.name || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-wa">Número de WhatsApp (solo dígitos)</label>
            <input class="input" id="site-wa" name="whatsappNumber" inputmode="numeric" value="${escapeHtml(business.whatsappNumber || '')}">
            <p class="field__hint">Es el único lugar del código donde se cambia el número comercial.</p>
          </div>
          <div class="field">
            <label class="field__label" for="site-wa-display">Número para mostrar</label>
            <input class="input" id="site-wa-display" name="whatsappDisplay" value="${escapeHtml(business.whatsappDisplay || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-city">Ciudad</label>
            <input class="input" id="site-city" name="city" value="${escapeHtml(business.city || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-address">Dirección</label>
            <input class="input" id="site-address" name="address" value="${escapeHtml(business.address || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-hours">Horario</label>
            <input class="input" id="site-hours" name="hours" value="${escapeHtml(business.hours || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-email">Correo</label>
            <input class="input" id="site-email" name="email" type="email" value="${escapeHtml(business.email || '')}">
          </div>
          <div class="field">
            <label class="field__label" for="site-rate">Tasa CUP por 1 USD</label>
            <input class="input" id="site-rate" name="cupRate" type="number" min="0" step="1" value="${site.cupRate || 0}">
            <p class="field__hint">${escapeHtml(site.cupRateNote || '')}</p>
          </div>
        </div>

        <fieldset class="fieldset" style="margin-top:1.2rem">
          <legend>Redes sociales</legend>
          <div class="form-grid">
            <div class="field"><label class="field__label" for="site-instagram">Instagram</label><input class="input" id="site-instagram" name="instagram" value="${escapeHtml(business.instagram || '')}"></div>
            <div class="field"><label class="field__label" for="site-facebook">Facebook</label><input class="input" id="site-facebook" name="facebook" value="${escapeHtml(business.facebook || '')}"></div>
            <div class="field"><label class="field__label" for="site-tiktok">TikTok</label><input class="input" id="site-tiktok" name="tiktok" value="${escapeHtml(business.tiktok || '')}"></div>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Condiciones comerciales</legend>
          <div class="field" style="margin-bottom:.8rem"><label class="field__label" for="site-warranty">Garantía</label><input class="input" id="site-warranty" name="warranty" value="${escapeHtml(site.conditions?.warranty || '')}"></div>
          <div class="field" style="margin-bottom:.8rem"><label class="field__label" for="site-delivery">Entregas</label><input class="input" id="site-delivery" name="delivery" value="${escapeHtml(site.conditions?.delivery || '')}"></div>
          <div class="field"><label class="field__label" for="site-setup">Configuración</label><input class="input" id="site-setup" name="setup" value="${escapeHtml(site.conditions?.setup || '')}"></div>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Métodos de pago (uno por línea: Etiqueta | descripción)</legend>
          <textarea class="textarea" id="site-payments" name="payments">${escapeHtml((site.payments || []).map((p) => `${p.label} | ${p.detail}`).join('\n'))}</textarea>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Preguntas frecuentes (una por línea: Pregunta | Respuesta)</legend>
          <textarea class="textarea" id="site-faq" name="faq">${escapeHtml((site.faq || []).map((f) => `${f.q} | ${f.a}`).join('\n'))}</textarea>
        </fieldset>

        <button class="btn btn--signal" type="submit">${icon('check')}Guardar ajustes</button>
      </form>
    </div>
  </div>

  <div class="panel">
    <div class="panel__head"><h2 class="panel__title">Copia de seguridad</h2></div>
    <div class="panel__body" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center">
      <button class="btn btn--outline" type="button" data-action="export">${icon('download')}Exportar catálogo JSON</button>
      <label class="btn btn--outline" style="cursor:pointer">
        ${icon('upload')}Importar catálogo JSON
        <input type="file" id="import-file" accept="application/json" hidden>
      </label>
      <span class="field__hint">Al importar se reemplaza el catálogo completo.</span>
    </div>
  </div>`;
}

/* ------------------------------------------------------ eventos vista --- */

function bindView() {
  const search = document.getElementById('admin-search');
  if (search) {
    let timer = null;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.search = search.value;
        render();
        const input = document.getElementById('admin-search');
        if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
      }, 250);
    });
  }

  const statusFilter = document.getElementById('admin-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      state.statusFilter = statusFilter.value;
      render();
    });
  }

  // Campos editables en línea (precio, stock, estado, condición)
  els.main.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('change', async () => {
      const row = input.closest('tr[data-id]');
      const product = (state.catalog.products || []).find((p) => p.id === row?.dataset.id);
      if (!product) return;
      const field = input.dataset.field;
      if (field === 'price') product.price = Math.max(0, Number(input.value) || 0);
      if (field === 'stock') {
        product.stock = Math.max(0, Math.trunc(Number(input.value) || 0));
        if (product.stock === 0) product.status = 'agotado';
        else if (product.status === 'agotado') product.status = 'disponible';
      }
      if (field === 'status') product.status = input.value;
      if (field === 'condition') product.condition = input.value;
      await persistCatalog('Producto actualizado');
      render();
    });
  });

  els.main.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action, button.dataset));
  });

  document.getElementById('site-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    state.site.business = {
      ...state.site.business,
      name: data.get('name'),
      whatsappNumber: String(data.get('whatsappNumber') || '').replace(/\D/g, ''),
      whatsappDisplay: data.get('whatsappDisplay'),
      city: data.get('city'),
      address: data.get('address'),
      hours: data.get('hours'),
      email: data.get('email'),
      instagram: data.get('instagram'),
      facebook: data.get('facebook'),
      tiktok: data.get('tiktok')
    };
    state.site.cupRate = Number(data.get('cupRate')) || 0;
    state.site.conditions = {
      ...state.site.conditions,
      warranty: data.get('warranty'),
      delivery: data.get('delivery'),
      setup: data.get('setup')
    };
    state.site.payments = String(data.get('payments') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, detail = ''] = line.split('|').map((part) => part.trim());
        return { id: label.toLowerCase().replace(/\s+/g, '-'), label, detail };
      });
    state.site.faq = String(data.get('faq') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [q, a = ''] = line.split('|').map((part) => part.trim());
        return { q, a };
      });
    await persistSite();
  });

  document.getElementById('import-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const catalog = parsed.catalog || parsed;
      if (!catalog.products) throw new Error('El archivo no contiene un catálogo válido.');
      state.catalog = catalog;
      await persistCatalog('Catálogo importado');
      render();
    } catch (error) {
      toast(`No se pudo importar: ${error.message}`, 'error');
    }
  });
}

/* ---------------------------------------------------------- acciones ---- */

async function handleAction(action, data) {
  switch (action) {
    case 'add-product':
      openProductModal(null);
      break;
    case 'edit-product':
      openProductModal((state.catalog.products || []).find((p) => p.id === data.id));
      break;
    case 'delete-product':
      await deleteProduct(data.id);
      break;
    case 'add-category':
      openCategoryModal(null);
      break;
    case 'edit-category':
      openCategoryModal((state.catalog.categories || []).find((c) => c.id === data.id));
      break;
    case 'delete-category':
      await deleteCategory(data.id);
      break;
    case 'add-offer':
      openOfferModal(null);
      break;
    case 'edit-offer':
      openOfferModal((state.catalog.offers || []).find((o) => o.id === data.id));
      break;
    case 'delete-offer':
      await deleteOffer(data.id);
      break;
    case 'stock': {
      const product = (state.catalog.products || []).find((p) => p.id === data.id);
      if (!product) return;
      product.stock = Math.max(0, (product.stock || 0) + Number(data.delta || 0));
      if (product.stock === 0) product.status = 'agotado';
      else if (product.status === 'agotado') product.status = 'disponible';
      await persistCatalog('Inventario actualizado');
      render();
      break;
    }
    case 'toggle-stock': {
      const product = (state.catalog.products || []).find((p) => p.id === data.id);
      if (!product) return;
      const agotado = product.status === 'agotado' || product.stock === 0;
      product.status = agotado ? 'disponible' : 'agotado';
      if (!agotado) product.stock = 0;
      else if (!product.stock) product.stock = 1;
      await persistCatalog('Estado actualizado');
      render();
      break;
    }
    case 'export':
      exportCatalog();
      break;
    case 'import':
      document.getElementById('import-file')?.click();
      break;
    default:
      break;
  }
}

function exportCatalog() {
  const blob = new Blob([`${JSON.stringify(state.catalog, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yoecell-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast('Copia de seguridad descargada.');
}

async function deleteProduct(id) {
  const product = (state.catalog.products || []).find((p) => p.id === id);
  if (!product) return;
  if (!window.confirm(`¿Eliminar "${product.name}" del catálogo? Esta acción no se puede deshacer.`)) return;
  state.catalog.products = state.catalog.products.filter((p) => p.id !== id);
  state.catalog.offers = (state.catalog.offers || []).map((offer) => ({
    ...offer,
    productIds: (offer.productIds || []).filter((productId) => productId !== id)
  }));
  await persistCatalog('Producto eliminado');
  render();
}

async function deleteCategory(id) {
  const used = (state.catalog.products || []).filter((p) => p.category === id).length;
  if (used) {
    toast(`No se puede eliminar: ${used} producto(s) usan esta categoría.`, 'error');
    return;
  }
  if (!window.confirm('¿Eliminar esta categoría?')) return;
  state.catalog.categories = (state.catalog.categories || []).filter((category) => category.id !== id);
  await persistCatalog('Categoría eliminada');
  render();
}

async function deleteOffer(id) {
  if (!window.confirm('¿Eliminar esta oferta?')) return;
  state.catalog.offers = (state.catalog.offers || []).filter((offer) => offer.id !== id);
  await persistCatalog('Oferta eliminada');
  render();
}

/* -------------------------------------------------------------- modales -- */

function openModal(title, bodyHtml, onSubmit, submitLabel = 'Guardar') {
  els.modal.innerHTML = `
    <div class="modal__backdrop" data-close="true"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal__head">
        <span class="modal__title">${escapeHtml(title)}</span>
        <div style="flex:1"></div>
        <button class="icon-btn" type="button" data-close="true" aria-label="Cerrar">${icon('x')}</button>
      </div>
      <form id="modal-form">
        <div class="modal__body">${bodyHtml}</div>
        <div class="modal__foot">
          <button class="btn btn--outline" type="button" data-close="true">Cancelar</button>
          <button class="btn btn--signal" type="submit">${escapeHtml(submitLabel)}</button>
        </div>
      </form>
    </div>`;
  els.modal.setAttribute('data-open', 'true');
  document.body.classList.add('is-locked');
  els.modal.querySelectorAll('[data-close]').forEach((node) => node.addEventListener('click', closeModal));
  const form = document.getElementById('modal-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const ok = await onSubmit(data, form);
    if (ok !== false) closeModal();
  });
  const first = form.querySelector('input, select, textarea');
  if (first) first.focus();
}

function closeModal() {
  els.modal.setAttribute('data-open', 'false');
  els.modal.innerHTML = '';
  document.body.classList.remove('is-locked');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && els.modal.getAttribute('data-open') === 'true') closeModal();
});

function openProductModal(product) {
  const isNew = !product;
  const item = product || {
    id: '',
    slug: '',
    name: '',
    brand: 'Samsung',
    category: (state.catalog.categories?.[0]?.id) || 'smartphones',
    type: 'telefono',
    condition: 'nuevo',
    price: 0,
    previousPrice: '',
    stock: 1,
    status: 'disponible',
    featured: false,
    isNew: false,
    ram: '',
    storage: '',
    color: '',
    colors: [],
    shortDescription: '',
    description: '',
    specs: {},
    included: state.site?.conditions?.included || [],
    warranty: state.site?.conditions?.warranty || '',
    paymentMethods: (state.site?.payments || []).map((p) => p.label),
    tags: [],
    images: []
  };

  const specText = Object.entries(item.specs || {}).map(([key, value]) => `${key}: ${value}`).join('\n');

  openModal(isNew ? 'Añadir teléfono' : `Editar: ${item.name}`, `
    <div class="form-grid">
      <div class="field" style="grid-column:1/-1">
        <label class="field__label" for="p-name">Nombre</label>
        <input class="input" id="p-name" name="name" required value="${escapeHtml(item.name)}">
      </div>
      <div class="field">
        <label class="field__label" for="p-brand">Marca</label>
        <input class="input" id="p-brand" name="brand" required value="${escapeHtml(item.brand)}">
      </div>
      <div class="field">
        <label class="field__label" for="p-category">Categoría</label>
        <select class="select" id="p-category" name="category">
          ${(state.catalog.categories || []).map((category) => `<option value="${escapeHtml(category.id)}"${category.id === item.category ? ' selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="p-type">Tipo</label>
        <select class="select" id="p-type" name="type">
          <option value="telefono"${item.type === 'telefono' ? ' selected' : ''}>Teléfono</option>
          <option value="accesorio"${item.type === 'accesorio' ? ' selected' : ''}>Accesorio</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="p-condition">Condición</label>
        <select class="select" id="p-condition" name="condition">
          <option value="nuevo"${item.condition === 'nuevo' ? ' selected' : ''}>Nuevo</option>
          <option value="usado"${item.condition === 'usado' ? ' selected' : ''}>Usado</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="p-price">Precio (USD)</label>
        <input class="input" id="p-price" name="price" type="number" min="0" step="1" required value="${item.price}">
      </div>
      <div class="field">
        <label class="field__label" for="p-previous">Precio anterior (opcional)</label>
        <input class="input" id="p-previous" name="previousPrice" type="number" min="0" step="1" value="${item.previousPrice ?? ''}">
      </div>
      <div class="field">
        <label class="field__label" for="p-stock">Existencias</label>
        <input class="input" id="p-stock" name="stock" type="number" min="0" step="1" value="${item.stock}">
      </div>
      <div class="field">
        <label class="field__label" for="p-status">Estado</label>
        <select class="select" id="p-status" name="status">
          <option value="disponible"${item.status === 'disponible' ? ' selected' : ''}>Disponible</option>
          <option value="ultimas-unidades"${item.status === 'ultimas-unidades' ? ' selected' : ''}>Últimas unidades</option>
          <option value="agotado"${item.status === 'agotado' ? ' selected' : ''}>Agotado</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="p-ram">RAM</label>
        <input class="input" id="p-ram" name="ram" value="${escapeHtml(item.ram || '')}" placeholder="8 GB">
      </div>
      <div class="field">
        <label class="field__label" for="p-storage">Almacenamiento</label>
        <input class="input" id="p-storage" name="storage" value="${escapeHtml(item.storage || '')}" placeholder="128 GB">
      </div>
      <div class="field">
        <label class="field__label" for="p-color">Color principal</label>
        <input class="input" id="p-color" name="color" value="${escapeHtml(item.color || '')}">
      </div>
      <div class="field">
        <label class="field__label" for="p-colors">Colores (separados por coma)</label>
        <input class="input" id="p-colors" name="colors" value="${escapeHtml((item.colors || []).join(', '))}">
      </div>
    </div>

    <div class="field" style="margin-top:.9rem">
      <label class="field__label" for="p-short">Descripción corta (aparece en la tarjeta)</label>
      <input class="input" id="p-short" name="shortDescription" value="${escapeHtml(item.shortDescription || '')}">
    </div>
    <div class="field" style="margin-top:.9rem">
      <label class="field__label" for="p-description">Descripción completa</label>
      <textarea class="textarea" id="p-description" name="description">${escapeHtml(item.description || '')}</textarea>
    </div>

    <fieldset class="fieldset" style="margin-top:1rem">
      <legend>Especificaciones (una por línea: Clave: Valor)</legend>
      <textarea class="textarea" id="p-specs" name="specs">${escapeHtml(specText)}</textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend>Imágenes (una URL por línea)</legend>
      <textarea class="textarea" id="p-images" name="images" placeholder="/assets/img/products/equipo-1.png">${escapeHtml((item.images || []).join('\n'))}</textarea>
      <label class="btn btn--outline btn--sm" style="margin-top:.6rem;display:inline-flex">
        ${icon('upload')}Subir imagen desde el equipo
        <input type="file" id="p-image-file" accept="image/png,image/jpeg,image/webp" hidden>
      </label>
      <p class="field__hint" id="p-image-hint">Las imágenes subidas se guardan dentro del catálogo; en hosting con límite de peso conviene usar URLs.</p>
    </fieldset>

    <fieldset class="fieldset">
      <legend>Accesorios incluidos (separados por coma)</legend>
      <input class="input" id="p-included" name="included" value="${escapeHtml((item.included || []).join(', '))}">
    </fieldset>

    <div class="form-grid">
      <div class="field">
        <label class="switch"><input type="checkbox" name="featured"${item.featured ? ' checked' : ''}><span class="switch__track"></span>Destacado en la portada</label>
      </div>
      <div class="field">
        <label class="switch"><input type="checkbox" name="isNew"${item.isNew ? ' checked' : ''}><span class="switch__track"></span>Marcar como novedad</label>
      </div>
      <div class="field">
        <label class="field__label" for="p-tags">Etiquetas (separadas por coma)</label>
        <input class="input" id="p-tags" name="tags" value="${escapeHtml((item.tags || []).join(', '))}">
      </div>
    </div>
  `, async (data, form) => {
    if (!data.name || !data.brand) {
      toast('El nombre y la marca son obligatorios.', 'error');
      return false;
    }
    if (Number(data.price) < 0) {
      toast('El precio no puede ser negativo.', 'error');
      return false;
    }
    const specs = {};
    String(data.specs || '').split('\n').forEach((line) => {
      const index = line.indexOf(':');
      if (index > 0) specs[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    });
    const list = (value) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean);
    const slugBase = String(data.name).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existing = (state.catalog.products || []).filter((p) => p.id !== item.id);
    const slug = existing.some((p) => p.slug === slugBase) ? `${slugBase}-${Date.now().toString().slice(-4)}` : slugBase;

    const updated = {
      ...item,
      id: item.id || `prd-${slug}`,
      slug,
      name: data.name.trim(),
      brand: data.brand.trim(),
      category: data.category,
      type: data.type,
      condition: data.condition,
      price: Number(data.price) || 0,
      previousPrice: data.previousPrice ? Number(data.previousPrice) : null,
      stock: Math.max(0, Math.trunc(Number(data.stock) || 0)),
      status: data.status,
      featured: data.featured === 'on',
      isNew: data.isNew === 'on',
      ram: data.ram.trim(),
      storage: data.storage.trim(),
      color: data.color.trim(),
      colors: list(data.colors),
      shortDescription: data.shortDescription.trim(),
      description: data.description.trim(),
      specs,
      included: list(data.included),
      tags: list(data.tags),
      images: String(data.images || '').split('\n').map((src) => src.trim()).filter(Boolean),
      warranty: state.site?.conditions?.warranty || item.warranty,
      paymentMethods: (state.site?.payments || []).map((p) => p.label)
    };

    const products = [...(state.catalog.products || [])];
    const index = products.findIndex((p) => p.id === updated.id);
    if (index >= 0) products[index] = updated;
    else products.push(updated);
    state.catalog.products = products;
    await persistCatalog(isNew ? 'Teléfono añadido' : 'Teléfono actualizado');
    render();
    return true;
  });

  // Subida de imagen -> data URL
  const fileInput = document.getElementById('p-image-file');
  const imagesField = document.getElementById('p-images');
  const hint = document.getElementById('p-image-hint');
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) {
      toast('La imagen supera 400 KB. Usa una imagen más liviana o una URL.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const current = String(imagesField.value || '').split('\n').map((s) => s.trim()).filter(Boolean);
      current.push(reader.result);
      imagesField.value = current.join('\n');
      if (hint) hint.textContent = 'Imagen añadida. Guarda los cambios para aplicarlos.';
    };
    reader.readAsDataURL(file);
  });
}

function openCategoryModal(category) {
  const isNew = !category;
  const item = category || { id: '', name: '', description: '', order: (state.catalog.categories || []).length + 1 };
  openModal(isNew ? 'Nueva categoría' : `Editar: ${item.name}`, `
    <div class="form-grid">
      <div class="field">
        <label class="field__label" for="c-name">Nombre</label>
        <input class="input" id="c-name" name="name" required value="${escapeHtml(item.name)}">
      </div>
      <div class="field">
        <label class="field__label" for="c-order">Orden</label>
        <input class="input" id="c-order" name="order" type="number" min="0" value="${item.order || 0}">
      </div>
    </div>
    <div class="field" style="margin-top:.9rem">
      <label class="field__label" for="c-description">Descripción</label>
      <input class="input" id="c-description" name="description" value="${escapeHtml(item.description || '')}">
    </div>
  `, async (data) => {
    if (!data.name) { toast('El nombre es obligatorio.', 'error'); return false; }
    const id = item.id || data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    const updated = {
      id,
      name: data.name.trim(),
      slug: id,
      description: data.description.trim(),
      order: Number(data.order) || 0
    };
    const categories = [...(state.catalog.categories || [])];
    const index = categories.findIndex((c) => c.id === item.id);
    if (index >= 0) categories[index] = updated;
    else categories.push(updated);
    state.catalog.categories = categories;
    await persistCatalog(isNew ? 'Categoría creada' : 'Categoría actualizada');
    render();
    return true;
  });
}

function openOfferModal(offer) {
  const isNew = !offer;
  const item = offer || {
    id: '',
    title: '',
    subtitle: '',
    productIds: [],
    discountPercent: 10,
    badge: 'PRECIO ESPECIAL',
    until: '',
    active: true
  };
  const products = state.catalog.products || [];
  openModal(isNew ? 'Nueva oferta' : `Editar: ${item.title}`, `
    <div class="form-grid">
      <div class="field" style="grid-column:1/-1">
        <label class="field__label" for="o-title">Título</label>
        <input class="input" id="o-title" name="title" required value="${escapeHtml(item.title)}">
      </div>
      <div class="field" style="grid-column:1/-1">
        <label class="field__label" for="o-subtitle">Subtítulo</label>
        <input class="input" id="o-subtitle" name="subtitle" value="${escapeHtml(item.subtitle || '')}">
      </div>
      <div class="field">
        <label class="field__label" for="o-badge">Etiqueta</label>
        <input class="input" id="o-badge" name="badge" value="${escapeHtml(item.badge || '')}">
      </div>
      <div class="field">
        <label class="field__label" for="o-discount">Descuento (%)</label>
        <input class="input" id="o-discount" name="discountPercent" type="number" min="0" max="90" value="${item.discountPercent || 0}">
      </div>
      <div class="field">
        <label class="field__label" for="o-until">Vigente hasta</label>
        <input class="input" id="o-until" name="until" type="date" value="${escapeHtml(item.until || '')}">
      </div>
      <div class="field">
        <label class="switch"><input type="checkbox" name="active"${item.active !== false ? ' checked' : ''}><span class="switch__track"></span>Oferta activa</label>
      </div>
    </div>
    <fieldset class="fieldset" style="margin-top:1rem">
      <legend>Productos incluidos</legend>
      <div style="display:grid;gap:.4rem;max-height:280px;overflow:auto">
        ${products.map((product) => `
          <label class="filter-option">
            <input type="checkbox" name="products" value="${escapeHtml(product.id)}"${(item.productIds || []).includes(product.id) ? ' checked' : ''}>
            <span>${escapeHtml(product.name)}</span>
            <span class="filter-option__count">${formatUsd(product.price)}</span>
          </label>`).join('')}
      </div>
    </fieldset>
  `, async (data, form) => {
    if (!data.title) { toast('El título es obligatorio.', 'error'); return false; }
    const selected = [...form.querySelectorAll('input[name="products"]:checked')].map((input) => input.value);
    const updated = {
      id: item.id || `ofe-${Date.now().toString(36)}`,
      title: data.title.trim(),
      subtitle: (data.subtitle || '').trim(),
      badge: (data.badge || 'Oferta').trim(),
      discountPercent: Math.min(90, Math.max(0, Number(data.discountPercent) || 0)),
      until: data.until || '',
      active: data.active === 'on',
      productIds: selected
    };
    const offers = [...(state.catalog.offers || [])];
    const index = offers.findIndex((o) => o.id === item.id);
    if (index >= 0) offers[index] = updated;
    else offers.push(updated);
    state.catalog.offers = offers;
    await persistCatalog(isNew ? 'Oferta creada' : 'Oferta actualizada');
    render();
    return true;
  });
}

/* --------------------------------------------------------------- inicio -- */

boot();
