import { useEffect } from 'react'
import heroVideo from '../WhatsApp Video 2026-10-06 at 15.29.27.mp4'
import { INSTAGRAM_URL, artistPath, artists, featuredReleases, findArtistByPath } from './data'
import { ArtistPage } from './ArtistPage'
import { ArrowIcon, BrandMark, ReleaseCard, SiteFooter, SiteHeader } from './shared'
import { ConsentBanner } from './ConsentBanner'
import { dict, homePath, langFromPath, privacyPath, sectionIds, type Lang } from './i18n'
import { trackEvent, trackScrollDepth, trackSectionView } from './analytics'

function HomePage({ lang }: { lang: Lang }) {
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

  const t = dict[lang]
  const ids = sectionIds[lang]
  const privacy = privacyPath(lang)

  return (
    <>
      <SiteHeader lang={lang} alternate={homePath(lang === 'it' ? 'en' : 'it')} />

      <main id="top">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> {t.heroEyebrow}</div>
            <h1 id="hero-title">{t.heroTitle[0]}<br />{t.heroTitle[1]}<span>{t.heroTitle[2]}</span></h1>
            <p>{t.heroText}</p>
            <div className="hero-actions">
              <a className="button button-light" href={`#${ids.artisti}`} onClick={() => trackEvent({ name: 'hero_cta_click', data: { destination: 'artisti' } })}>{t.heroArtists} <ArrowIcon /></a>
              <a className="text-link" href={`#${ids.musica}`} onClick={() => trackEvent({ name: 'hero_cta_click', data: { destination: 'musica' } })}>{t.heroReleases} <ArrowIcon diagonal /></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap hero-video-wrap">
              <video className="hero-video" src={heroVideo} poster="/hero-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
            </div>
          </div>
          <div className="vertical-note" aria-hidden="true">MILANO · CREMONA · LODI</div>
          <div className="hero-bottom-links">
            <a className="hero-policy-link" href={privacy}>PRIVACY</a>
            <a className="scroll-cue" href="#manifesto"><span>{t.scrollCue}</span><span aria-hidden="true">↓</span></a>
            <a className="hero-policy-link" href={`${privacy}#cookie`}>COOKIE POLICY</a>
          </div>
        </section>

        <section className="manifesto" id="manifesto" aria-label={t.manifestoLabel}>
          <p>{t.manifesto[0]}<br /><em>{t.manifesto[1]}</em></p>
        </section>

        <section className="artists-section section-pad" id={ids.artisti} data-analytics-section="artisti">
          <div className="section-heading">
            <div><span className="eyebrow">{t.rosterEyebrow}</span><h2>Roster</h2></div>
          </div>
          <div className="artist-grid">
            {artists.map((artist) => (
              <a className="artist-card" href={artistPath(artist, lang)} key={artist.name} onClick={() => trackEvent({ name: 'artist_profile_click', data: { artist: artist.name } })}>
                <div className="artist-image">
                  <img src={artist.image} alt={t.artistAlt(artist.name)} width="640" height="640" loading="lazy" decoding="async" />
                  <span className="artist-arrow" aria-hidden="true">→</span>
                  <div className="artist-info">
                    <h3>{artist.name}</h3>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <a className="section-link" href={`#${ids.contatti}`} onClick={() => trackEvent({ name: 'navigation_click', data: { destination: 'contatti' } })}>{t.contactLink} <ArrowIcon diagonal /></a>
        </section>

        <section className="music-section section-pad" id={ids.musica} data-analytics-section="musica">
          <div className="section-heading music-heading">
            <div><span className="eyebrow">{t.musicEyebrow}</span><h2>{t.musicTitle[0]}<br /><span>{t.musicTitle[1]}</span></h2></div>
          </div>
          <div className="release-list">
            {featuredReleases.map((release, index) => <ReleaseCard release={release} index={index} lang={lang} key={release.title} />)}
          </div>
          <div className="music-bottom"><span>{t.musicBottom}</span></div>
        </section>

        <section className="about-section" id={ids['chi-siamo']} data-analytics-section="chi-siamo">
          <span className="eyebrow">{t.aboutEyebrow}</span>
          <h2>{t.aboutTitle[0]}<span>{t.aboutTitle[1]}</span></h2>
          <p>{t.aboutText}</p>
        </section>

        <section className="contact-section" id={ids.contatti} data-analytics-section="contatti">
          <div className="contact-content">
            <div className="contact-top"><span className="eyebrow">{t.contactEyebrow}</span><span className="contact-spark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 1.5 19 11l7-7-4 9.5 9.5 2.5L22 19l4 9.5-7-7-3 9.5-3-9.5-7 7 4-9.5L0.5 16l9.5-2.5L6 4l7 7 3-9.5Z" fill="currentColor" /></svg></span></div>
            <h2>{t.contactTitle[0]}<br />{t.contactTitle[1]}<span>{t.contactTitle[2]}</span></h2>
            <a className="contact-email" href="mailto:info@thebutchersrecords.it" onClick={() => trackEvent({ name: 'contact_email_click', data: { method: 'email' } })}>info@thebutchersrecords.it <ArrowIcon diagonal /></a>
            <a className="contact-instagram" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram: @thebutchersrecords" onClick={() => trackEvent({ name: 'social_click', data: { platform: 'instagram' } })}>
              <svg className="instagram-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg> @thebutchersrecords
            </a>
            <div className="contact-bottom"><BrandMark compact /><span>{t.contactBottom}</span></div>
          </div>
          <SiteFooter lang={lang} />
        </section>
      </main>
      <ConsentBanner lang={lang} />
    </>
  )
}

function App({ path }: { path: string }) {
  const lang = langFromPath(path)
  const artist = findArtistByPath(path)
  return artist ? <ArtistPage artist={artist} lang={lang} /> : <HomePage lang={lang} />
}

export default App
