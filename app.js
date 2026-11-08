/* YoeCell — lógica de la tienda (estática, sin backend).
   - Catálogo y panel leen/escriben en localStorage (clave yoecell_products_v1).
   - WhatsApp: número DEMO en UN SOLO lugar (WHATSAPP_NUMBER).
   - Admin: clave DEMO "admin123" (ver README). No es una credencial real. */

"use strict";

/* ---------- Configuración DEMO (un solo lugar) ---------- */
const WHATSAPP_NUMBER = "5350000000"; // DEMO — Yoel aún no ha dado el número real.
const ADMIN_PASSWORD = "admin123"; // DEMO — solo para probar el panel.
const LS_PRODUCTS = "yoecell_products_v1";
const LS_BRANDS = "yoecell_brands_v1";
const LS_SESSION = "yoecell_admin_session";
const INCLUDED = ["Cover protector", "Mica protectora", "Cargador, cable y adaptador", "Llave SIM"];
const PAYMENTS = ["USD", "CUP", "Zelle", "MEX", "IBAN"];

/* ---------- Utilidades ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const money = (n) => "$" + Number(n).toLocaleString("en-US");
const uid = (() => { let i = 0; return () => "g" + (++i); })();

let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ---------- Datos ---------- */
function seedProducts() {
  return JSON.parse(JSON.stringify(YOECELL_SEED));
}
function getProducts() {
  try {
    const raw = localStorage.getItem(LS_PRODUCTS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch (e) { /* localStorage no disponible: usar semilla */ }
  const seed = seedProducts();
  try { localStorage.setItem(LS_PRODUCTS, JSON.stringify(seed)); } catch (e) {}
  return seed;
}
function saveProducts(list) {
  try { localStorage.setItem(LS_PRODUCTS, JSON.stringify(list)); } catch (e) {}
}
function getBrands() {
  try {
    const raw = localStorage.getItem(LS_BRANDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch (e) {}
  const brands = [...new Set(getProducts().map((p) => p.brand))].sort();
  try { localStorage.setItem(LS_BRANDS, JSON.stringify(brands)); } catch (e) {}
  return brands;
}
function saveBrands(list) {
  try { localStorage.setItem(LS_BRANDS, JSON.stringify(list)); } catch (e) {}
}
function findProduct(id) {
  return getProducts().find((p) => p.id === id) || null;
}
function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "producto";
}

/* ---------- WhatsApp ---------- */
function waLink(message) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}
function waGeneral() {
  return waLink("Hola YoeCell, quiero consultar por un teléfono.");
}
function waProduct(p, colorName) {
  const variant = colorName ? " Variante: " + colorName + "." : "";
  return waLink(
    "Hola YoeCell, quiero comprar el " + p.brand + " " + p.name +
    " (" + p.storage + " GB, " + p.ram + " GB RAM) — " + money(p.price) + "." + variant +
    " ¿Sigue disponible?"
  );
}

/* ---------- Render del teléfono (SVG, imagen DEMO) ---------- */
function phoneSVG(p, colorHex, big) {
  const g = uid();
  const c = colorHex || (p.colors && p.colors[0] ? p.colors[0].hex : "#2b4eff");
  const brand = esc(p.brand.toUpperCase());
  const name = esc(p.name.replace(" (usado)", ""));
  const label = big ? "" : "";
  return (
    '<svg class="phone-render" viewBox="0 0 200 340" role="img" aria-label="Imagen de demostración del ' + esc(p.brand + " " + p.name) + '">' +
    "<defs><linearGradient id=\"" + g + "\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">" +
    "<stop offset=\"0\" stop-color=\"" + c + "\"/><stop offset=\"1\" stop-color=\"#0c1220\"/>" +
    "</linearGradient></defs>" +
    "<rect x=\"18\" y=\"4\" width=\"164\" height=\"332\" rx=\"30\" fill=\"#141a29\"/>" +
    "<rect x=\"24\" y=\"10\" width=\"152\" height=\"320\" rx=\"24\" fill=\"url(#" + g + ")\"/>" +
    "<rect x=\"84\" y=\"20\" width=\"32\" height=\"7\" rx=\"3.5\" fill=\"#0c1220\" opacity=\".55\"/>" +
    "<circle cx=\"100\" cy=\"23.5\" r=\"2.4\" fill=\"#0c1220\" opacity=\".8\"/>" +
    "<text x=\"100\" y=\"120\" text-anchor=\"middle\" fill=\"#ffffff\" font-family=\"Space Grotesk, sans-serif\" font-size=\"13\" font-weight=\"700\" letter-spacing=\"2\">" + brand + "</text>" +
    "<text x=\"100\" y=\"150\" text-anchor=\"middle\" fill=\"#ffffff\" font-family=\"Space Grotesk, sans-serif\" font-size=\"19\" font-weight=\"700\">" + name + "</text>" +
    "<text x=\"100\" y=\"172\" text-anchor=\"middle\" fill=\"rgba(255,255,255,.75)\" font-family=\"Inter, sans-serif\" font-size=\"11\">" + p.ram + " GB RAM · " + p.storage + " GB</text>" +
    "<g fill=\"#ffffff\"><rect x=\"82\" y=\"296\" width=\"4\" height=\"9\" rx=\"1\"/><rect x=\"89\" y=\"292\" width=\"4\" height=\"13\" rx=\"1\"/><rect x=\"96\" y=\"288\" width=\"4\" height=\"17\" rx=\"1\"/><rect x=\"103\" y=\"284\" width=\"4\" height=\"21\" rx=\"1\"/></g>" +
    "<text x=\"100\" y=\"322\" text-anchor=\"middle\" fill=\"rgba(255,255,255,.6)\" font-family=\"Inter, sans-serif\" font-size=\"9\" letter-spacing=\"3\">YOECELL</text>" +
    label +
    "</svg>"
  );
}

/* ---------- Tarjetas ---------- */
function stockInfo(p) {
  if (p.stock <= 0) return { cls: "out", text: "Agotado" };
  if (p.stock <= 2) return { cls: "low", text: "Quedan " + p.stock };
  return { cls: "ok", text: "Disponible" };
}
function badgesHTML(p) {
  let h = "";
  if (p.offer && p.oldPrice) h += '<span class="badge badge-offer">Oferta</span>';
  if (p.isNew) h += '<span class="badge badge-new">Nuevo modelo</span>';
  if (p.condition === "usado") h += '<span class="badge badge-used">Usado</span>';
  if (p.stock <= 0) h += '<span class="badge badge-out">Agotado</span>';
  return h;
}
function cardHTML(p) {
  const st = stockInfo(p);
  const old = p.oldPrice ? '<span class="price-old">' + money(p.oldPrice) + "</span>" : "";
  return (
    '<article class="card" data-id="' + esc(p.id) + '" tabindex="0" role="link" aria-label="' + esc(p.brand + " " + p.name) + ", " + money(p.price) + '">' +
    '<div class="card-media">' + phoneSVG(p) +
    '<div class="card-badges">' + badgesHTML(p) + '<span class="badge badge-demo">Foto DEMO</span></div></div>' +
    '<div class="card-body">' +
    '<div><span class="card-brand">' + esc(p.brand) + '</span>' +
    '<h3 class="card-name">' + esc(p.name) + "</h3></div>" +
    '<ul class="card-specs"><li>' + p.ram + " GB RAM</li><li>" + p.storage + " GB</li><li>" + esc(p.condition) + "</li></ul>" +
    '<div class="card-foot"><div class="price">' + money(p.price) + old + "<small>USD · o su equivalente</small></div>" +
    '<span class="stock ' + st.cls + '">' + st.text + "</span></div>" +
    '<div class="card-actions">' +
    '<a class="btn btn-dark" href="#/producto/' + esc(p.id) + '">Ver detalles</a>' +
    (p.stock > 0
      ? '<a class="btn btn-whatsapp" href="' + waProduct(p, p.colors && p.colors[0] ? p.colors[0].name : "") + '" target="_blank" rel="noopener">WhatsApp</a>'
      : '<button class="btn btn-ghost" type="button" disabled>Agotado</button>') +
    "</div></div></article>"
  );
}

/* ---------- Vistas ---------- */
function showView(name) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  const el = $("#view-" + name);
  if (el) el.classList.add("active");
  $$(".main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === name || (name === "producto" && a.dataset.nav === "catalogo"));
  });
  window.scrollTo(0, 0);
}
function setTitle(t) {
  document.title = t + " | YoeCell";
}

