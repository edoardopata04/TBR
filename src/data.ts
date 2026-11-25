export const SITE_URL = 'https://thebutchersrecords.it'
export const SITE_NAME = 'The Butchers Records'
export const SITE_TAGLINE = 'Il rumore della provincia.'
export const SITE_DESCRIPTION =
  'The Butchers Records è un’etichetta indipendente di musica fondata nel 2026 tra Milano, Cremona e Lodi. Lucky Voda, Piace, VEETO, LOZA e mantra: voci vere, suoni ruvidi, nessun compromesso.'
export const CONTACT_EMAIL = 'info@thebutchersrecords.it'
export const INSTAGRAM_URL = 'https://www.instagram.com/thebutchersrecords/'
export const FOUNDING_YEAR = '2026'
export const BASE_CITIES = ['Milano', 'Cremona', 'Lodi']

export type Artist = {
  name: string
  slug: string
  image: string
  url: string
  // Optional: shown on the artist page when present.
  bio?: string
  appleMusicUrl?: string
  instagramUrl?: string
}

export type Release = {
  title: string
  artist: string
  type: string
  date: string
  releaseDate: string
  image: string
  spotifyUrl: string
  appleMusicUrl: string
  // Shown on the home page; artist pages list everything.
  featured?: boolean
  // The ℗ line names The Butchers Records.
  ownLabel?: boolean
}

// Hashed file names: replacing a photo changes its URL, so browsers never show a stale copy.
const artistImages = import.meta.glob<string>('./artists/*.webp', { eager: true, query: '?url', import: 'default' })

function artistImage(slug: string) {
  return artistImages[`./artists/${slug}.webp`]
}

export const artists: Artist[] = [
  {
    name: 'Lucky Voda',
    slug: 'lucky-voda',
    appleMusicUrl: 'https://music.apple.com/it/artist/lucky-voda/1811115411',
    image: artistImage('lucky-voda'),
    instagramUrl: 'https://www.instagram.com/luckyvoda/',
    url: 'https://open.spotify.com/artist/6Qzh8PLrvBoOtexkMOTD7W',
  },
  {
    name: 'Piace',
    slug: 'piace',
    appleMusicUrl: 'https://music.apple.com/it/artist/piace/1832302262',
    image: artistImage('piace'),
    instagramUrl: 'https://www.instagram.com/piace_tbr/',
    url: 'https://open.spotify.com/artist/6vd6ggzbZ4YJNHS5bEOa6n',
  },
  {
    name: 'VEETO',
    slug: 'veeto',
    appleMusicUrl: 'https://music.apple.com/it/artist/veeto/1863084261',
    image: artistImage('veeto'),
    instagramUrl: 'https://www.instagram.com/veetot2t/',
    url: 'https://open.spotify.com/artist/7atRlCMrR0qaLAMfVtREqk',
  },
  {
    name: 'LOZA',
    slug: 'loza',
    image: artistImage('loza'),
    instagramUrl: 'https://www.instagram.com/lozaart_/',
    url: 'https://open.spotify.com/artist/35AJBUTc0quoTGq7odsDUZ',
  },
  {
    name: 'mantra',
    slug: 'mantra',
    appleMusicUrl: 'https://music.apple.com/it/artist/mantra/1810567823',
    image: artistImage('mantra'),
    instagramUrl: 'https://www.instagram.com/mantrapdv/',
    url: 'https://open.spotify.com/artist/7svXU96QB0soB9xwYxfUpZ',
  },
]

