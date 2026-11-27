export type Lang = 'it' | 'en'

export const LANGS: Lang[] = ['it', 'en']

export function langFromPath(path: string): Lang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'it'
}

export function homePath(lang: Lang) {
  return lang === 'en' ? '/en/' : '/'
}

export function privacyPath(lang: Lang) {
  return lang === 'en' ? '/en/privacy/' : '/privacy/'
}

// Section anchors per language. Analytics always reports the Italian key.
export const sectionIds = {
  it: { artisti: 'artisti', musica: 'musica', 'chi-siamo': 'chi-siamo', contatti: 'contatti' },
  en: { artisti: 'artists', musica: 'music', 'chi-siamo': 'about', contatti: 'contact' },
} as const

const releaseTypes: Record<string, string> = { SINGOLO: 'SINGLE' }

export const dict = {
  it: {
    menuOpen: 'Apri menu',
    menuClose: 'Chiudi menu',
    mainNav: 'Navigazione principale',
    nav: { home: 'Home', artisti: 'Artisti', musica: 'Musica', contatti: 'Contatti' },
    switchLabel: 'English version',
    heroEyebrow: 'RECORD LABEL INDIPENDENTE · ITALIA',
    heroTitle: ['Il rumore', 'della ', 'provincia.'],
    heroText: 'Voci vere da dove la scena non guarda.',
    heroArtists: 'Scopri gli artisti',
    heroReleases: 'Ultime uscite',
    scrollCue: 'SCORRI PER SCOPRIRE',
    manifestoLabel: 'Il nostro manifesto',
    manifesto: ['Dalla provincia,', 'per la provincia.'],
    rosterEyebrow: 'VOLTI, VOCI, STORIE',
    contactLink: 'Contatti',
    musicEyebrow: 'FUORI ORA',
    musicTitle: ['Musica', 'da mordere.'],
    musicBottom: 'ASCOLTA FORTE. ASCOLTA LIBERO.',
    aboutEyebrow: 'LA LABEL',
    aboutTitle: ['Chi ', 'siamo.'],
    aboutText:
      'The Butchers Records è un’etichetta discografica indipendente fondata nel 2026 tra Milano, Cremona e Lodi. Pubblica rap e musica alternativa della provincia lombarda: artisti che suonano dove la scena non guarda e dicono quello che pensano. Non facciamo filtri né passaggi editoriali. Portiamo fuori i tagli più freschi.',
    contactEyebrow: 'DEMO, COLLABORAZIONI, IDEE',
    contactTitle: ['Hai qualcosa', 'da ', 'dire?'],
    contactBottom: 'NOI NON FACCIAMO RUMORE. LO PUBBLICHIAMO.',
    footerLabel: 'RECORD LABEL INDIPENDENTE',
    backToTop: 'TORNA SU ↑',
    artistAlt: (name: string) => `${name}, artista di The Butchers Records`,
    coverAlt: (title: string, artist: string) => `Copertina di ${title} di ${artist}`,
    listenTo: (title: string) => `Ascolta ${title}`,
    listenSpotify: 'Ascolta su Spotify',
    releases: 'Uscite',
    otherArtists: 'Altri artisti',
    consentLabel: 'Preferenze sulle statistiche',
    consentText: 'Con il tuo consenso usiamo statistiche senza cookie per capire come viene usato il sito.',
    decline: 'Rifiuta',
    accept: 'Accetta',
    releaseType: (type: string) => type,
  },
  en: {
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    mainNav: 'Main navigation',
    nav: { home: 'Home', artisti: 'Artists', musica: 'Music', contatti: 'Contact' },
    switchLabel: 'Versione italiana',
    heroEyebrow: 'INDEPENDENT RECORD LABEL · ITALY',
    heroTitle: ['The noise', 'of the ', 'province.'],
    heroText: 'Real voices from where the scene doesn’t look.',
    heroArtists: 'Meet the artists',
    heroReleases: 'Latest releases',
    scrollCue: 'SCROLL TO EXPLORE',
    manifestoLabel: 'Our manifesto',
    manifesto: ['From the province,', 'for the province.'],
    rosterEyebrow: 'FACES, VOICES, STORIES',
    contactLink: 'Contact',
    musicEyebrow: 'OUT NOW',
    musicTitle: ['Music', 'to bite into.'],
    musicBottom: 'LISTEN LOUD. LISTEN FREE.',
    aboutEyebrow: 'THE LABEL',
    aboutTitle: ['About ', 'us.'],
    aboutText:
      'The Butchers Records is an independent record label founded in 2026 between Milan, Cremona and Lodi, in northern Italy. We release rap and alternative music from the Lombard province: artists who play where the scene doesn’t look and say what they think. No filters, no gatekeeping. We put out the freshest cuts.',
    contactEyebrow: 'DEMOS, COLLABORATIONS, IDEAS',
    contactTitle: ['Got something', 'to ', 'say?'],
    contactBottom: 'WE DON’T MAKE NOISE. WE RELEASE IT.',
    footerLabel: 'INDEPENDENT RECORD LABEL',
    backToTop: 'BACK TO TOP ↑',
    artistAlt: (name: string) => `${name}, artist on The Butchers Records`,
    coverAlt: (title: string, artist: string) => `Cover of ${title} by ${artist}`,
    listenTo: (title: string) => `Listen to ${title}`,
    listenSpotify: 'Listen on Spotify',
    releases: 'Releases',
    otherArtists: 'Other artists',
    consentLabel: 'Analytics preferences',
    consentText: 'With your consent we use cookie-free analytics to understand how the site is used.',
    decline: 'Decline',
    accept: 'Accept',
    releaseType: (type: string) => releaseTypes[type] ?? type,
  },
}

export const seo = {
  it: {
    locale: 'it_IT',
    homeTitle: 'The Butchers Records — Etichetta indipendente dal rumore della provincia',
    homeDescription:
      'The Butchers Records è un’etichetta indipendente di musica fondata nel 2026 tra Milano, Cremona e Lodi. Lucky Voda, Piace, VEETO, LOZA e mantra: voci vere, suoni ruvidi, nessun compromesso.',
    artistDescription: (name: string, titles: string[]) =>
      `${name} su The Butchers Records, etichetta indipendente tra Milano, Cremona e Lodi.${titles.length ? ` Ascolta ${titles.join(', ')}.` : ''}`,
  },
  en: {
    locale: 'en_US',
    homeTitle: 'The Butchers Records — Independent record label from the Italian province',
    homeDescription:
      'The Butchers Records is an independent record label founded in 2026 between Milan, Cremona and Lodi, Italy. Rap and alternative music from Lombardy: Lucky Voda, Piace, VEETO, LOZA and mantra.',
    artistDescription: (name: string, titles: string[]) =>
      `${name} on The Butchers Records, an independent record label from Milan, Cremona and Lodi, Italy.${titles.length ? ` Listen to ${titles.join(', ')}.` : ''}`,
  },
}
