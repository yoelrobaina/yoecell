/**
 * Comprobaciones automáticas del proyecto (sin dependencias).
 *
 * Verifica las reglas de diseño de YoeCell, la integridad del catálogo y que
 * todos los enlaces internos y recursos referenciados existan.
 *
 * Uso: npm run check
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];

const fail = (message) => problems.push(message);

function read(file) {
  return readFileSync(resolve(root, file), 'utf8');
}

function walk(dir, filter = () => true) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === '.img-tmp') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/* 1. Sin tipografía monoespaciada --------------------------------------- */
const cssFiles = walk(resolve(root, 'assets/css'), (f) => extname(f) === '.css');
const monoPattern = /monospace|ui-monospace|courier|menlo|consolas|['"]SF Mono/i;
for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');
  const match = content.match(monoPattern);
  if (match) fail(`Tipografía monoespaciada en ${file.replace(`${root}/`, '')}: "${match[0]}"`);
}
notes.push(`Tipografía sin monoespaciada en ${cssFiles.length} archivo(s) CSS.`);

/* 2. Sin emojis en la interfaz -------------------------------------------- */
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
const textFiles = [
  ...walk(resolve(root, 'assets/js'), (f) => extname(f) === '.js'),
  ...walk(root, (f) => extname(f) === '.html')
].filter((f) => !f.includes(`${join('node_modules', '')}`));
for (const file of textFiles) {
  const content = readFileSync(file, 'utf8');
  const match = content.match(emojiPattern);
  if (match) fail(`Emoji en ${file.replace(`${root}/`, '')}: "${match[0]}"`);
}
notes.push(`Sin emojis en ${textFiles.length} archivo(s) de interfaz.`);

/* 3. Sin credenciales en el frontend ------------------------------------- */
const frontendFiles = walk(resolve(root, 'assets/js'), (f) => extname(f) === '.js');
const secretPatterns = [
  { pattern: /ADMIN_PASSWORD\s*=\s*['"][^'"]+['"]/, label: 'ADMIN_PASSWORD literal' },
  { pattern: /SESSION_SECRET\s*=\s*['"][^'"]+['"]/, label: 'SESSION_SECRET literal' },
  { pattern: /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i, label: 'API key literal' },
  { pattern: /Bearer\s+[A-Za-z0-9_\-]{20,}/, label: 'token Bearer' }
];
for (const file of frontendFiles) {
  const content = readFileSync(file, 'utf8');
  for (const { pattern, label } of secretPatterns) {
    if (pattern.test(content)) fail(`${label} en el frontend ${file.replace(`${root}/`, '')}`);
  }
}
notes.push(`Sin credenciales en ${frontendFiles.length} módulo(s) del frontend.`);

/* 4. Enlaces internos y recursos ------------------------------------------ */
const FRIENDLY_ROUTES = {
  '/catalogo': 'catalogo.html',
  '/ofertas': 'ofertas.html',
  '/informacion': 'informacion.html',
  '/contacto': 'contacto.html',
  '/admin': 'admin.html'
};

const htmlFiles = walk(root, (f) => extname(f) === '.html' && !f.includes('/node_modules/'));
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  const references = [...content.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const reference of references) {
    if (!reference.startsWith('/') || reference.startsWith('//')) continue;
    if (reference.startsWith('/telefono/') || reference.startsWith('/api/')) continue;
    const clean = reference.split('?')[0].split('#')[0];
    const friendly = FRIENDLY_ROUTES[clean];
    const target = friendly ? resolve(root, friendly) : resolve(root, `.${clean}`);
    if (!existsSync(target)) {
      fail(`Recurso inexistente ${reference} referenciado en ${file.replace(`${root}/`, '')}`);
    }
  }
}
notes.push(`Enlaces internos verificados en ${htmlFiles.length} página(s).`);

/* 5. Catálogo ------------------------------------------------------------- */
const catalog = JSON.parse(read('data/catalog.json'));
const slugs = new Set();
for (const product of catalog.products) {
  if (!product.name) fail(`Producto sin nombre: ${product.id}`);
  if (!(Number(product.price) >= 0)) fail(`Precio inválido en ${product.id}`);
  if (slugs.has(product.slug)) fail(`Slug duplicado: ${product.slug}`);
  slugs.add(product.slug);
  for (const image of product.images || []) {
    if (!existsSync(resolve(root, `.${image}`))) fail(`Imagen inexistente ${image} (${product.id})`);
  }
  if (!product.stock && product.status !== 'agotado') fail(`Stock 0 con estado "${product.status}" en ${product.id}`);
}
for (const category of catalog.categories) {
  if (!catalog.products.some((product) => product.category === category.id)) {
    fail(`Categoría sin productos: ${category.id}`);
  }
}
notes.push(`Catálogo: ${catalog.products.length} productos, ${catalog.categories.length} categorías, ${catalog.offers.length} ofertas.`);

/* 6. Número de WhatsApp en un solo lugar --------------------------------- */
const site = JSON.parse(read('data/site.json'));
if (!/^\d{8,15}$/.test(site.business.whatsappNumber)) {
  fail('El número de WhatsApp de data/site.json no tiene un formato válido.');
}
let numberOccurrences = 0;
for (const file of walk(root, (f) => ['.js', '.html', '.json', '.css'].includes(extname(f)))) {
  const content = readFileSync(file, 'utf8');
  if (content.includes(site.business.whatsappNumber)) numberOccurrences += 1;
}
notes.push(`Número de WhatsApp presente en ${numberOccurrences} archivo(s) (solo debe ser data/site.json).`);
if (numberOccurrences > 1) fail('El número de WhatsApp aparece en más de un archivo: debe estar en un solo lugar.');

/* 7. Páginas obligatorias -------------------------------------------------- */
const requiredPages = ['index.html', 'catalogo.html', 'telefono.html', 'ofertas.html', 'informacion.html', 'contacto.html', 'admin.html', '404.html'];
for (const page of requiredPages) {
  if (!existsSync(resolve(root, page))) fail(`Falta la página ${page}`);
}
notes.push(`${requiredPages.length} páginas obligatorias presentes.`);

/* Resultado ---------------------------------------------------------------- */
console.log('Comprobaciones del proyecto YoeCell');
console.log('-----------------------------------');
for (const note of notes) console.log(`  ok   ${note}`);
if (problems.length) {
  console.log('');
  for (const problem of problems) console.log(`  FALLA ${problem}`);
  console.log(`\n${problems.length} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log('\nTodo correcto.');