/* ---------- Inicio ---------- */
function renderHome() {
  const products = getProducts();
  $("#stat-count").textContent = products.length;
  const featured = products.filter((p) => p.featured).slice(0, 8);
  $("#featured-grid").innerHTML = featured.map(cardHTML).join("");
  const heroP = products.find((p) => p.id === "samsung-galaxy-s24") || products[0];
  $("#hero-phone").innerHTML = phoneSVG(heroP, heroP.colors[0].hex, true);
  bindCards($("#featured-grid"));
}

/* ---------- Catálogo ---------- */
const filters = { q: "", brand: "", min: "", max: "", ram: "", storage: "", condition: "", sort: "featured", offers: false, stock: false };

function applyFilters(list) {
  const q = filters.q.trim().toLowerCase();
  let out = list.filter((p) => {
    if (q && (p.brand + " " + p.name + " " + p.cpu).toLowerCase().indexOf(q) === -1) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.min !== "" && p.price < Number(filters.min)) return false;
    if (filters.max !== "" && p.price > Number(filters.max)) return false;
    if (filters.ram && p.ram < Number(filters.ram)) return false;
    if (filters.storage && p.storage < Number(filters.storage)) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (filters.offers && !(p.offer && p.oldPrice)) return false;
    if (filters.stock && p.stock <= 0) return false;
    return true;
  });
  if (filters.sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (filters.sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (filters.sort === "name") out.sort((a, b) => (a.brand + a.name).localeCompare(b.brand + b.name));
  else out.sort((a, b) => (b.featured - a.featured) || (a.price - b.price));
  return out;
}

function renderBrands() {
  const wrap = $("#f-brands");
  const brands = getBrands();
  let h = '<button class="chip' + (filters.brand === "" ? " on" : "") + '" type="button" data-brand="">Todas</button>';
  brands.forEach((b) => {
    h += '<button class="chip' + (filters.brand === b ? " on" : "") + '" type="button" data-brand="' + esc(b) + '">' + esc(b) + "</button>";
  });
  wrap.innerHTML = h;
  $$(".chip", wrap).forEach((chip) => {
    chip.addEventListener("click", () => {
      filters.brand = chip.dataset.brand;
      renderBrands();
      renderCatalog();
    });
  });
}

function renderCatalog() {
  const list = applyFilters(getProducts());
  $("#catalog-grid").innerHTML = list.map(cardHTML).join("");
  $("#catalog-empty").hidden = list.length > 0;
  $("#catalog-grid").hidden = list.length === 0;
  $("#result-count").innerHTML = "<b>" + list.length + "</b> de " + getProducts().length + " teléfonos";
  bindCards($("#catalog-grid"));
}

function clearFilters() {
  filters.q = ""; filters.brand = ""; filters.min = ""; filters.max = "";
  filters.ram = ""; filters.storage = ""; filters.condition = "";
  filters.sort = "featured"; filters.offers = false; filters.stock = false;
  $("#f-search").value = ""; $("#f-min").value = ""; $("#f-max").value = "";
  $("#f-ram").value = ""; $("#f-storage").value = ""; $("#f-condition").value = "";
  $("#f-sort").value = "featured"; $("#f-offers").checked = false; $("#f-stock").checked = false;
  renderBrands();
  renderCatalog();
}

function bindCards(root) {
  $$(".card", root).forEach((card) => {
    const go = (e) => {
      if (e.target.closest("a, button")) return;
      location.hash = "#/producto/" + card.dataset.id;
    };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.target.closest("a, button")) go(e);
    });
  });
}

