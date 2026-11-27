import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('Missing SSR bundle. Run `vite build --ssr src/entry-server.tsx --outDir dist-ssr` first.')
  process.exit(1)
}

const { render, buildJsonLd, artistPages } = await import(pathToFileURL(ssrEntry).href)

const html = readFileSync(join(distDir, 'index.html'), 'utf8')
const body = render()
const jsonLd = buildJsonLd()
  .split('\n')
  .map((line) => `    <script type="application/ld+json">\n${line}\n    </script>`)
  .join('\n')

let output = html
  .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  .replace('<!-- seo:start -->', `<!-- seo:start -->\n    ${jsonLd}`)

mkdirSync(distDir, { recursive: true })
writeFileSync(join(distDir, 'index.html'), output)

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const pages = artistPages()
for (const page of pages) {
  const url = `https://thebutchersrecords.it${page.path}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const head = [
    ...page.jsonLd.map((node) => `<script type="application/ld+json">${node}</script>`),
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
    '<meta property="og:locale" content="it_IT" />',
    '<meta property="og:type" content="profile" />',
    '<meta property="og:site_name" content="The Butchers Records" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${page.image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${page.image}" />`,
  ].join('\n    ')
  const pageHtml = html
    .replace(/<!-- seo:start -->[\s\S]*<!-- seo:end -->/, () => head)
    .replace(/\s*<link rel="preload" href="\/hero-poster[^>]*>/, '')
    .replace('<html lang="it">', '<html lang="it" class="no-snap">')
    .replace('<div id="root"></div>', () => `<div id="root">${render(page.path)}</div>`)
  mkdirSync(join(distDir, page.path), { recursive: true })
  writeFileSync(join(distDir, page.path, 'index.html'), pageHtml)
}
writeFileSync(
  join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://thebutchersrecords.it/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>https://thebutchersrecords.it/privacy/</loc>\n  </url>\n${pages.map((page) => `  <url>\n    <loc>https://thebutchersrecords.it${page.path}</loc>\n  </url>\n`).join('')}</urlset>\n`,
)

console.log('Prerendered index.html with', body.length, 'chars of markup and', jsonLd.split('<script').length - 1, 'JSON-LD blocks.')
