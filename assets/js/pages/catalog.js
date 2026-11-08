/**
 * Página de catálogo: búsqueda, filtros, orden y sincronización con la URL.
 */
import { icon } from '../icons.js';
import { escapeHtml, formatCup, formatUsd, tintFor } from '../ui.js';
import { countBy, filterProducts, productCard, sortProducts } from '../products.js';
import { generalLink } from '../whatsapp.js';

const STORAGE_KEYS = ['q', 'marca', 'condicion', 'categoria', 'ram', 'almacenamiento', 'maxPrecio', 'orden', 'oferta'];

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const state = {};
  for (const key of STORAGE_KEYS) {
    const value = params.get(key);
    if (value) state[key] = value;
  }
  return state;
}

function writeUrlState(state) {
  const params = new URLSearchParams();
  for (const key of STORAGE_KEYS) {
    const value = state[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','));
    } else {
      params.set(key, value);
    }
  }
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', url);
}

export function initCatalog({ site, catalog }) {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const state = readUrlState();
  const filters = {
    q: state.q || '',
    brands: state.marca ? state.marca.split(',').filter(Boolean) : [],
    conditions: state.condicion ? state.condicion.split(',').filter(Boolean) : [],
    rams: state.ram ? state.ram.split(',').filter(Boolean) : [],
    storages: state.almacenamiento ? state.almacenamiento.split(',').filter(Boolean) : [],
    category: state.categoria || 'smartphones',
    maxPrice: Number(state.maxPrecio) || 0,
    onlyAvailable: false,
    offer: state.oferta || ''
  };
  let sort = state.orden || 'destacados';

  const allProducts = catalog.products;
  const phones = allProducts.filter((p) => p.type === 'telefono');
  const baseList = () => (filters.category
    ? allProducts.filter((p) => p.category === filters.category)
    : allProducts);

  const searchInput = document.getElementById('catalog-search');
  const sortSelect = document.getElementById('catalog-sort');
  const countLabel = document.getElementById('catalog-count');
  const chipsRow = document.getElementById('catalog-chips');
  const filterPanel = document.getElementById('filters-panel');
  const filterButton = document.getElementById('filters-toggle');
  const maxPriceInput = document.getElementById('filter-max-price');

  // --- construcción del panel de filtros -----------------------------------
  function renderFilters() {
    if (!filterPanel) return;
    const current = baseList();
    const brandCounts = countBy(current, 'brand');
    const ramCounts = countBy(current, 'ram');
    const storageCounts = countBy(current, 'storage');
    const prices = current.map((p) => p.price);
    const maxAllowed = prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 1200;
    const minAllowed = prices.length ? Math.floor(Math.min(...prices) / 50) * 50 : 0;

    filterPanel.innerHTML = `
      <div class="filters__head">
        <span class="filters__title">Filtrar</span>
        <button class="icon-btn filters__close" type="button" id="filters-close" aria-label="Cerrar filtros" style="display:none">${icon('x')}</button>
      </div>

      <div class="filter-group">
        <div class="filter-group__label">Tipo de producto</div>
        <div class="filter-options">
          ${[['', 'Todos'], ['smartphones', 'Teléfonos'], ['accesorios', 'Accesorios']].map(([value, label]) => `
            <label class="filter-option">
              <input type="radio" name="categoria" value="${value}"${filters.category === value ? ' checked' : ''}>
              <span>${label}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-group__label">Marca</div>
        <div class="filter-options">
          ${brandCounts.map(([brand, count]) => `
            <label class="filter-option">
              <input type="checkbox" name="marca" value="${escapeHtml(brand)}"${filters.brands.includes(brand) ? ' checked' : ''}>
              <span>${escapeHtml(brand)}</span><span class="filter-option__count">${count}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-group__label">Estado</div>
        <div class="filter-options">
          ${[['nuevo', 'Nuevo'], ['usado', 'Usado']].map(([value, label]) => `
            <label class="filter-option">
              <input type="checkbox" name="condicion" value="${value}"${filters.conditions.includes(value) ? ' checked' : ''}>
              <span>${label}</span>
            </label>`).join('')}
          <label class="filter-option">
            <input type="checkbox" id="filter-available"${filters.onlyAvailable ? ' checked' : ''}>
            <span>Solo disponibles</span>
          </label>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-group__label">Memoria RAM</div>
        <div class="filter-options">
          ${ramCounts.map(([ram, count]) => `
            <label class="filter-option">
              <input type="checkbox" name="ram" value="${escapeHtml(ram)}"${filters.rams.includes(ram) ? ' checked' : ''}>
              <span>${escapeHtml(ram)}</span><span class="filter-option__count">${count}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-group__label">Almacenamiento</div>
        <div class="filter-options">
          ${storageCounts.map(([storage, count]) => `
            <label class="filter-option">
              <input type="checkbox" name="almacenamiento" value="${escapeHtml(storage)}"${filters.storages.includes(storage) ? ' checked' : ''}>
              <span>${escapeHtml(storage)}</span><span class="filter-option__count">${count}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-group__label"><span>Precio máximo</span><span id="filter-price-value">${filters.maxPrice ? formatUsd(filters.maxPrice) : 'Sin límite'}</span></div>
        <input class="input" type="range" id="filter-max-price" min="${minAllowed}" max="${maxAllowed}" step="10" value="${filters.maxPrice || maxAllowed}" style="padding:0">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-mute)">
          <span>${formatUsd(minAllowed)}</span><span>${formatUsd(maxAllowed)}</span>
        </div>
      </div>

      <button class="btn btn--sm btn--outline btn--block" type="button" id="filters-clear">Limpiar filtros</button>`;

    filterPanel.querySelectorAll('input[name="categoria"]').forEach((input) => {
      input.addEventListener('change', () => {
        filters.category = input.value;
        renderFilters();
        apply();
      });
    });
    filterPanel.querySelectorAll('input[name="marca"]').forEach((input) => {
      input.addEventListener('change', () => {
        filters.brands = [...filterPanel.querySelectorAll('input[name="marca"]:checked')].map((el) => el.value);
        apply();
      });
    });
    filterPanel.querySelectorAll('input[name="condicion"]').forEach((input) => {
      input.addEventListener('change', () => {
        filters.conditions = [...filterPanel.querySelectorAll('input[name="condicion"]:checked')].map((el) => el.value);
        apply();
      });
    });
    filterPanel.querySelectorAll('input[name="ram"]').forEach((input) => {
      input.addEventListener('change', () => {
        filters.rams = [...filterPanel.querySelectorAll('input[name="ram"]:checked')].map((el) => el.value);
        apply();
      });
    });
    filterPanel.querySelectorAll('input[name="almacenamiento"]').forEach((input) => {
      input.addEventListener('change', () => {
        filters.storages = [...filterPanel.querySelectorAll('input[name="almacenamiento"]:checked')].map((el) => el.value);
        apply();
      });
    });
    const available = filterPanel.querySelector('#filter-available');
    if (available) {
      available.addEventListener('change', () => {
        filters.onlyAvailable = available.checked;
        apply();
      });
    }
    const range = filterPanel.querySelector('#filter-max-price');
    const rangeValue = filterPanel.querySelector('#filter-price-value');
    if (range) {
      range.addEventListener('input', () => {
        rangeValue.textContent = formatUsd(range.value);
      });
      range.addEventListener('change', () => {
        const value = Number(range.value);
        filters.maxPrice = value >= maxAllowed ? 0 : value;
        apply();
      });
    }
    const clear = filterPanel.querySelector('#filters-clear');
    if (clear) {
      clear.addEventListener('click', () => {
        filters.brands = [];
        filters.conditions = [];
        filters.rams = [];
        filters.storages = [];
        filters.maxPrice = 0;
        filters.onlyAvailable = false;
        filters.q = '';
        if (searchInput) searchInput.value = '';
        renderFilters();
        apply();
      });
    }
    const close = filterPanel.querySelector('#filters-close');
    if (close) close.addEventListener('click', () => filterPanel.setAttribute('data-open', 'false'));
  }

  // --- resultados ------------------------------------------------------------
  function currentResults() {
    let list = filters.offer
      ? baseList().filter((p) => {
        const offer = (catalog.offers || []).find((o) => o.id === filters.offer);
        return offer && (offer.productIds || []).includes(p.id);
      })
      : baseList();
    list = filterProducts(list, filters);
    return sortProducts(list, sort);
  }

  function renderChips() {
    if (!chipsRow) return;
    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”` });
    filters.brands.forEach((b) => chips.push({ key: `marca:${b}`, label: b }));
    filters.conditions.forEach((c) => chips.push({ key: `condicion:${c}`, label: c === 'nuevo' ? 'Nuevo' : 'Usado' }));
    filters.rams.forEach((r) => chips.push({ key: `ram:${r}`, label: `${r} RAM` }));
    filters.storages.forEach((s) => chips.push({ key: `almacenamiento:${s}`, label: s }));
    if (filters.maxPrice) chips.push({ key: 'maxPrecio', label: `Hasta ${formatUsd(filters.maxPrice)}` });
    if (filters.onlyAvailable) chips.push({ key: 'disponible', label: 'Solo disponibles' });
    if (!chips.length) {
      chipsRow.innerHTML = '';
      return;
    }
    chipsRow.innerHTML = chips
      .map((chip) => `<button class="chip-filter" type="button" data-chip="${escapeHtml(chip.key)}">${escapeHtml(chip.label)} ${icon('x', { size: 13 })}</button>`)
      .join('');
    chipsRow.querySelectorAll('[data-chip]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.chip;
        if (key.startsWith('marca:')) filters.brands = filters.brands.filter((b) => b !== key.slice(6));
        else if (key.startsWith('condicion:')) filters.conditions = filters.conditions.filter((c) => c !== key.slice(10));
        else if (key.startsWith('ram:')) filters.rams = filters.rams.filter((r) => r !== key.slice(4));
        else if (key.startsWith('almacenamiento:')) filters.storages = filters.storages.filter((s) => s !== key.slice(14));
        else if (key === 'q') { filters.q = ''; if (searchInput) searchInput.value = ''; }
        else if (key === 'maxPrecio') filters.maxPrice = 0;
        else if (key === 'disponible') filters.onlyAvailable = false;
        renderFilters();
        apply();
      });
    });
  }

  function apply() {
    const results = currentResults();
    if (countLabel) {
      countLabel.innerHTML = `<strong>${results.length}</strong> ${results.length === 1 ? 'producto' : 'productos'}${filters.category === 'accesorios' ? ' de accesorios' : ''}`;
    }
    if (results.length) {
      grid.innerHTML = results.map((product) => productCard(product, site)).join('');
    } else {
      grid.innerHTML = `<div class="empty-state">
        <h3>No encontramos equipos con esos filtros</h3>
        <p>Prueba con menos filtros o escríbenos: puede que tengamos el modelo que buscas en camino.</p>
        <p style="margin-top:1.2rem"><a class="btn btn--signal" href="${generalLink(site, 'Consultar por un modelo que no aparece')}" target="_blank" rel="noopener">${icon('whatsapp')}Consultar por WhatsApp</a></p>
      </div>`;
    }
    renderChips();
    writeUrlState({
      q: filters.q,
      marca: filters.brands,
      condicion: filters.conditions,
      ram: filters.rams,
      almacenamiento: filters.storages,
      maxPrecio: filters.maxPrice,
      orden: sort === 'destacados' ? '' : sort,
      oferta: filters.offer,
      categoria: filters.category
    });
  }

  // --- eventos ---------------------------------------------------------------
  if (searchInput) {
    searchInput.value = filters.q;
    let timer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        filters.q = searchInput.value;
        apply();
      }, 220);
    });
  }

  if (sortSelect) {
    sortSelect.value = sort;
    sortSelect.addEventListener('change', () => {
      sort = sortSelect.value;
      apply();
    });
  }

  if (filterButton && filterPanel) {
    filterButton.addEventListener('click', () => {
      const open = filterPanel.getAttribute('data-open') === 'true';
      filterPanel.setAttribute('data-open', String(!open));
      document.body.classList.toggle('is-locked', !open);
    });
  }

  renderFilters();
  apply();

  // Título dinámico según filtros
  const title = document.getElementById('catalog-title');
  if (title) {
    if (filters.q) title.textContent = `Resultados para “${filters.q}”`;
    else if (filters.brands.length === 1) title.textContent = filters.brands[0];
    else if (filters.category === 'accesorios') title.textContent = 'Accesorios';
    else if (filters.category === 'smartphones') title.textContent = 'Todos los teléfonos';
  }
}