/* ---------- Detalle ---------- */
let detailColor = 0;
function renderProduct(id) {
  const p = findProduct(id);
  const root = $("#product-detail");
  if (!p) {
    setTitle("Teléfono no encontrado");
    root.innerHTML = '<a class="back-link" href="#/catalogo">← Volver al catálogo</a>' +
      '<div class="empty"><h3>Ese teléfono no existe</h3><p>Puede que lo hayan eliminado del catálogo.</p>' +
      '<a class="btn btn-dark" href="#/catalogo">Ver catálogo</a></div>';
    return;
  }
  setTitle(p.brand + " " + p.name);
  detailColor = 0;
  const st = stockInfo(p);
  const color = p.colors[0];
  root.innerHTML =
    '<a class="back-link" href="#/catalogo">← Volver al catálogo</a>' +
    '<div class="product-layout">' +
    '<div><div class="gallery"><div id="gallery-phone" style="width:100%;display:flex;justify-content:center">' + phoneSVG(p, color.hex, true) + '</div>' +
    '<div class="color-picker" id="color-picker">' +
    p.colors.map((c, i) =>
      '<button class="color-dot' + (i === 0 ? " on" : "") + '" type="button" style="background:' + esc(c.hex) + '" aria-label="Color ' + esc(c.name) + '" data-i="' + i + '"></button>'
    ).join("") +
    '<span class="color-name" id="color-name">Color: ' + esc(color.name) + " · Foto DEMO</span>" +
    "</div></div></div>" +
    '<div class="product-info">' +
    '<span class="card-brand">' + esc(p.brand) + "</span>" +
    "<h1>" + esc(p.name) + "</h1>" +
    '<p class="lede">' + esc(p.description) + "</p>" +
    '<div class="price-block"><span class="price">' + money(p.price) + "</span>" +
    (p.oldPrice ? '<span class="price-old">' + money(p.oldPrice) + "</span>" : "") +
    '<span class="stock ' + st.cls + '">' + st.text + "</span></div>" +
    '<p class="price-note">Precio en USD. También aceptamos CUP, Zelle, MEX e IBAN (pregunta el equivalente al escribirnos).</p>' +
    '<table class="spec-table"><tbody>' +
    "<tr><th>Estado</th><td>" + esc(p.condition) + "</td></tr>" +
    "<tr><th>Memoria RAM</th><td>" + p.ram + " GB</td></tr>" +
    "<tr><th>Almacenamiento</th><td>" + p.storage + " GB</td></tr>" +
    "<tr><th>Pantalla</th><td>" + esc(p.screen) + "</td></tr>" +
    "<tr><th>Batería</th><td>" + esc(p.battery) + "</td></tr>" +
    "<tr><th>Cámara</th><td>" + esc(p.camera) + "</td></tr>" +
    "<tr><th>Procesador</th><td>" + esc(p.cpu) + "</td></tr>" +
    "</tbody></table>" +
    '<div class="included"><h3>Tu compra incluye</h3><ul>' +
    INCLUDED.map((it) => '<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>' + esc(it) + "</li>").join("") +
    "</ul></div>" +
    '<div class="buy-box">' +
    (p.stock > 0
      ? '<a class="btn btn-whatsapp" id="buy-wa" href="' + waProduct(p, color.name) + '" target="_blank" rel="noopener">Comprar por WhatsApp</a>'
      : '<button class="btn btn-ghost" type="button" disabled>Agotado por el momento</button>') +
    '<div class="share-row">' +
    '<button class="btn btn-ghost btn-sm" id="share-wa" type="button">Compartir por WhatsApp</button>' +
    '<button class="btn btn-ghost btn-sm" id="share-copy" type="button">Copiar enlace</button>' +
    "</div></div>" +
    '<p class="price-note" style="margin-top:14px">Garantía de una semana por defectos de fábrica. Entrega gratis en la ciudad; a otros municipios con costo adicional.</p>' +
    "</div></div>";

  $$("#color-picker .color-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.dataset.i);
      detailColor = i;
      $$("#color-picker .color-dot").forEach((d) => d.classList.remove("on"));
      dot.classList.add("on");
      const c = p.colors[i];
      $("#gallery-phone").innerHTML = phoneSVG(p, c.hex, true);
      $("#color-name").textContent = "Color: " + c.name + " · Foto DEMO";
      const buy = $("#buy-wa");
      if (buy) buy.href = waProduct(p, c.name);
    });
  });
  const shareText = "Mira este " + p.brand + " " + p.name + " en YoeCell: " + money(p.price) + " USD. " + location.href;
  $("#share-wa").addEventListener("click", () => {
    window.open(waLink(shareText), "_blank", "noopener");
  });
  $("#share-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Enlace copiado");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = location.href;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Enlace copiado"); } catch (e2) { toast("No se pudo copiar el enlace"); }
      ta.remove();
    }
  });
}

