import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')
const SITE_URL = 'https://thebutchersrecords.it'

if (!existsSync(ssrEntry)) {
  console.error('Missing SSR bundle. Run `vite build --ssr src/entry-server.tsx --outDir dist-ssr` first.')
  process.exit(1)
}

const { render, pages } = await import(pathToFileURL(ssrEntry).href)

const template = readFileSync(join(distDir, 'index.html'), 'utf8')
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function head(page) {
  const url = `${SITE_URL}${page.path}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  return [
    ...page.jsonLd.map((node) => `<script type="application/ld+json">${node}</script>`),
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="it" href="${SITE_URL}${page.alternates.it}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE_URL}${page.alternates.en}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.alternates.it}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
    `<meta property="og:locale" content="${page.locale}" />`,
    `<meta property="og:locale:alternate" content="${page.altLocale}" />`,
    `<meta property="og:type" content="${page.ogType}" />`,
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
}

const allPages = pages()
for (const page of allPages) {
  let html = template
    .replace(/<!-- seo:start -->[\s\S]*<!-- seo:end -->/, () => head(page))
    .replace('<html lang="it">', page.home ? `<html lang="${page.lang}">` : `<html lang="${page.lang}" class="no-snap">`)
    .replace('<div id="root"></div>', () => `<div id="root">${render(page.path)}</div>`)
  // The hero poster only appears on the home pages.
  if (!page.home) html = html.replace(/\s*<link rel="preload" href="\/hero-poster[^>]*>/, '')
  mkdirSync(join(distDir, page.path), { recursive: true })
  writeFileSync(join(distDir, page.path, 'index.html'), html)
}

// Each page lists its other-language version, as Google recommends for sitemaps with hreflang.
const today = new Date().toISOString().slice(0, 10)
const alternateLinks = (alternates) =>
  ['it', 'en'].map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${alternates[lang]}" />\n`).join('')
const entries = [
  ...allPages.map((page) =>
    `  <url>\n    <loc>${SITE_URL}${page.path}</loc>\n${page.home ? `    <lastmod>${today}</lastmod>\n` : ''}${alternateLinks(page.alternates)}  </url>\n`),
  ...['/privacy/', '/en/privacy/'].map((path) =>
    `  <url>\n    <loc>${SITE_URL}${path}</loc>\n${alternateLinks({ it: '/privacy/', en: '/en/privacy/' })}  </url>\n`),
]
writeFileSync(
  join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('')}</urlset>\n`,
)

console.log(`Prerendered ${allPages.length} pages.`)
