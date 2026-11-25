import { useEffect } from 'react'
import heroVideo from '../WhatsApp Video 2026-10-06 at 15.29.27.mp4'
import { INSTAGRAM_URL, artistPath, artists, featuredReleases, findArtistByPath } from './data'
import { ArtistPage } from './ArtistPage'
import { ArrowIcon, BrandMark, ReleaseCard, SiteFooter, SiteHeader } from './shared'
import { ConsentBanner } from './ConsentBanner'
import { trackEvent, trackScrollDepth, trackSectionView } from './analytics'

function HomePage() {
  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-analytics-section')
            if (section) trackSectionView(section as 'artisti' | 'musica' | 'chi-siamo' | 'contatti')
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll('[data-analytics-section]').forEach((section) => sectionObserver.observe(section))

    const onScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
      const percent = scrollableHeight <= 0 || atPageEnd ? 100 : (window.scrollY / scrollableHeight) * 100

      if (percent >= 25) trackScrollDepth(25)
      if (percent >= 50) trackScrollDepth(50)
      if (percent >= 75) trackScrollDepth(75)
      if (percent >= 100) trackScrollDepth(100)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      sectionObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <SiteHeader />

      <main id="top">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> ETICHETTA INDIPENDENTE · ITALIA</div>
            <h1 id="hero-title">Il rumore<br />della <span>provincia.</span></h1>
            <p>Voci vere da dove la scena non guarda.</p>
            <div className="hero-actions">
              <a className="button button-light" href="#artisti" onClick={() => trackEvent({ name: 'hero_cta_click', data: { destination: 'artisti' } })}>Scopri gli artisti <ArrowIcon /></a>
              <a className="text-link" href="#musica" onClick={() => trackEvent({ name: 'hero_cta_click', data: { destination: 'musica' } })}>Ultime uscite <ArrowIcon diagonal /></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap hero-video-wrap">
              <video className="hero-video" src={heroVideo} poster="/hero-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
            </div>
          </div>
          <div className="vertical-note" aria-hidden="true">MILANO · CREMONA · LODI</div>
          <div className="hero-bottom-links">
            <a className="hero-policy-link" href="/privacy/">PRIVACY</a>
            <a className="scroll-cue" href="#manifesto"><span>SCORRI PER SCOPRIRE</span><span aria-hidden="true">↓</span></a>
            <a className="hero-policy-link" href="/privacy/#cookie">COOKIE POLICY</a>
          </div>
        </section>

        <section className="manifesto" id="manifesto" aria-label="Il nostro manifesto">
          <p>Dalla provincia,<br /><em>per la provincia.</em></p>
        </section>

        <section className="artists-section section-pad" id="artisti" data-analytics-section="artisti">
          <div className="section-heading">
            <div><span className="eyebrow">VOLTI, VOCI, STORIE</span><h2>Roster</h2></div>
          </div>
          <div className="artist-grid">
            {artists.map((artist) => (
              <a className="artist-card" href={artistPath(artist)} key={artist.name} onClick={() => trackEvent({ name: 'artist_profile_click', data: { artist: artist.name } })}>
                <div className="artist-image">
                  <img src={artist.image} alt={`${artist.name}, artista di The Butchers Records`} width="640" height="640" loading="lazy" decoding="async" />
                  <span className="artist-arrow" aria-hidden="true">→</span>
                  <div className="artist-info">
                    <h3>{artist.name}</h3>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <a className="section-link" href="#contatti" onClick={() => trackEvent({ name: 'navigation_click', data: { destination: 'contatti' } })}>Contatti <ArrowIcon diagonal /></a>
        </section>

        <section className="music-section section-pad" id="musica" data-analytics-section="musica">
          <div className="section-heading music-heading">
            <div><span className="eyebrow">FUORI ORA </span><h2>Musica<br /><span>da mordere.</span></h2></div>
            
          </div>
          <div className="release-list">
            {featuredReleases.map((release, index) => <ReleaseCard release={release} index={index} key={release.title} />)}
          </div>
          <div className="music-bottom"><span>ASCOLTA FORTE. ASCOLTA LIBERO.</span></div>
        </section>

        <section className="about-section" id="chi-siamo" data-analytics-section="chi-siamo">
          <span className="eyebrow">LA LABEL</span>
          <h2>Chi <span>siamo.</span></h2>
          <p>
            The Butchers Records è un’etichetta indipendente fondata nel 2026 tra Milano, Cremona e Lodi.
            Pubblica rap e musica alternativa della provincia lombarda: artisti che suonano dove la scena non guarda e dicono quello che pensano.
            Non facciamo filtri né passaggi editoriali. Portiamo fuori i tagli più freschi.
          </p>
        </section>

        <section className="contact-section" id="contatti" data-analytics-section="contatti">
          <div className="contact-content">
            <div className="contact-top"><span className="eyebrow">DEMO, COLLABORAZIONI, IDEE</span><span className="contact-spark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 1.5 19 11l7-7-4 9.5 9.5 2.5L22 19l4 9.5-7-7-3 9.5-3-9.5-7 7 4-9.5L0.5 16l9.5-2.5L6 4l7 7 3-9.5Z" fill="currentColor" /></svg></span></div>
            <h2>Hai qualcosa<br />da <span>dire?</span></h2>
            <a className="contact-email" href="mailto:info@thebutchersrecords.it" onClick={() => trackEvent({ name: 'contact_email_click', data: { method: 'email' } })}>info@thebutchersrecords.it <ArrowIcon diagonal /></a>
            <a className="contact-instagram" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram: @thebutchersrecords" onClick={() => trackEvent({ name: 'social_click', data: { platform: 'instagram' } })}>
              <svg className="instagram-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg> @thebutchersrecords
            </a>
            <div className="contact-bottom"><BrandMark compact /><span>NOI NON FACCIAMO RUMORE. LO PUBBLICHIAMO.</span></div>
          </div>
          <SiteFooter />
        </section>
      </main>
      <ConsentBanner />
    </>
  )
}

function App({ path }: { path: string }) {
  const artist = findArtistByPath(path)
  return artist ? <ArtistPage artist={artist} /> : <HomePage />
}

export default App