/* ---------- Admin ---------- */
function isAuthed() {
  try { return sessionStorage.getItem(LS_SESSION) === "1"; } catch (e) { return false; }
}
function renderAdmin() {
  setTitle("Panel de administración");
  const root = $("#admin-root");
  if (!isAuthed()) {
    root.innerHTML =
      '<div class="admin-card login-box"><h2>Panel de administración</h2>' +
      "<p>Acceso solo para el administrador de YoeCell.</p>" +
      '<p class="demo-hint"><strong>Demo:</strong> la clave es <strong>admin123</strong>. Es solo para probar el panel; no es una credencial real.</p>' +
      '<form id="login-form"><div class="field"><label for="admin-pass">Clave de administrador</label>' +
      '<input id="admin-pass" type="password" autocomplete="current-password" required></div>' +
      '<div id="login-error" class="form-error" hidden>Clave incorrecta. Inténtalo de nuevo.</div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Entrar al panel</button></div></form></div>';
    $("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("#admin-pass").value === ADMIN_PASSWORD) {
        try { sessionStorage.setItem(LS_SESSION, "1"); } catch (err) {}
        renderAdmin();
      } else {
        $("#login-error").hidden = false;
        $("#admin-pass").value = "";
        $("#admin-pass").focus();
      }
    });
    return;
  }

  const products = getProducts();
  const available = products.filter((p) => p.stock > 0).length;
  const value = products.reduce((s, p) => s + p.price * p.stock, 0);
  const offers = products.filter((p) => p.offer && p.oldPrice).length;

  root.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px">' +
    "<h2 style=\"font-family:var(--font-display);margin:0;font-size:26px\">Panel de administración</h2>" +
    '<button class="btn btn-ghost btn-sm" id="logout" type="button">Cerrar sesión</button></div>' +
    '<p style="color:var(--muted);margin:-8px 0 20px;font-size:14px">Demo local: los cambios se guardan solo en este navegador (localStorage). El cliente ve los cambios al recargar la tienda.</p>' +
    '<div class="stat-grid">' +
    '<div class="stat"><b>' + products.length + '</b><span>Productos</span></div>' +
    '<div class="stat"><b>' + available + '</b><span>Disponibles</span></div>' +
    '<div class="stat"><b>' + offers + '</b><span>En oferta</span></div>' +
    '<div class="stat"><b>' + money(value) + '</b><span>Valor del inventario</span></div>' +
    "</div>" +
    '<div class="admin-card"><h2 id="form-title">Añadir teléfono</h2><p>Completa los datos y guarda. La foto es una imagen de demostración generada según el color elegido.</p>' +
    '<form id="product-form"><input type="hidden" id="pf-id">' +
    '<div class="form-grid">' +
    '<div class="field full"><label for="pf-name">Nombre del modelo *</label><input id="pf-name" type="text" required placeholder="Ej. Galaxy A55"></div>' +
    '<div class="field"><label for="pf-brand">Marca *</label><input id="pf-brand" type="text" required list="brand-list" placeholder="Samsung, Xiaomi, Redmi…"><datalist id="brand-list">' + getBrands().map((b) => '<option value="' + esc(b) + '">').join("") + "</datalist></div>" +
    '<div class="field"><label for="pf-price">Precio (USD) *</label><input id="pf-price" type="number" min="1" step="1" required placeholder="299"></div>' +
    '<div class="field"><label for="pf-old">Precio anterior (USD, solo ofertas)</label><input id="pf-old" type="number" min="0" step="1" placeholder="Vacío si no es oferta"></div>' +
    '<div class="field"><label for="pf-stock">Unidades en inventario *</label><input id="pf-stock" type="number" min="0" step="1" required value="1"></div>' +
    '<div class="field"><label for="pf-ram">RAM (GB) *</label><select id="pf-ram"><option>4</option><option>6</option><option selected>8</option><option>12</option></select></div>' +
    '<div class="field"><label for="pf-storage">Almacenamiento (GB) *</label><select id="pf-storage"><option>64</option><option>128</option><option selected>256</option><option>512</option></select></div>' +
    '<div class="field"><label for="pf-condition">Estado *</label><select id="pf-condition"><option value="nuevo">Nuevo</option><option value="usado">Usado</option></select></div>' +
    '<div class="field"><label for="pf-color">Color principal (hex)</label><input id="pf-color" type="text" value="#2b4eff" placeholder="#2b4eff"></div>' +
    '<div class="field"><label for="pf-screen">Pantalla</label><input id="pf-screen" type="text" placeholder="6.5&quot; AMOLED, 120 Hz"></div>' +
    '<div class="field"><label for="pf-battery">Batería</label><input id="pf-battery" type="text" placeholder="5,000 mAh"></div>' +
    '<div class="field"><label for="pf-camera">Cámara</label><input id="pf-camera" type="text" placeholder="50 MP + 8 MP"></div>' +
    '<div class="field"><label for="pf-cpu">Procesador</label><input id="pf-cpu" type="text" placeholder="Snapdragon 685"></div>' +
    '<div class="field full"><label for="pf-desc">Descripción</label><textarea id="pf-desc" rows="2" placeholder="Descripción corta del equipo…"></textarea></div>' +
    '<label class="toggle"><input type="checkbox" id="pf-featured"> Destacado en inicio</label>' +
    '<label class="toggle"><input type="checkbox" id="pf-isnew"> Nuevo modelo</label>' +
    "</div>" +
    '<div class="form-actions"><button class="btn btn-primary" type="submit" id="pf-save">Guardar teléfono</button>' +
    '<button class="btn btn-ghost" type="button" id="pf-cancel" hidden>Cancelar edición</button></div>' +
    '<p class="hint" id="pf-msg"></p>' +
    "</form></div>" +
    '<div class="admin-card"><h2>Inventario</h2><p>Edita, marca ofertas o elimina productos. Los cambios se reflejan en la tienda al instante.</p>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Oferta</th><th>Acciones</th></tr></thead><tbody>' +
    products.map((p) =>
      "<tr><td><strong>" + esc(p.brand + " " + p.name) + "</strong><br><span style=\"color:var(--muted)\">" + p.ram + " GB · " + p.storage + " GB · " + esc(p.condition) + "</span></td>" +
      "<td>" + money(p.price) + (p.oldPrice ? "<br><s style=\"color:var(--muted-2)\">" + money(p.oldPrice) + "</s>" : "") + "</td>" +
      '<td><label class="toggle"><input type="checkbox" data-stock="' + esc(p.id) + '"' + (p.stock > 0 ? " checked" : "") + "> " + (p.stock > 0 ? p.stock + " disp." : "Agotado") + "</label></td>" +
      '<td><label class="toggle"><input type="checkbox" data-offer="' + esc(p.id) + '"' + (p.offer ? " checked" : "") + "> Oferta</label></td>" +
      '<td><div class="row-actions"><button class="mini-btn" type="button" data-edit="' + esc(p.id) + '">Editar</button>' +
      '<button class="mini-btn danger" type="button" data-del="' + esc(p.id) + '">Eliminar</button></div></td></tr>'
    ).join("") +
    "</tbody></table></div></div>" +
    '<div class="admin-card"><h2>Categorías (marcas)</h2><p>Las marcas aparecen como filtros en el catálogo.</p>' +
    '<div class="chip-row" style="margin-bottom:12px">' +
    getBrands().map((b) => '<span class="chip">' + esc(b) + ' <button class="link-btn" type="button" data-brand-del="' + esc(b) + '" aria-label="Eliminar marca ' + esc(b) + '" style="color:var(--danger)">×</button></span>').join("") +
    "</div>" +
    '<form id="brand-form" style="display:flex;gap:8px;max-width:420px"><input id="brand-new" type="text" placeholder="Nueva marca…" aria-label="Nueva marca" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:11px 12px">' +
    '<button class="btn btn-dark btn-sm" type="submit">Añadir</button></form></div>' +
    '<div class="admin-card"><h2>Datos de demostración</h2><p>Restablece el catálogo original de 12 teléfonos de ejemplo.</p>' +
    '<button class="btn btn-ghost" id="reset-demo" type="button">Restablecer catálogo DEMO</button></div>';

  $("#logout").addEventListener("click", () => {
    try { sessionStorage.removeItem(LS_SESSION); } catch (e) {}
    location.hash = "#/";
  });

  const form = $("#product-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#pf-name").value.trim();
    const brand = $("#pf-brand").value.trim();
    const price = Number($("#pf-price").value);
    const oldPrice = $("#pf-old").value === "" ? null : Number($("#pf-old").value);
    const stock = Math.max(0, Math.floor(Number($("#pf-stock").value)));
    const colorHex = /^#[0-9a-fA-F]{6}$/.test($("#pf-color").value.trim()) ? $("#pf-color").value.trim() : "#2b4eff";
    if (!name || !brand || !(price > 0)) {
      $("#pf-msg").textContent = "Revisa los campos: nombre, marca y un precio mayor que 0 son obligatorios.";
      $("#pf-msg").style.color = "var(--danger)";
      return;
    }
    if (oldPrice !== null && oldPrice <= price) {
      $("#pf-msg").textContent = "El precio anterior debe ser mayor que el precio de oferta.";
      $("#pf-msg").style.color = "var(--danger)";
      return;
    }
    const list = getProducts();
    const id = $("#pf-id").value;
    const data = {
      brand, name, price, oldPrice,
      ram: Number($("#pf-ram").value),
      storage: Number($("#pf-storage").value),
      condition: $("#pf-condition").value,
      stock,
      screen: $("#pf-screen").value.trim() || "No especificada",
      battery: $("#pf-battery").value.trim() || "No especificada",
      camera: $("#pf-camera").value.trim() || "No especificada",
      cpu: $("#pf-cpu").value.trim() || "No especificado",
      colors: [{ name: "Estándar", hex: colorHex }],
      featured: $("#pf-featured").checked,
      isNew: $("#pf-isnew").checked,
      offer: oldPrice !== null,
      description: $("#pf-desc").value.trim() || "Teléfono " + brand + " " + name + "."
    };
    if (id) {
      const i = list.findIndex((p) => p.id === id);
      if (i >= 0) list[i] = Object.assign({}, list[i], data);
      $("#pf-msg").textContent = "Teléfono actualizado.";
    } else {
      data.id = slugify(brand + "-" + name) + "-" + Date.now().toString(36);
      list.push(data);
      $("#pf-msg").textContent = "Teléfono añadido al catálogo.";
    }
    $("#pf-msg").style.color = "var(--good)";
    saveProducts(list);
    const brands = getBrands();
    if (!brands.includes(brand)) { brands.push(brand); brands.sort(); saveBrands(brands); }
    form.reset();
    $("#pf-id").value = "";
    $("#pf-cancel").hidden = true;
    $("#form-title").textContent = "Añadir teléfono";
    toast("Guardado. La tienda ya muestra el cambio.");
    renderAdmin();
  });

  $("#pf-cancel").addEventListener("click", () => {
    form.reset();
    $("#pf-id").value = "";
    $("#pf-cancel").hidden = true;
    $("#form-title").textContent = "Añadir teléfono";
    $("#pf-msg").textContent = "";
  });

  $$("[data-edit]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = findProduct(btn.dataset.edit);
      if (!p) return;
      $("#pf-id").value = p.id;
      $("#pf-name").value = p.name;
      $("#pf-brand").value = p.brand;
      $("#pf-price").value = p.price;
      $("#pf-old").value = p.oldPrice || "";
      $("#pf-stock").value = p.stock;
      $("#pf-ram").value = String(p.ram);
      $("#pf-storage").value = String(p.storage);
      $("#pf-condition").value = p.condition;
      $("#pf-color").value = p.colors && p.colors[0] ? p.colors[0].hex : "#2b4eff";
      $("#pf-screen").value = p.screen || "";
      $("#pf-battery").value = p.battery || "";
      $("#pf-camera").value = p.camera || "";
      $("#pf-cpu").value = p.cpu || "";
      $("#pf-desc").value = p.description || "";
      $("#pf-featured").checked = !!p.featured;
      $("#pf-isnew").checked = !!p.isNew;
      $("#form-title").textContent = "Editar: " + p.brand + " " + p.name;
      $("#pf-cancel").hidden = false;
      $("#pf-msg").textContent = "";
      window.scrollTo(0, 0);
      $("#pf-name").focus();
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = findProduct(btn.dataset.del);
      if (!p) return;
      if (!window.confirm("¿Eliminar " + p.brand + " " + p.name + " del catálogo?")) return;
      saveProducts(getProducts().filter((x) => x.id !== p.id));
      toast("Producto eliminado.");
      renderAdmin();
    });
  });

  $$("[data-stock]", root).forEach((cb) => {
    cb.addEventListener("change", () => {
      const list = getProducts();
      const p = list.find((x) => x.id === cb.dataset.stock);
      if (!p) return;
      p.stock = cb.checked ? Math.max(1, p.stock || 1) : 0;
      saveProducts(list);
      toast(cb.checked ? "Producto marcado disponible." : "Producto marcado agotado.");
      renderAdmin();
    });
  });

  $$("[data-offer]", root).forEach((cb) => {
    cb.addEventListener("change", () => {
      const list = getProducts();
      const p = list.find((x) => x.id === cb.dataset.offer);
      if (!p) return;
      if (cb.checked && !p.oldPrice) {
        p.oldPrice = Math.round(p.price * 1.2);
      }
      p.offer = cb.checked;
      if (!cb.checked) p.oldPrice = null;
      saveProducts(list);
      toast(cb.checked ? "Oferta activada (precio anterior generado)." : "Oferta desactivada.");
      renderAdmin();
    });
  });

  $$("[data-brand-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const b = btn.dataset.brandDel;
      if (getProducts().some((p) => p.brand === b)) {
        toast("Esa marca tiene productos en el catálogo; elimínalos primero.");
        return;
      }
      saveBrands(getBrands().filter((x) => x !== b));
      toast("Marca eliminada.");
      renderAdmin();
    });
  });

  $("#brand-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const b = $("#brand-new").value.trim();
    if (!b) return;
    const brands = getBrands();
    if (brands.includes(b)) { toast("Esa marca ya existe."); return; }
    brands.push(b);
    brands.sort();
    saveBrands(brands);
    toast("Marca añadida.");
    renderAdmin();
  });

  $("#reset-demo").addEventListener("click", () => {
    if (!window.confirm("¿Restablecer el catálogo DEMO original de 12 teléfonos? Se pierden los cambios.")) return;
    try {
      localStorage.removeItem(LS_PRODUCTS);
      localStorage.removeItem(LS_BRANDS);
    } catch (e) {}
    toast("Catálogo DEMO restablecido.");
    renderAdmin();
  });
}

