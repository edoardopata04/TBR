import { useState } from 'react'
import logoImage from '../public/logo.webp'
import heroVideo from '../WhatsApp Video 2026-10-06 at 15.29.27.mp4'
import { artists, releases } from './data'

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href="#home" aria-label="The Butchers Records, home">
      <img className="brand-icon" src={logoImage} alt="" />
      <span className="brand-type"><strong>THE BUTCHERS</strong><small>RECORDS · EST. MMXXVI</small></span>
    </a>
  )
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M6 14 14 6M7 6h7v7" /> : <path d="M3 10h14m-6-6 6 6-6 6" />}
    </svg>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="site-header">
        <BrandMark />
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Navigazione principale">
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#artisti" onClick={closeMenu}>Artisti</a>
          <a href="#musica" onClick={closeMenu}>Musica</a>
          <a href="#contatti" onClick={closeMenu}>Contatti</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> ETICHETTA INDIPENDENTE · ITALIA</div>
            <h1 id="hero-title">Il rumore<br />della <span>provincia.</span></h1>
            <p>Voci vere da dove la scena non guarda.</p>
            <div className="hero-actions">
              <a className="button button-light" href="#artisti">Scopri gli artisti <ArrowIcon /></a>
              <a className="text-link" href="#musica">Ultime uscite <ArrowIcon diagonal /></a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap hero-video-wrap">
              <video className="hero-video" src={heroVideo} poster="/og-image.jpg" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
            </div>
          </div>
          <div className="vertical-note" aria-hidden="true">MILANO · CREMONA · LODI</div>
          <div className="hero-bottom-links">
            <a className="hero-policy-link" href="https://www.iubenda.com/privacy-policy/70676554" target="_blank" rel="noopener noreferrer">PRIVACY</a>
            <a className="scroll-cue" href="#manifesto"><span>SCORRI PER SCOPRIRE</span><span aria-hidden="true">↓</span></a>
            <a className="hero-policy-link" href="https://www.iubenda.com/privacy-policy/70676554/cookie-policy" target="_blank" rel="noopener noreferrer">COOKIE POLICY</a>
          </div>
        </section>

        <section className="manifesto" id="manifesto" aria-label="Il nostro manifesto">
          <p>Dalla provincia,<br /><em>per la provincia.</em></p>
        </section>

        <section className="artists-section section-pad" id="artisti">
          <div className="section-heading">
            <div><span className="eyebrow">VOLTI, VOCI, STORIE</span><h2>Roster</h2></div>
          </div>
          <div className="artist-grid">
            {artists.map((artist) => (
              <a className="artist-card" href={artist.url} target="_blank" rel="noopener noreferrer" key={artist.name}>
                <div className="artist-image">
                  <img src={artist.image} alt={`${artist.name}, artista di The Butchers Records`} width="640" height="640" loading="lazy" />
                  <span className="artist-arrow" aria-hidden="true">→</span>
                  <div className="artist-info">
                    <h3>{artist.name}</h3>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <a className="section-link" href="#contatti">Contatti <ArrowIcon diagonal /></a>
        </section>

        <section className="music-section section-pad" id="musica">
          <div className="section-heading music-heading">
            <div><span className="eyebrow">FUORI ORA </span><h2>Musica<br /><span>da mordere.</span></h2></div>
            
          </div>
          <div className="release-list">
            {releases.map((release, index) => (
              <article className="release-card" key={release.title}>
                <div className="release-art">
                  <img src={release.image} alt={`Copertina di ${release.title} di ${release.artist}, uscita su The Butchers Records`} width="600" height="600" loading="lazy" />
                </div>
                <span className="release-count" aria-hidden="true">0{index + 1}</span>
                <div className="release-title"><span>{release.type}</span><h3>{release.title}</h3><p>{release.artist}</p></div>
                <time className="release-date" dateTime={release.releaseDate}>{release.date}</time>
                <div className="release-links" aria-label={`Ascolta ${release.title}`}>
                  <a className="release-button" href={release.spotifyUrl} target="_blank" rel="noopener noreferrer">Spotify <ArrowIcon diagonal /></a>
                  <a className="release-button" href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer">Apple Music <ArrowIcon diagonal /></a>
                </div>
              </article>
            ))}
          </div>
          <div className="music-bottom"><span>ASCOLTA FORTE. ASCOLTA LIBERO.</span></div>
        </section>

        <section className="about-section" id="chi-siamo">
          <span className="eyebrow">LA LABEL</span>
          <h2>Chi <span>siamo.</span></h2>
          <p>
            The Butchers Records è un’etichetta indipendente fondata nel 2026 tra Milano, Cremona e Lodi.
            Pubblica rap e musica alternativa della provincia lombarda: artisti che suonano dove la scena non guarda e dicono quello che pensano.
            Non facciamo filtri né passaggi editoriali. Portiamo fuori i tagli più freschi.
          </p>
        </section>

        <section className="contact-section" id="contatti">
          <div className="contact-content">
            <div className="contact-top"><span className="eyebrow">DEMO, COLLABORAZIONI, IDEE</span><span className="contact-spark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 1.5 19 11l7-7-4 9.5 9.5 2.5L22 19l4 9.5-7-7-3 9.5-3-9.5-7 7 4-9.5L0.5 16l9.5-2.5L6 4l7 7 3-9.5Z" fill="currentColor" /></svg></span></div>
            <h2>Hai qualcosa<br />da <span>dire?</span></h2>
            <a className="contact-email" href="mailto:info@thebutchersrecords.it">info@thebutchersrecords.it <ArrowIcon diagonal /></a>
            <div className="contact-bottom"><BrandMark compact /><span>NOI NON FACCIAMO RUMORE. LO PUBBLICHIAMO.</span></div>
          </div>
          <footer className="site-footer">
            <span className="footer-copyright">© {new Date().getFullYear()} THE BUTCHERS RECORDS</span>
            <div className="footer-links">
              <a href="https://www.iubenda.com/privacy-policy/70676554" className="footer-policy-link" title="Privacy Policy" target="_blank" rel="noopener noreferrer">PRIVACY</a>
              <a href="https://www.iubenda.com/privacy-policy/70676554/cookie-policy" className="footer-policy-link" title="Cookie Policy" target="_blank" rel="noopener noreferrer">COOKIE POLICY</a>
            </div>
            <a className="footer-back" href="#home">TORNA SU ↑</a>
          </footer>
        </section>
      </main>
    </>
  )
}

export default App
