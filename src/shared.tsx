import { useState } from 'react'
import logoImage from '../public/logo.webp'
import { trackEvent } from './analytics'
import type { Release } from './data'

export function BrandMark({ compact = false, base = '' }: { compact?: boolean; base?: string }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href={`${base}#home`} aria-label="THE BUTCHERS RECORDS · EST. MMXXVI — Home" onClick={() => trackEvent({ name: 'navigation_click', data: { destination: 'home' } })}>
      <img className="brand-icon" src={logoImage} alt="" />
      <span className="brand-type"><strong>THE BUTCHERS</strong><small>RECORDS · EST. MMXXVI</small></span>
    </a>
  )
}

export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M6 14 14 6M7 6h7v7" /> : <path d="M3 10h14m-6-6 6 6-6 6" />}
    </svg>
  )
}

// base: '' on the home page (plain anchors keep the query string), '/' elsewhere.
export function SiteHeader({ base = '' }: { base?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <BrandMark base={base} />
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Navigazione principale">
        <a href={`${base}#home`} onClick={() => { trackEvent({ name: 'navigation_click', data: { destination: 'home' } }); closeMenu() }}>Home</a>
        <a href={`${base}#artisti`} onClick={() => { trackEvent({ name: 'navigation_click', data: { destination: 'artisti' } }); closeMenu() }}>Artisti</a>
        <a href={`${base}#musica`} onClick={() => { trackEvent({ name: 'navigation_click', data: { destination: 'musica' } }); closeMenu() }}>Musica</a>
        <a href={`${base}#contatti`} onClick={() => { trackEvent({ name: 'navigation_click', data: { destination: 'contatti' } }); closeMenu() }}>Contatti</a>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="footer-copyright">© {new Date().getFullYear()} THE BUTCHERS RECORDS · INDEPENDENT RECORD LABEL</span>
      <div className="footer-links">
        <a href="/privacy/" className="footer-policy-link">PRIVACY</a>
        <a href="/privacy/#cookie" className="footer-policy-link">COOKIE POLICY</a>
      </div>
      <a className="footer-back" href="#top">TORNA SU ↑</a>
    </footer>
  )
}

export function ReleaseCard({ release, index }: { release: Release; index: number }) {
  return (
    <article className="release-card">
      <div className="release-art">
        <img src={release.image} alt={`Copertina di ${release.title} di ${release.artist}`} width="600" height="600" loading="lazy" decoding="async" />
      </div>
      <span className="release-count" aria-hidden="true">0{index + 1}</span>
      <div className="release-title"><span>{release.type}</span><h3>{release.title}</h3><p>{release.artist}</p></div>
      <time className="release-date" dateTime={release.releaseDate}>{release.date}</time>
      <div className="release-links" aria-label={`Ascolta ${release.title}`}>
        <a className="release-button" href={release.spotifyUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'release_stream_click', data: { release: release.title, artist: release.artist, platform: 'spotify' } })}>Spotify <ArrowIcon diagonal /></a>
        <a className="release-button" href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'release_stream_click', data: { release: release.title, artist: release.artist, platform: 'apple_music' } })}>Apple Music <ArrowIcon diagonal /></a>
      </div>
    </article>
  )
}