/* ---------- Router ---------- */
function route() {
  const hash = location.hash || "#/";
  if (hash === "#condiciones") {
    showView("home");
    setTitle("YoeCell — Teléfonos Samsung, Xiaomi y Redmi");
    renderHome();
    setTimeout(() => {
      const el = document.getElementById("condiciones");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return;
  }
  if (hash === "#/" || hash === "") {
    showView("home");
    setTitle("YoeCell — Teléfonos Samsung, Xiaomi y Redmi");
    renderHome();
    return;
  }
  if (hash.indexOf("#/catalogo") === 0) {
    showView("catalogo");
    setTitle("Catálogo");
    const q = hash.split("?")[1] || "";
    filters.offers = /(^|&)ofertas=1(&|$)/.test(q);
    $("#f-offers").checked = filters.offers;
    renderBrands();
    renderCatalog();
    return;
  }
  if (hash.indexOf("#/producto/") === 0) {
    const id = decodeURIComponent(hash.replace("#/producto/", "").split("?")[0]);
    showView("producto");
    renderProduct(id);
    return;
  }
  if (hash === "#/admin") {
    showView("admin");
    renderAdmin();
    return;
  }
  showView("home");
  setTitle("YoeCell — Teléfonos Samsung, Xiaomi y Redmi");
  renderHome();
}

/* ---------- Inicio ---------- */
function init() {
  const wa = waGeneral();
  ["header-whatsapp", "hero-whatsapp", "footer-whatsapp"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = wa;
  });
  $("#header-search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      filters.q = e.target.value;
      $("#f-search").value = e.target.value;
      location.hash = "#/catalogo";
    }
  });
  $("#f-search").addEventListener("input", (e) => { filters.q = e.target.value; renderCatalog(); });
  $("#f-min").addEventListener("input", (e) => { filters.min = e.target.value; renderCatalog(); });
  $("#f-max").addEventListener("input", (e) => { filters.max = e.target.value; renderCatalog(); });
  $("#f-ram").addEventListener("change", (e) => { filters.ram = e.target.value; renderCatalog(); });
  $("#f-storage").addEventListener("change", (e) => { filters.storage = e.target.value; renderCatalog(); });
  $("#f-condition").addEventListener("change", (e) => { filters.condition = e.target.value; renderCatalog(); });
  $("#f-sort").addEventListener("change", (e) => { filters.sort = e.target.value; renderCatalog(); });
  $("#f-offers").addEventListener("change", (e) => { filters.offers = e.target.checked; renderCatalog(); });
  $("#f-stock").addEventListener("change", (e) => { filters.stock = e.target.checked; renderCatalog(); });
  $("#f-clear").addEventListener("click", clearFilters);
  $("#empty-clear").addEventListener("click", clearFilters);
  window.addEventListener("hashchange", route);
  route();
}

document.addEventListener("DOMContentLoaded", init);
