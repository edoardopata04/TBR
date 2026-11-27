import { useState } from 'react'
import logoImage from '../public/logo.webp'
import { trackEvent } from './analytics'
import type { Release } from './data'
import { dict, privacyPath, sectionIds, type Lang } from './i18n'

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

// base: '' on a home page (plain anchors keep the query string), the home path elsewhere.
// alternate: the same page in the other language.
export function SiteHeader({ lang, base = '', alternate }: { lang: Lang; base?: string; alternate: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const t = dict[lang]
  const ids = sectionIds[lang]
  const other: Lang = lang === 'it' ? 'en' : 'it'
  const link = (key: 'home' | keyof typeof ids) => (
    <a href={`${base}#${key === 'home' ? 'home' : ids[key]}`} onClick={() => { trackEvent({ name: 'navigation_click', data: { destination: key } }); closeMenu() }}>{t.nav[key]}</a>
  )

  return (
    <header className="site-header">
      <BrandMark base={base} />
      <button className="menu-toggle" type="button" aria-label={menuOpen ? t.menuClose : t.menuOpen} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label={t.mainNav}>
        {link('home')}
        {link('artisti')}
        {link('musica')}
        {link('contatti')}
        <a className="lang-switch" href={alternate} hrefLang={other} lang={other} aria-label={t.switchLabel} onClick={() => trackEvent({ name: 'language_switch', data: { to: other } })}>
          <span className={lang === 'it' ? 'lang-current' : ''}>IT</span> / <span className={lang === 'en' ? 'lang-current' : ''}>EN</span>
        </a>
      </nav>
    </header>
  )
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = dict[lang]
  return (
    <footer className="site-footer">
      <span className="footer-copyright">© {new Date().getFullYear()} THE BUTCHERS RECORDS · {t.footerLabel}</span>
      <div className="footer-links">
        <a href={privacyPath(lang)} className="footer-policy-link">PRIVACY</a>
        <a href={`${privacyPath(lang)}#cookie`} className="footer-policy-link">COOKIE POLICY</a>
      </div>
      <a className="footer-back" href="#top">{t.backToTop}</a>
    </footer>
  )
}

export function ReleaseCard({ release, index, lang }: { release: Release; index: number; lang: Lang }) {
  const t = dict[lang]
  return (
    <article className="release-card">
      <div className="release-art">
        <img src={release.image} alt={t.coverAlt(release.title, release.artist)} width="600" height="600" loading="lazy" decoding="async" />
      </div>
      <span className="release-count" aria-hidden="true">0{index + 1}</span>
      <div className="release-title"><span>{t.releaseType(release.type)}</span><h3>{release.title}</h3><p>{release.artist}</p></div>
      <time className="release-date" dateTime={release.releaseDate}>{release.date}</time>
      <div className="release-links" aria-label={t.listenTo(release.title)}>
        <a className="release-button" href={release.spotifyUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'release_stream_click', data: { release: release.title, artist: release.artist, platform: 'spotify' } })}>Spotify <ArrowIcon diagonal /></a>
        <a className="release-button" href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'release_stream_click', data: { release: release.title, artist: release.artist, platform: 'apple_music' } })}>Apple Music <ArrowIcon diagonal /></a>
      </div>
    </article>
  )
}
