/**
 * Genera sitemap.xml y robots.txt a partir del catálogo actual.
 * Uso: node scripts/generate-sitemap.mjs [url-base]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || process.env.SITE_URL || 'https://yoecell.vercel.app').replace(/\/$/, '');
const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));

const staticPages = [
  { path: '/', priority: '1.0', freq: 'daily' },
  { path: '/catalogo', priority: '0.9', freq: 'daily' },
  { path: '/ofertas', priority: '0.8', freq: 'weekly' },
  { path: '/informacion', priority: '0.6', freq: 'monthly' },
  { path: '/contacto', priority: '0.6', freq: 'monthly' }
];

const productPages = catalog.products
  .filter((product) => product.type === 'telefono')
  .map((product) => ({
    path: `/telefono/${product.slug}`,
    priority: product.featured ? '0.8' : '0.7',
    freq: 'weekly',
    lastmod: catalog.updatedAt
  }));

const entries = [...staticPages, ...productPages];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${base}${entry.path}</loc>
${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''}    <changefreq>${entry.freq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;

writeFileSync(resolve(root, 'sitemap.xml'), xml);
writeFileSync(resolve(root, 'robots.txt'), robots);
console.log(`sitemap.xml y robots.txt generados (${entries.length} URLs, base ${base}).`);
