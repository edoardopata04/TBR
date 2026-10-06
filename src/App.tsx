import { useState } from 'react'
import logoImage from '../the-butchers-logo-transparent.png'
import heroVideo from '../WhatsApp Video 2026-10-06 at 15.29.27.mp4'

type Artist = {
  name: string
  genre: string
  image: string
  bio: string
  number: string
}

type Release = {
  title: string
  artist: string
  type: string
  date: string
  image: string
  spotifyUrl: string
  appleMusicUrl: string
}

const artists: Artist[] = [
  {
    name: 'Nera Luce',
    genre: 'ALT. R&B · MILANO',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
    bio: 'Una voce che non chiede il permesso. Nera Luce trasforma notti insonni e verità scomode in canzoni che restano addosso.',
    number: '01',
  },
  {
    name: 'Santo Fumo',
    genre: 'RAP · BOLOGNA',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=85',
    bio: 'Rime taglienti, produzioni sporche e una città intera dentro ogni barra. Il rumore di una generazione che non sta zitta.',
    number: '02',
  },
  {
    name: 'Marea Nera',
    genre: 'INDIE ROCK · NAPOLI',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85',
    bio: 'Chitarre distorte e melodie luminose. Marea Nera cerca bellezza dove gli altri vedono solo macerie.',
    number: '03',
  },
]

