# YoeCell — Tienda de teléfonos (versión Chichi)

Tienda web estática para **YoeCell**, negocio de venta de teléfonos móviles Samsung, Xiaomi y Redmi. El canal de venta es WhatsApp: el cliente elige el teléfono y el botón genera el mensaje de compra automáticamente.

> **DEMO** — Esta es una tienda de demostración construida para la competencia de diseño Chichi vs OpenCode. Productos, precios, fotos y número de WhatsApp son datos de ejemplo. Nada de lo que se muestra es una oferta real.

## Qué incluye

- **Inicio:** presentación, destacados, ofertas, cómo comprar y condiciones comerciales.
- **Catálogo:** 12 teléfonos DEMO con buscador y filtros funcionales por marca, precio (mín/máx), RAM, almacenamiento, estado (nuevo/usado), solo ofertas y solo disponibles. Orden por destacados, precio o nombre.
- **Ficha de producto:** galería con selector de color (variante), descripción, especificaciones, accesorios incluidos, garantía, métodos de pago y botón de compra por WhatsApp con mensaje prellenado (producto, precio y variante).
- **WhatsApp:** botones en cabecera, hero, tarjetas y fichas. El mensaje incluye nombre, precio y variante. El número está en **un solo lugar** del código (`WHATSAPP_NUMBER` en `app.js`).
- **Condiciones comerciales:** cada teléfono incluye cover, mica, cargador/cable/adaptador y llave SIM; garantía de 1 semana por defectos de fábrica; configuración de apps si compra en la dirección; entrega gratis en la ciudad y con costo a otros municipios. Pagos: USD, CUP, Zelle, MEX, IBAN.
- **Panel de administración** (`#/admin`): añadir, editar y eliminar teléfonos; cambiar precios; marcar ofertas; marcar disponible/agotado; gestionar marcas (categorías); estadísticas y valor de inventario; restablecer el catálogo DEMO. Los datos se guardan en `localStorage` del navegador.
- **Compartir:** compartir por WhatsApp y copiar enlace en cada ficha.
- **SEO básico:** título, descripción, Open Graph, Twitter Card, `robots.txt`, `sitemap.xml` y datos estructurados (JSON-LD).
- **Responsive:** prioridad móvil, verificado a 390 px y 1280 px, sin desbordamiento horizontal.

## Tecnologías

- HTML + CSS + JavaScript, sin paso de build y sin dependencias de servidor.
- Datos en `localStorage` (sin base de datos ni backend).
- Tipografías autoalojadas: Space Grotesk (display) e Inter (texto), en `fonts/` (sin dependencia externa, carga rápida).
- Imágenes de producto: renders SVG generados en el navegador (marcados como DEMO), sin fotos externas.

## Instalación y uso local

No hace falta instalar nada. Solo sirve la carpeta con cualquier servidor estático:

```bash
cd yoecell-chichi
python3 -m http.server 8000
```

Y abre `http://localhost:8000` en el navegador.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project → Import** el repositorio.
3. Framework Preset: **Other**. No hay comando de build ni de instalación.
4. Deploy. El sitio queda en `https://<tu-proyecto>.vercel.app`.

No hay variables de entorno ni secretos que configurar.

## Panel de administración

Entra a `#/admin` (enlace en el pie de página).

- **Clave DEMO: `admin123`**. Es solo para probar el panel en esta demostración. No es una credencial real ni protege datos reales: cualquiera que abra el panel en este navegador puede verla en el código.
- Los cambios se guardan solo en el navegador donde se hacen (localStorage). No hay usuarios ni sincronización entre dispositivos.

## Qué es DEMO (pendiente de datos reales)

| Elemento | Estado |
|---|---|
| Número de WhatsApp | Placeholder `+53 5 000 0000` en `WHATSAPP_NUMBER` (`app.js`). Yoel debe dar el número real. |
| Productos y precios | 12 teléfonos inventados, en USD. |
| Fotos de producto | Renders SVG generados, etiquetados "Foto DEMO". |
| Stock y disponibilidad | Inventados. |
| Clave del admin | `admin123`, solo demostrativa. |
| Dominio en metadatos | `yoecell-demo.vercel.app` (placeholder). |

## Pendiente (requiere decisión o datos de Yoel)

- Número comercial real de WhatsApp.
- Catálogo real: modelos, precios en USD, stock y fotos de los equipos.
- Dominio definitivo para el `canonical` y Open Graph.
- Backend real (por ejemplo Supabase) si se quiere que el panel sincronice entre dispositivos y que los cambios no dependan del navegador. Hoy el panel es local por diseño (cero costo).

## Limitaciones conocidas

- El routing es por hash (`#/catalogo`, `#/producto/<id>`): las fichas no tienen URL propia indexable por separado; el `sitemap.xml` solo lista la raíz.
- Las fotos son ilustraciones SVG, no fotografías reales de los equipos.
- Sin carrito: la compra se cierra por WhatsApp, como pide el brief.
- El panel guarda en `localStorage`: si se borran los datos del navegador, el catálogo vuelve a los 12 productos DEMO.

## Estructura

```
yoecell-chichi/
├── index.html      # Estructura y vistas (inicio, catálogo, ficha, admin)
├── styles.css      # Sistema de diseño (una sola identidad visual)
├── app.js          # Routing, filtros, ficha, WhatsApp, panel admin
├── products.js     # Catálogo DEMO (12 teléfonos)
├── robots.txt
├── sitemap.xml
└── README.md
```

## Pruebas realizadas (2026-11-07)

Servidor local + Chromium (Playwright) a 390 px y 1280 px:

- Sin errores de consola en inicio, catálogo, ficha y admin.
- Búsqueda por texto, filtros de marca/precio/RAM/almacenamiento/estado, solo ofertas y solo disponibles: funcionan y actualizan el contador.
- Ficha de producto: cambio de color actualiza la imagen y el mensaje de WhatsApp.
- Admin: login con clave incorrecta rechazado; login DEMO aceptado; añadir, editar, eliminar, cambiar stock y ofertas actualizan el catálogo visible.
- Sin desbordamiento horizontal a 390 px ni a 1280 px.
