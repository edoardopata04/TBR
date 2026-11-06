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

const { render, buildJsonLd } = await import(pathToFileURL(ssrEntry).href)

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
writeFileSync(
  join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://thebutchersrecords.it/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
)

console.log('Prerendered index.html with', body.length, 'chars of markup and', jsonLd.split('<script').length - 1, 'JSON-LD blocks.')