const releases: Release[] = [
  {
    title: 'TIC TAC',
    artist: 'Lucky Voda feat. Piace',
    type: 'SINGOLO',
    date: '10.06.26',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/6c/71/bf6c7167-2512-b41a-2ab2-cac02b5ece71/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/6ObgQVmDaJptErXGiZeuqJ?si=f7f26217bef8491a',
    appleMusicUrl: 'https://music.apple.com/us/album/tic-tac-feat-piace-single/6775021059',
  },
  {
    title: "L'IDEA SBAGLIATA",
    artist: 'Lucky Voda feat. mantra',
    type: 'SINGOLO',
    date: '20.05.26',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d5/b8/8d/d5b88d65-d3af-ae3e-7927-884838dc2ef1/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/3iRbOagN5niqwUsQHHDiwV?si=e8add08979c14537',
    appleMusicUrl: 'https://music.apple.com/us/album/lidea-sbagliata-feat-mantra-single/6765916481',
  },
  {
    title: '+ghiaccio',
    artist: 'Piace',
    type: 'SINGOLO',
    date: '13.02.26',
    image: '/ghiaccio-cover.png',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/1LD25K6b96lYaNww1raJXK?si=5d1cf3dad89c4ace',
    appleMusicUrl: 'https://music.apple.com/us/album/ghiaccio-single/1869118247',
  },
  {
    title: 'Nemo',
    artist: 'Piace feat. Lucky Voda',
    type: 'SINGOLO',
    date: '05.01.26',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/b8/d9/82b8d98d-6a05-2383-4073-76ed13cb38a9/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/3wps8lILYvcauHOL1c34ep?si=a96413d834054d32',
    appleMusicUrl: 'https://music.apple.com/us/album/nemo-feat-lucky-voda-single/1865160894',
  },
  {
    title: 'SCELTE GIUSTE',
    artist: 'Lucky Voda',
    type: 'SINGOLO',
    date: '10.12.25',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/1f/d6/19/1fd61945-e8ea-25f4-40c7-e588fe33310b/artwork.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/intl-it/album/4zODhuppShGS9EgOqPnS66?si=834677a391574f32',
    appleMusicUrl: 'https://music.apple.com/us/album/scelte-giuste-single/1855735826',
  },
]

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href="#home" aria-label="The Butchers Records, home">
      <img className="brand-icon" src={logoImage} alt="" />
      <span className="brand-type"><strong>THE BUTCHERS</strong><small>RECORDS · EST. MMXXI</small></span>
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
          <a className="nav-contact" href="#contatti" onClick={closeMenu}>Contatti <ArrowIcon diagonal /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> ETICHETTA INDIPENDENTE · ITALIA</div>
            <h1>La musica<br />ha <span>i denti.</span></h1>
            <p>Suoni ruvidi. Voci vere. Nessun compromesso.<br className="desktop-break" /> Diamo spazio a chi ha qualcosa da mordere.</p>
            <div className="hero-actions">
              <a className="button button-light" href="#artisti">Scopri gli artisti <ArrowIcon /></a>
              <a className="text-link" href="#musica">Ultime uscite <ArrowIcon diagonal /></a>
            </div>
            <div className="hero-index"><span>01 / 03</span><span>SINCE 2026</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap hero-video-wrap">
              <video className="hero-video" src={heroVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
            </div>
          </div>
          <div className="vertical-note" aria-hidden="true">MILANO · CREMONA · LODI</div>
          <a className="scroll-cue" href="#manifesto"><span>SCORRI PER SCOPRIRE</span><span aria-hidden="true">↓</span></a>
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
              <article className="artist-card" key={artist.name}>
                <div className="artist-image">
                  <img src={artist.image} alt={`Ritratto di ${artist.name}`} loading="lazy" />
                  <span className="artist-number">{artist.number}</span>
                  <span className="artist-open" aria-hidden="true"><ArrowIcon diagonal /></span>
                </div>
                <div className="artist-info">
                  <div className="artist-meta">{artist.genre}</div>
                  <h3>{artist.name}</h3>
                  <p>{artist.bio}</p>
                </div>
              </article>
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
                  <img src={release.image} alt={`Copertina di ${release.title} di ${release.artist}`} loading="lazy" />
                </div>
                <span className="release-count" aria-hidden="true">0{index + 1}</span>
                <div className="release-title"><span>{release.type}</span><h3>{release.title}</h3><p>{release.artist}</p></div>
                <span className="release-date">{release.date}</span>
                <div className="release-links" aria-label={`Ascolta ${release.title}`}>
                  <a className="release-button" href={release.spotifyUrl} target="_blank" rel="noopener noreferrer">Spotify <ArrowIcon diagonal /></a>
                  <a className="release-button" href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer">Apple Music <ArrowIcon diagonal /></a>
                </div>
              </article>
            ))}
          </div>
          <div className="music-bottom"><span>ASCOLTA FORTE. ASCOLTA LIBERO.</span><a href="#contatti">Segui le prossime uscite <ArrowIcon diagonal /></a></div>
        </section>

        <section className="contact-section" id="contatti">
          <div className="contact-top"><span className="eyebrow">DEMO, COLLABORAZIONI, BUONE IDEE</span><span className="contact-spark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 1.5 19 11l7-7-4 9.5 9.5 2.5L22 19l4 9.5-7-7-3 9.5-3-9.5-7 7 4-9.5L0.5 16l9.5-2.5L6 4l7 7 3-9.5Z" fill="currentColor" /></svg></span></div>
          <h2>Hai qualcosa<br />da <span>dire?</span></h2>
          <a className="contact-email" href="mailto:info@thebutchersrecords.it">info@thebutchersrecords.it <ArrowIcon diagonal /></a>
          <address className="legal-contact">
            <span>TITOLARE DEL TRATTAMENTO</span>
            <strong>Edoardo Michele Pata</strong>
            <span>Via Ungaretti 21 · 26016 Spino d’Adda (CR), Italia</span>
            <a href="mailto:edoardopata04@gmail.com">edoardopata04@gmail.com</a>
          </address>
          <div className="contact-bottom"><BrandMark compact /><span>NOI NON FACCIAMO RUMORE. LO PUBBLICHIAMO.</span></div>
        </section>
      </main>

      <footer className="site-footer">
        <span className="footer-copyright">© {new Date().getFullYear()} THE BUTCHERS RECORDS</span>
        <div className="footer-social"><span>INSTAGRAM</span><span>SPOTIFY</span></div>
        <div className="footer-legal">
          <a href="https://www.iubenda.com/privacy-policy/70676554" className="footer-policy-link" title="Privacy Policy" target="_blank" rel="noopener noreferrer">PRIVACY</a>
          <a href="https://www.iubenda.com/privacy-policy/70676554/cookie-policy" className="footer-policy-link" title="Cookie Policy" target="_blank" rel="noopener noreferrer">COOKIE POLICY</a>
        </div>
        <a className="footer-back" href="#home">TORNA SU ↑</a>
      </footer>
    </>
  )
}

export default App
