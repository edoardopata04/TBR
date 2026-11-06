import { renderToString } from 'react-dom/server'
import { BASE_CITIES, CONTACT_EMAIL, FOUNDING_YEAR, SITE_DESCRIPTION, SITE_NAME, SITE_URL, artists, releases } from './data'
import type { Artist, Release } from './data'
import App from './App'

export function render() {
  return renderToString(<App />)
}

export function toAbsolute(url: string) {
  if (url.startsWith('/')) return `${SITE_URL}${url}`
  return url
}

const labelId = `${SITE_URL}/#organization`

export function buildJsonLd() {
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
    description: SITE_DESCRIPTION,
    areaServed: { '@type': 'City', name: BASE_CITIES.join(', ') },
    address: {
      '@type': 'PostalAddress',
      addressLocality: BASE_CITIES.join(', '),
      addressCountry: 'IT',
    },
    sameAs: artists.map((artist) => artist.url),
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: 'it',
    publisher: { '@id': labelId },
  }

  const artistNodes = artists.map((artist: Artist) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    image: artist.image,
    url: artist.url,
    sameAs: artist.url,
    recordLabel: { '@id': labelId },
  }))

  const releaseNodes = releases.map((release: Release) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: release.title,
    byArtist: { '@type': 'MusicGroup', name: release.artist.split(' feat. ')[0] },
    datePublished: release.releaseDate,
    image: toAbsolute(release.image),
    url: release.spotifyUrl,
    sameAs: [release.spotifyUrl, release.appleMusicUrl],
    inLanguage: 'it',
    recordLabel: { '@id': labelId },
  }))

  return [organization, website, ...artistNodes, ...releaseNodes]
    .map((node) => JSON.stringify(node).replace(/</g, '\\u003c'))
    .join('\n')
}
