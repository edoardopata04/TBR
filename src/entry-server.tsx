import { renderToString } from 'react-dom/server'
import { BASE_CITIES, CONTACT_EMAIL, FOUNDING_YEAR, INSTAGRAM_URL, SITE_NAME, SITE_URL, artistPath, artists, featuredReleases, releasesByArtist } from './data'
import { LANGS, homePath, seo, type Lang } from './i18n'
import type { Artist, Release } from './data'
import App from './App'

export function render(path = '/') {
  return renderToString(<App path={path} />)
}

export function toAbsolute(url: string) {
  if (url.startsWith('/')) return `${SITE_URL}${url}`
  return url
}

const labelId = `${SITE_URL}/#organization`

function artistNode(artist: Artist, lang: Lang = 'it') {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    image: toAbsolute(artist.image),
    url: `${SITE_URL}${artistPath(artist, lang)}`,
    sameAs: [artist.url, artist.appleMusicUrl, artist.instagramUrl].filter(Boolean),
    recordLabel: { '@id': labelId },
  }
}

function releaseNode(release: Release) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: release.title,
    byArtist: { '@type': 'MusicGroup', name: release.artist.split(' feat. ')[0] },
    datePublished: release.releaseDate,
    image: toAbsolute(release.image),
    url: release.spotifyUrl,
    sameAs: [release.spotifyUrl, release.appleMusicUrl],
    inLanguage: 'it',
    ...(release.ownLabel && { recordLabel: { '@id': labelId } }),
  }
}

function buildJsonLd(lang: Lang) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': labelId,
    name: SITE_NAME,
    legalName: 'The Butchers Records',
    alternateName: 'The Butchers',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    email: CONTACT_EMAIL,
    foundingDate: FOUNDING_YEAR,
    description: seo[lang].homeDescription,
    areaServed: { '@type': 'City', name: BASE_CITIES.join(', ') },
    address: {
      '@type': 'PostalAddress',
      addressLocality: BASE_CITIES.join(', '),
      addressCountry: 'IT',
    },
    sameAs: [INSTAGRAM_URL, ...artists.map((artist) => artist.url)],
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}${homePath(lang)}#website`,
    url: `${SITE_URL}${homePath(lang)}`,
    name: SITE_NAME,
    inLanguage: lang,
    publisher: { '@id': labelId },
  }

  const artistNodes = artists.map((artist) => artistNode(artist, lang))

  const releaseNodes = featuredReleases.map(releaseNode)

  return [organization, website, ...artistNodes, ...releaseNodes].map(serialize)
}

const serialize = (node: object) => JSON.stringify(node).replace(/</g, '\\u003c')

const other = (lang: Lang): Lang => (lang === 'it' ? 'en' : 'it')

export type Page = {
  path: string
  lang: Lang
  alternates: Record<Lang, string>
  home: boolean
  title: string
  description: string
  locale: string
  altLocale: string
  ogType: 'website' | 'profile'
  image: string
  imageAlt: string
  jsonLd: string[]
}

// Every prerendered page, in both languages.
export function pages(): Page[] {
  const homes = LANGS.map((lang): Page => ({
    path: homePath(lang),
    lang,
    alternates: { it: homePath('it'), en: homePath('en') },
    home: true,
    title: seo[lang].homeTitle,
    description: seo[lang].homeDescription,
    locale: seo[lang].locale,
    altLocale: seo[other(lang)].locale,
    ogType: 'website',
    image: `${SITE_URL}/og-image.jpg`,
    imageAlt: SITE_NAME,
    jsonLd: buildJsonLd(lang),
  }))
  const artistPages = LANGS.flatMap((lang) => artists.map((artist): Page => {
    const releaseTitles = releasesByArtist(artist).slice(0, 3).map((release) => release.title)
    return {
      path: artistPath(artist, lang),
      lang,
      alternates: { it: artistPath(artist, 'it'), en: artistPath(artist, 'en') },
      home: false,
      title: `${artist.name} — The Butchers Records`,
      description: seo[lang].artistDescription(artist.name, releaseTitles),
      locale: seo[lang].locale,
      altLocale: seo[other(lang)].locale,
      ogType: 'profile',
      image: `${SITE_URL}/og/${artist.slug}.jpg`,
      imageAlt: `${artist.name} — The Butchers Records`,
      jsonLd: [artistNode(artist, lang), ...releasesByArtist(artist).map(releaseNode)].map(serialize),
    }
  }))
  return [...homes, ...artistPages]
}
