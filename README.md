# YoeCell

Tienda web de teléfonos móviles y accesorios con catálogo, filtros, fichas de producto,
integración con WhatsApp y panel de administración protegido.

El proyecto es **código estático (HTML + CSS + JavaScript con módulos ES) sin paso de compilación**:
se sube tal cual a Vercel (o a cualquier hosting estático) y funciona. La única parte que necesita
servidor es el panel de administración, resuelto con funciones *serverless* sin dependencias.

> Todos los datos del repositorio son **DEMO**: precios, existencias, fotografías, dirección,
> correo y número de WhatsApp (`+53 5 000 0000`) son de ejemplo y están marcados como tales en la
> interfaz. Antes de publicar hay que sustituirlos (ver [Datos que debes cambiar](#datos-que-debes-cambiar)).

---

## 1. Índice

- [Tecnologías](#2-tecnologías)
- [Puesta en marcha](#3-puesta-en-marcha)
- [Estructura del proyecto](#4-estructura-del-proyecto)
- [Panel de administración](#5-panel-de-administración)
- [Variables de entorno](#6-variables-de-entorno)
- [Despliegue en Vercel](#7-despliegue-en-vercel)
- [Persistencia del catálogo](#8-persistencia-del-catálogo)
- [Datos que debes cambiar](#9-datos-que-debes-cambiar)
- [SEO y redes sociales](#10-seo-y-redes-sociales)
- [Seguridad](#11-seguridad)
- [Pruebas](#12-pruebas)
- [Scripts disponibles](#13-scripts-disponibles)
- [Sistema de diseño](#14-sistema-de-diseño)
- [Limitaciones conocidas](#15-limitaciones-conocidas)

---

## 2. Tecnologías

| Capa | Tecnología | Motivo |
| --- | --- | --- |
| Interfaz | HTML5 + CSS3 + JavaScript (módulos ES nativos) | Sin framework ni bundler: cero coste de mantenimiento y carga muy rápida. |
| Iconos | SVG de línea generados en `assets/js/icons.js` | Consistentes, sin dependencias ni fuentes de iconos. |
| Tipografía | Sora (display) + Inter (texto), autoalojadas | Sin peticiones a terceros, sin problemas de privacidad ni de velocidad. |
| Datos | `data/catalog.json` y `data/site.json` | Formato simple, editable y versionable con Git. |
| Backend | Funciones serverless de Vercel (`api/`, runtime Node.js) | Solo lo necesario para autenticar y guardar; coste cero en el plan gratuito. |
| Servidor local | `serve.js` (módulos nativos de Node, sin dependencias) | Reproduce el comportamiento de Vercel en local. |
| Pruebas | `node:test` + Playwright (opcional) | Integración contra el servidor real y recorrido end-to-end en navegador. |

El sitio **no necesita base de datos, ni bundler, ni framework, ni servicios de pago**.

---

## 3. Puesta en marcha

Requisitos: **Node.js 18.17 o superior**. No hay dependencias obligatorias para ver el sitio.

```bash
# 1) Clonar o entrar en la carpeta del proyecto
cd yoecell

# 2) Arrancar el servidor local (sitio + API de administración)
npm start
# → http://localhost:3000
```

El servidor imprime en consola:

```
  Panel de administración: /admin
  Contraseña temporal de esta ejecución: 9Kx2mQ7fZa
  (define ADMIN_PASSWORD en el entorno para fijarla)
```

Si no defines `ADMIN_PASSWORD`, se genera una contraseña aleatoria **solo para esa ejecución**
(no hay ninguna credencial escrita en el código). Para fijar una contraseña:

```bash
ADMIN_PASSWORD="mi-contrasena-larga" npm start
```

O con un `.env.local` (no se versiona; ver `.gitignore`):

```bash
cp .env.example .env.local
# edita .env.local y exporta sus variables antes de arrancar
```

Otros comandos habituales:

```bash
npm run check      # comprueba reglas de diseño, enlaces, catálogo y credenciales
npm test           # pruebas de integración y de contenido (24 pruebas)
npm run sitemap    # regenera sitemap.xml y robots.txt
npm run images     # regenera las imágenes de producto (requiere Chromium)
npm run seed       # regenera el catálogo DEMO de ejemplo
```

> Para desplegar no hace falta compilar nada: el repositorio **es** el artefacto.

---

## 4. Estructura del proyecto

```
.
├── index.html              Portada
├── catalogo.html           Catálogo con filtros, búsqueda y orden
├── telefono.html           Ficha de producto (funciona en /telefono/<slug>)
├── ofertas.html            Promociones activas
├── informacion.html        Condiciones de compra, pagos y FAQ
├── contacto.html           Canales de atención y formulario
├── admin.html              Panel de administración (/admin)
├── 404.html                Página de error
├── assets/
│   ├── css/styles.css      Sistema de diseño completo
│   ├── css/fonts.css       Declaraciones @font-face (fuentes locales)
│   ├── fonts/              Sora e Inter autoalojadas (.woff2)
│   ├── img/                Imágenes de producto generadas + tarjeta social
│   └── js/
│       ├── main.js         Arranque de las páginas públicas
│       ├── store.js        Capa de datos (archivos + API + modo local)
│       ├── ui.js           Cabecera, pie, avisos y utilidades de formato
│       ├── products.js     Tarjetas de producto y filtros
│       ├── whatsapp.js     Mensajes y enlaces wa.me
│       ├── icons.js        Iconos SVG de línea
│       └── pages/          Lógica de cada página (home, catálogo, producto…)
├── api/                    Funciones serverless de Vercel
│   ├── session.js          Inicio/cierre de sesión del administrador
│   ├── products.js         Lectura y guardado del catálogo (protegido)
│   ├── site.js             Lectura y guardado de la configuración (protegido)
│   └── _lib/               Utilidades compartidas (auth, http, persistencia)
├── data/
│   ├── catalog.json        Productos, categorías y ofertas
│   └── site.json           Negocio, WhatsApp, pagos, condiciones y FAQ
├── scripts/                Utilidades de mantenimiento (imágenes, sitemap, checks)
├── tests/                  Pruebas con node:test
├── serve.js                Servidor local (estático + API)
├── vercel.json             Reglas de despliegue, reescrituras y cabeceras
└── package.json            Scripts del proyecto (sin dependencias obligatorias)
```

---

## 5. Panel de administración

Ruta: **`/admin`** (en local `http://localhost:3000/admin`).

Funciones disponibles:

| Sección | Qué permite hacer |
| --- | --- |
| **Resumen** | Totales del catálogo, unidades en inventario, valor de la mercadería, agotados, stock bajo y accesos rápidos. |
| **Productos** | Listado con búsqueda y filtro; **editar precio, existencias, estado (disponible / últimas unidades / agotado) y condición** en línea; **añadir**, **editar** y **eliminar** teléfonos y accesorios; cambiar **fotografías** (URL o carga de archivo), especificaciones, accesorios incluidos, colores, descripción y etiquetas; marcar **destacado** o **novedad**. |
| **Categorías** | Crear, renombrar, reordenar y eliminar categorías (no se puede eliminar una que tenga productos). |
| **Ofertas** | Crear y editar promociones: título, subtítulo, etiqueta, **descuento en %**, productos incluidos, fecha de fin y estado activo/pausada. |
| **Inventario** | Ajuste rápido de existencias (+ / −), estado de cada referencia y aviso de agotados. |
| **Ajustes** | Datos del negocio: **número de WhatsApp**, número visible, ciudad, dirección, horarios, correo, redes sociales, **tasa CUP**, condiciones (garantía, entregas, configuración), métodos de pago y preguntas frecuentes. |
| **Copia de seguridad** | Exportar e importar el catálogo completo en JSON. |

Cómo se guarda:

- **Con API disponible** (Vercel o `npm start`): el catálogo se guarda en el servidor
  (`data/catalog.json`) y, en Vercel con GitHub configurado, se publica como **commit**.
- **Sin API** (hosting 100 % estático): los cambios se guardan en el `localStorage` del navegador y
  la interfaz lo avisa claramente en la barra superior. Sirve para probar, no para producción.

### Acceso y sesión

- La contraseña se valida **siempre en el servidor** (`ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`).
  **No hay credenciales en el frontend.**
- La sesión es una **cookie `httpOnly`, `SameSite=Strict`, firmada con HMAC-SHA256** (`SESSION_SECRET`),
  con validez de 8 horas.
- Hay un **límite de 6 intentos fallidos por IP** en 10 minutos.
- Las peticiones de escritura verifican el **origen** (protección CSRF).

---

## 6. Variables de entorno

Todas se definen **en el servidor** (Vercel: *Project → Settings → Environment Variables*).

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Sí (producción) | Contraseña del panel en texto plano. Alternativa: `ADMIN_PASSWORD_HASH`. |
| `ADMIN_PASSWORD_HASH` | No | Hash `scrypt$<sal>$<hash>`. Preferible. Se genera con `node -e "import('./api/_lib/auth.js').then(m=>console.log(m.hashPassword('TU_CONTRASENA')))"`. |
| `SESSION_SECRET` | Sí (producción) | Secreto de firma de la cookie (32+ caracteres aleatorios). Si falta en producción, el login falla de forma segura. |
| `GITHUB_TOKEN` | No | Token de GitHub con permiso de escritura en el repositorio del catálogo. |
| `GITHUB_REPO` | No | `usuario/repositorio` donde se guarda `data/catalog.json`. |
| `GITHUB_BRANCH` | No | Rama por defecto: `main`. |
| `PORT` | No | Puerto del servidor local: `3000` por defecto. |

`.env.example` contiene la plantilla con comentarios.

---

## 7. Despliegue en Vercel

El proyecto ya incluye `vercel.json` con las reescrituras de URL amigables y las cabeceras de
seguridad, así que el despliegue es directo.

### Opción A — desde la CLI (recomendada)

```bash
npm i -g vercel
vercel login
vercel            # vista previa
vercel --prod     # producción
```

Antes del primer despliegue, define las variables en el panel de Vercel
(*Settings → Environment Variables*), o en un `.env.local` que Vercel sube con `--env`/`--prod`
si lo pides explícitamente. **Nunca subas el `.env.local` al repositorio.**

### Opción B — desde GitHub

1. Sube el proyecto a un repositorio de GitHub.
2. En Vercel: *Add New → Project → Import* el repositorio.
3. Vercel detecta el framework "Other" y usa `vercel.json` tal cual. **No hay build command**
   (déjalo vacío) y el output directory es la raíz del proyecto.
4. Añade las variables de entorno y despliega.

### Qué se publica

- Sitio estático: HTML, CSS, JS, fuentes e imágenes desde la raíz del repositorio.
- API: `api/session.js`, `api/products.js` y `api/site.js` se despliegan como funciones
  serverless (Node.js 20) en `/api/*`.
- Reglas de URL (`vercel.json`):
  `/catalogo` → `catalogo.html`, `/ofertas`, `/informacion`, `/contacto`, `/admin` y
  `/telefono/<slug>` → `/telefono.html?id=<slug>`.

### Alternativas de hosting

- **Netlify / Cloudflare Pages**: funcionan como hosting estático (el sitio público va completo),
  pero las funciones `api/` son específicas de Vercel. En ese caso el panel funciona en
  **modo local de navegador** salvo que configures otra API.
- **Servidor propio** (Nginx, Apache, cPanel): sube el contenido y sirve `/api/*` con Node
  (`node serve.js` detrás de un proxy inverso).

---

## 8. Persistencia del catálogo

`api/_lib/store.js` elige el modo automáticamente:

1. **GitHub** (si existen `GITHUB_TOKEN` y `GITHUB_REPO`): cada guardado del panel se convierte en
   un commit en `data/catalog.json`, y la web pública lee ese archivo. Es la opción gratuita y
   recomendada en Vercel: el catálogo queda versionado y se puede revisar con un pull request.
   - Token: *GitHub → Settings → Developer settings → Personal access tokens* con permiso
     `contents: write` sobre el repositorio indicado.
2. **Sistema de archivos** (si `data/` es escribible): útil en local (`npm start`) y en
   `vercel dev`. En Vercel el sistema de archivos es de solo lectura, así que no aplica.
3. **Sin persistencia**: la API responde `503` y el panel avisa de que los cambios quedan en el
   navegador.

Alternativas para mayor escala: Vercel Blob, Vercel KV o Postgres (cambiar solo la función
`writeData` en `api/_lib/store.js`).

---

## 9. Datos que debes cambiar

| Dato | Dónde | Nota |
| --- | --- | --- |
| **Número de WhatsApp** | `data/site.json` → `business.whatsappNumber` | **Es el único lugar del código.** Se cambia también desde *Panel → Ajustes*. Sin dígitos de país (`5350000000`). |
| Número visible | `data/site.json` → `business.whatsappDisplay` | Texto que ve el cliente (por ejemplo `+53 5 123 4567`). |
| Etiqueta DEMO | `data/site.json` → `business.whatsappLabel` | Borra `DEMO` cuando pongas el número real. |
| Catálogo | `data/catalog.json` o el panel | Precios, existencias, fotos, especificaciones. |
| Tasa CUP | `data/site.json` → `cupRate` | Referencia para el precio aproximado en CUP. |
| Dirección, horarios, redes | `data/site.json` → `business` | También editables desde el panel. |
| Fotografías reales | Panel → Producto → Imágenes | Puedes subir un archivo (se guarda en base64) o usar una URL. |
| Dominio y sitemap | `scripts/generate-sitemap.mjs` | `node scripts/generate-sitemap.mjs https://tu-dominio.com`. |
| Etiquetas de demo | `data/*.json` → `demo` | Póngalas en `false` cuando el catálogo sea real. |

Las imágenes de producto del repositorio son **maquetas generadas por el propio proyecto**
(`npm run images`), no fotografías de equipos reales: sustitúyelas antes de publicar.

---

## 10. SEO y redes sociales

- `<title>`, `meta description`, `canonical`, Open Graph y Twitter Card en todas las páginas.
- **Datos estructurados JSON-LD**: `Store` (Organization) en la portada y `Product` + `Offer` con
  precio y disponibilidad en cada ficha, generados en tiempo real.
- **URLs amigables**: `/catalogo`, `/ofertas`, `/informacion`, `/contacto` y `/telefono/<slug>`.
- **Sitemap** (`sitemap.xml`) con todas las fichas y **robots.txt** que excluye `/admin` y `/api/`.
- **Botones de compartir** en cada producto: WhatsApp, Facebook, copiar enlace y el diálogo
  nativo del móvil (`navigator.share`).
- **Tarjeta social** (`assets/img/og-default.png`, 1200×630) usada en Facebook, Instagram, TikTok
  y WhatsApp al compartir el enlace.
- Imágenes con `width`/`height` declarados (evita saltos de maquetación), `loading="lazy"` en el
  catálogo y fuentes precargadas.
- Enlace a los perfiles de Instagram, Facebook y TikTok para captar el tráfico de redes.

---

## 11. Seguridad

- Contraseña del administrador **solo en el servidor** (variable de entorno), nunca en el código
  del frontend. Comparación con `timingSafeEqual` y soporte de hash `scrypt`.
- Cookie de sesión `httpOnly` + `SameSite=Strict` + `Secure` en producción, firmada con HMAC-SHA256.
- Limitación de intentos de acceso por IP y verificación de origen en las escrituras (CSRF).
- Validación y normalización **en el servidor** de todo el catálogo y la configuración
  (longitudes máximas, tipos, slugs únicos, precios no negativos, sanitización de URLs de imagen).
- El servidor local impide el acceso fuera de la carpeta pública (`..` bloqueado).
- Cabeceras de seguridad en `vercel.json`: `Content-Security-Policy`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- El sitio **no almacena datos personales**: los formularios solo componen un mensaje de WhatsApp;
  no hay cookies de seguimiento ni base de datos de clientes.
- `npm run check` falla si aparece una credencial en el frontend, una tipografía monoespaciada,
  un emoji en la interfaz o el número de WhatsApp duplicado en otro archivo.

---

## 12. Pruebas

```bash
npm test        # 24 pruebas: integración con la API + contenido y SEO
npm run check   # reglas de diseño, enlaces, catálogo y credenciales
npm run test:e2e   # 34 comprobaciones en navegador real (requiere Playwright)
```

- **Integración** (`tests/api.test.mjs`): arranca el servidor real y comprueba portada, rutas
  amigables, 404, bloqueo de path traversal, login con contraseña incorrecta y correcta, cookie
  `httpOnly`/`SameSite`, bloqueo de la API sin sesión, guardado y lectura del catálogo, rechazo de
  catálogos inválidos y cierre de sesión.
- **Contenido y SEO** (`tests/site.test.mjs`): metadatos de cada página, `noindex` del panel,
  campos obligatorios del catálogo, métodos de pago, marcas de DEMO, sitemap, robots.txt, existencia
  de las imágenes y reglas de diseño.
- **Navegador** (`scripts/browser-check.mjs`, opcional): portada, buscador, filtros, orden por
  precio, ficha de producto, cambio de variante (verifica el mensaje de WhatsApp), galería, login
  del panel, edición de precio en línea, ajuste de inventario, alta y baja de productos, menú
  móvil, cajón de filtros y **cero errores de consola**. Deja capturas en `.screenshots/`.

Para las pruebas de navegador:

```bash
npm install --save-dev playwright
npm run test:e2e
```

El script usa el Chromium de Playwright si está descargado; si no, define `CHROME_PATH`.

---

## 13. Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm start` | Servidor local (sitio + API). |
| `npm run check` | Comprobaciones automáticas del proyecto. |
| `npm test` | Pruebas de integración y de contenido. |
| `npm run test:e2e` | Recorrido end-to-end con navegador real. |
| `npm run images` | Regenera las maquetas de producto y la tarjeta social (usa Chromium headless). |
| `npm run seed` | Regenera el catálogo DEMO de ejemplo. |
| `npm run sitemap` | Regenera `sitemap.xml` y `robots.txt`. |

---

## 14. Sistema de diseño

- **Paleta**: tinta profunda `#0b1017`, papel frío `#f4f7fb`, señal cian `#00b8ff`, índigo `#5a5bff`,
  ámbar `#ffb020` (solo ofertas) y verde `#12b981` (disponibilidad).
- **Tipografía**: Sora para titulares y precios (con cifras tabulares), Inter para el texto.
  **Sin tipografía monoespaciada** en toda la interfaz.
- **Iconos**: SVG de línea de 1,6 px dibujados a medida (`assets/js/icons.js`). **Sin emojis**.
- **Detalles de marca**: bandas diagonales, marcos con degradado en los botones principales y
  etiquetas de estado (`Nuevo`, `Usado`, `Últimas unidades`, `Agotado`, `DEMO`).
- **Responsive**: pensado primero para móvil (390 px), con adaptación a tablet y escritorio;
  filtros en cajón en móvil, menú desplegable y botón flotante de WhatsApp que aparece al
  desplazar.
- **Accesibilidad**: foco visible, `aria-current`, `aria-pressed`, `aria-live` en los resultados,
  enlace de salto al contenido, contraste alto y soporte de `prefers-reduced-motion`.

---

## 15. Limitaciones conocidas

1. **Las sesiones no se pueden revocar individualmente**: la cookie está firmada y caduca a las
   8 horas; «Salir» la elimina del navegador, pero el token sigue siendo válido hasta que caduca.
   Para invalidar todas las sesiones, cambia `SESSION_SECRET` y vuelve a desplegar.
2. **En Vercel la persistencia requiere GitHub (o un backend)**: el sistema de archivos de las
   funciones es de solo lectura. Sin configurar `GITHUB_TOKEN`/`GITHUB_REPO`, el panel avisa y
   funciona solo en el navegador.
3. **El catálogo se pinta en el cliente**: el HTML inicial no incluye los productos. Google
   ejecuta JavaScript, pero para un SEO máximo conviene un paso de prerenderizado (el proyecto ya
   tiene `scripts/seed-catalog.mjs` y `scripts/generate-sitemap.mjs` como base para añadirlo).
4. **Las imágenes son maquetas generadas**, no fotos reales de los equipos.
5. **Sin تعدaño de pedidos ni pagos en línea**: el canal es WhatsApp, tal y como pide el encargo.
6. **El número de WhatsApp es de ejemplo** hasta que se sustituya por el real.
