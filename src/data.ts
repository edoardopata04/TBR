export const SITE_URL = 'https://thebutchersrecords.it'
export const SITE_NAME = 'The Butchers Records'
export const SITE_TAGLINE = 'Il rumore della provincia.'
export const SITE_DESCRIPTION =
  'The Butchers Records è un’etichetta indipendente di musica fondata nel 2026 tra Milano, Cremona e Lodi. Lucky Voda, Piace, VEETO, LOZA e mantra: voci vere, suoni ruvidi, nessun compromesso.'
export const CONTACT_EMAIL = 'info@thebutchersrecords.it'
export const FOUNDING_YEAR = '2026'
export const BASE_CITIES = ['Milano', 'Cremona', 'Lodi']

export type Artist = {
  name: string
  image: string
  url: string
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
}

export const artists: Artist[] = [
  {
    name: 'Lucky Voda',
    image: 'https://i.scdn.co/image/ab6761610000e5eb114f2ab7fdee22bc77eb3a6c',
    url: 'https://open.spotify.com/artist/6Qzh8PLrvBoOtexkMOTD7W',
  },
  {
    name: 'Piace',
    image: 'https://i.scdn.co/image/ab6761610000e5eb0c73b1208f1259d395ae99c0',
    url: 'https://open.spotify.com/artist/6vd6ggzbZ4YJNHS5bEOa6n',
  },
  {
    name: 'VEETO',
    image: 'https://i.scdn.co/image/ab6761610000e5eb25e66fc8f34b951f83b75eb9',
    url: 'https://open.spotify.com/artist/7atRlCMrR0qaLAMfVtREqk',
  },
  {
    name: 'LOZA',
    image: 'https://i.scdn.co/image/ab67616d0000b2733a2a9c598b53280bdf922527',
    url: 'https://open.spotify.com/artist/35AJBUTc0quoTGq7odsDUZ',
  },
  {
    name: 'mantra',
    image: 'https://i.scdn.co/image/ab6761610000e5ebefed4f8e9e2bc8c41841e902',
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
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/04/b4/8d04b4ba-5538-26aa-2c34-4d87f5ab56f9/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/track/0Muvm8JAjiK2AJJAjKbioI',
    appleMusicUrl: 'https://music.apple.com/us/album/cinquegi-single/6809282172',
  },
  {
    title: 'Se Va Tutto Bene',
    artist: 'VEETO',
    type: 'SINGOLO',
    date: '16.08.26',
    releaseDate: '2026-08-16',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d0/1d/97/d01d971a-5a5a-19b8-aec3-f2fb52583cf2/881453549960_cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/track/6fFive3GKeR3gfbpHwAktx',
    appleMusicUrl: 'https://music.apple.com/us/album/se-va-tutto-bene-single/6799185962',
  },
  {
    title: 'TIC TAC',
    artist: 'Lucky Voda feat. Piace',
    type: 'SINGOLO',
    date: '10.06.26',
    releaseDate: '2026-06-10',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/6c/71/bf6c7167-2512-b41a-2ab2-cac02b5ece71/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/6ObgQVmDaJptErXGiZeuqJ?si=f7f26217bef8491a',
    appleMusicUrl: 'https://music.apple.com/us/album/tic-tac-feat-piace-single/6775021059',
  },
  {
    title: 'Dove sei bro?',
    artist: 'mantra',
    type: 'SINGOLO',
    date: '05.06.26',
    releaseDate: '2026-06-05',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b8/b6/74/b8b674cc-9254-b8af-bbf8-ac518c665f12/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/track/33MhXNVfapjjzYalQOPtXD',
    appleMusicUrl: 'https://music.apple.com/us/album/dove-sei-bro-single/6775787113',
  },
  {
    title: '+ghiaccio',
    artist: 'Piace',
    type: 'SINGOLO',
    date: '13.02.26',
    releaseDate: '2026-02-13',
    image: '/ghiaccio-cover.png',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/1LD25K6b96lYaNww1raJXK?si=5d1cf3dad89c4ace',
    appleMusicUrl: 'https://music.apple.com/us/album/ghiaccio-single/1869118247',
  },
]
