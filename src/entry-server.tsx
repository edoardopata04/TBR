import { renderToString } from 'react-dom/server'
import { BASE_CITIES, CONTACT_EMAIL, FOUNDING_YEAR, INSTAGRAM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, artistPath, artists, featuredReleases, releasesByArtist } from './data'
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

function artistNode(artist: Artist) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    image: toAbsolute(artist.image),
    url: `${SITE_URL}${artistPath(artist)}`,
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
    sameAs: [INSTAGRAM_URL, ...artists.map((artist) => artist.url)],
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

  const artistNodes = artists.map(artistNode)

  const releaseNodes = featuredReleases.map(releaseNode)

  return [organization, website, ...artistNodes, ...releaseNodes]
    .map((node) => JSON.stringify(node).replace(/</g, '\\u003c'))
    .join('\n')
}

export function artistPages() {
  return artists.map((artist) => {
    const releaseTitles = releasesByArtist(artist).slice(0, 3).map((release) => release.title)
    return {
      path: artistPath(artist),
      title: `${artist.name} — The Butchers Records`,
      description: `${artist.name} su The Butchers Records, etichetta indipendente tra Milano, Cremona e Lodi.${releaseTitles.length ? ` Ascolta ${releaseTitles.join(', ')}.` : ''}`,
      image: toAbsolute(artist.image),
      jsonLd: [artistNode(artist), ...releasesByArtist(artist).map(releaseNode)]
        .map((node) => JSON.stringify(node).replace(/</g, '\\u003c')),
    }
  })
}