export const releases: Release[] = [
  {
    title: 'CINQUEGI',
    artist: 'VEETO & LOZA',
    type: 'SINGOLO',
    date: '07.09.26',
    releaseDate: '2026-09-07',
    image: '/releases/cinquegi.webp',
    spotifyUrl: 'https://open.spotify.com/track/0Muvm8JAjiK2AJJAjKbioI',
    appleMusicUrl: 'https://music.apple.com/it/album/cinquegi-single/6809282172',
    featured: true,
  },
  {
    title: 'TIC TAC',
    artist: 'Lucky Voda feat. Piace',
    type: 'SINGOLO',
    date: '10.06.26',
    releaseDate: '2026-06-10',
    image: '/releases/tic-tac.webp',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/6ObgQVmDaJptErXGiZeuqJ?si=f7f26217bef8491a',
    appleMusicUrl: 'https://music.apple.com/it/album/tic-tac-feat-piace-single/6775021059',
    featured: true,
    ownLabel: true,
  },
  {
    title: 'Dove sei bro?',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '05.06.26',
    releaseDate: '2026-06-05',
    image: '/releases/dove-sei-bro.webp',
    spotifyUrl: 'https://open.spotify.com/track/33MhXNVfapjjzYalQOPtXD',
    appleMusicUrl: 'https://music.apple.com/it/album/dove-sei-bro-single/6775787113',
    featured: true,
  },
  {
    title: '+ghiaccio',
    artist: 'Piace',
    type: 'SINGOLO',
    date: '13.02.26',
    releaseDate: '2026-02-13',
    image: '/releases/ghiaccio.webp',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/1LD25K6b96lYaNww1raJXK?si=5d1cf3dad89c4ace',
    appleMusicUrl: 'https://music.apple.com/it/album/ghiaccio-single/1869118247',
    featured: true,
    ownLabel: true,
  },
  {
    title: 'AMARI',
    artist: 'VEETO',
    type: 'SINGOLO',
    date: '01.06.26',
    releaseDate: '2026-06-01',
    image: '/releases/amari.webp',
    spotifyUrl: 'https://open.spotify.com/track/6Qc9CGeH2nKDi5BHKyKmO9',
    appleMusicUrl: 'https://music.apple.com/it/album/amari-single/6777352892',
  },
  {
    title: "L'IDEA SBAGLIATA",
    artist: 'Lucky Voda feat. mantra',
    type: 'SINGOLO',
    date: '20.05.26',
    releaseDate: '2026-05-20',
    image: '/releases/lidea-sbagliata.webp',
    spotifyUrl: 'https://open.spotify.com/track/6aH3XAOyc0xk4wM8l3NNwC',
    appleMusicUrl: 'https://music.apple.com/it/album/lidea-sbagliata-feat-mantra-single/6765916481',
    featured: true,
    ownLabel: true,
  },
  {
    title: 'Coincidenza',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '08.05.26',
    releaseDate: '2026-05-08',
    image: '/releases/coincidenza.webp',
    spotifyUrl: 'https://open.spotify.com/track/3vCTbGlQSqr4jijLSn8c2N',
    appleMusicUrl: 'https://music.apple.com/it/album/coincidenza-single/1896219962',
  },
  {
    title: 'Indipendente',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '10.04.26',
    releaseDate: '2026-04-10',
    image: '/releases/indipendente.webp',
    spotifyUrl: 'https://open.spotify.com/track/0GFeuIQsuVs58zEpXSh5UW',
    appleMusicUrl: 'https://music.apple.com/it/album/indipendente-single/1887620377',
  },
  {
    title: 'Nemo',
    artist: 'Piace feat. Lucky Voda',
    type: 'SINGOLO',
    date: '05.01.26',
    releaseDate: '2026-01-05',
    image: '/releases/nemo.webp',
    spotifyUrl: 'https://open.spotify.com/track/6v39jeGjncB4n9IsLoapaT',
    appleMusicUrl: 'https://music.apple.com/it/album/nemo-feat-lucky-voda-single/1865160894',
    ownLabel: true,
  },
  {
    title: 'Doraemon',
    artist: 'VEETO',
    type: 'SINGOLO',
    date: '22.12.25',
    releaseDate: '2025-12-22',
    image: '/releases/doraemon.webp',
    spotifyUrl: 'https://open.spotify.com/track/2DYPypxYimNSftsDRez6GI',
    appleMusicUrl: 'https://music.apple.com/it/album/doraemon-single/1863165792',
  },
  {
    title: 'SCELTE GIUSTE',
    artist: 'Lucky Voda',
    type: 'SINGOLO',
    date: '10.12.25',
    releaseDate: '2025-12-10',
    image: '/releases/scelte-giuste.webp',
    spotifyUrl: 'https://open.spotify.com/track/0bhkisoRdZD3hgrbcNd1pp',
    appleMusicUrl: 'https://music.apple.com/it/album/scelte-giuste-single/1855735826',
    ownLabel: true,
  },
  {
    title: 'Senza Il Memory',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '28.11.25',
    releaseDate: '2025-11-28',
    image: '/releases/senza-il-memory.webp',
    spotifyUrl: 'https://open.spotify.com/track/6p37oIv0unZQp0rWy30DP0',
    appleMusicUrl: 'https://music.apple.com/it/album/senza-il-memory-single/1855824931',
  },
  {
    title: 'Meno Bello',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '19.09.25',
    releaseDate: '2025-09-19',
    image: '/releases/meno-bello.webp',
    spotifyUrl: 'https://open.spotify.com/track/12qCw8egAdxj03DJkk7tsX',
    appleMusicUrl: 'https://music.apple.com/it/album/meno-bello-single/1839814034',
  },
  {
    title: 'LEI VUOLE UN G',
    artist: 'Lucky Voda',
    type: 'SINGOLO',
    date: '15.09.25',
    releaseDate: '2025-09-15',
    image: '/releases/lei-vuole-un-g.webp',
    spotifyUrl: 'https://open.spotify.com/track/7227QYiyH46wPGkBp8CMDd',
    appleMusicUrl: 'https://music.apple.com/it/album/lei-vuole-un-g-single/1838210779',
    ownLabel: true,
  },
  {
    title: 'Mi sento bene',
    artist: 'Piace',
    type: 'SINGOLO',
    date: '05.09.25',
    releaseDate: '2025-09-05',
    image: '/releases/mi-sento-bene.webp',
    spotifyUrl: 'https://open.spotify.com/track/2qJHbOjVapO0tfrNIzAQa9',
    appleMusicUrl: 'https://music.apple.com/it/album/mi-sento-bene-single/1832465497',
  },
  {
    title: 'CATTIVI ESEMPI',
    artist: 'Lucky Voda',
    type: 'SINGOLO',
    date: '05.05.25',
    releaseDate: '2025-05-05',
    image: '/releases/cattivi-esempi.webp',
    spotifyUrl: 'https://open.spotify.com/track/3AgkBFSB2lC5UpIlRGId9j',
    appleMusicUrl: 'https://music.apple.com/it/album/cattivi-esempi-single/1811180667',
    ownLabel: true,
  },
  {
    title: 'Testimoni',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '24.04.25',
    releaseDate: '2025-04-24',
    image: '/releases/testimoni.webp',
    spotifyUrl: 'https://open.spotify.com/track/5iCqiSt2ybYoMvKwF8jaAk',
    appleMusicUrl: 'https://music.apple.com/it/album/testimoni-single/1810611114',
  },
]

export function artistPath(artist: Artist) {
  return `/artisti/${artist.slug}/`
}

export const featuredReleases = releases
  .filter((release) => release.featured)
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))

export function releasesByArtist(artist: Artist) {
  return releases.filter((release) => release.artist.split(/ & | feat\. /).includes(artist.name))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
}

export function findArtistByPath(path: string) {
  return artists.find((artist) => artistPath(artist) === `${path.replace(/\/+$/, '')}/`)
}
