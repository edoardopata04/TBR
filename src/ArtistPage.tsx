import { useEffect } from 'react'
import { ConsentBanner } from './ConsentBanner'
import { trackEvent } from './analytics'
import { artists, artistPath, releasesByArtist, type Artist } from './data'
import { ArrowIcon, ReleaseCard, SiteFooter, SiteHeader } from './shared'
import { dict, homePath, sectionIds, type Lang } from './i18n'

export function ArtistPage({ artist, lang }: { artist: Artist; lang: Lang }) {
  const releases = releasesByArtist(artist)
  const t = dict[lang]
  const home = homePath(lang)

  // Section scroll-snap is a home-page behaviour.
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
  }, [])

  return (
    <>
      <SiteHeader lang={lang} base={home} alternate={artistPath(artist, lang === 'it' ? 'en' : 'it')} />
      <main className="artist-page" id="top">
        <a className="artist-back" href={`${home}#${sectionIds[lang].artisti}`}>← Roster</a>
        <div className="artist-hero">
          <img src={artist.image} alt={t.artistAlt(artist.name)} width="640" height="640" />
          <div>
            <span className="eyebrow">THE BUTCHERS RECORDS</span>
            <h1>{artist.name}</h1>
            {artist.bio && <p>{artist.bio}</p>}
            <div className="artist-links">
              <a className="button button-light" href={artist.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'artist_link_click', data: { artist: artist.name, platform: 'spotify' } })}>{t.listenSpotify} <ArrowIcon diagonal /></a>
              {artist.appleMusicUrl && <a className="button artist-button-outline" href={artist.appleMusicUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'artist_link_click', data: { artist: artist.name, platform: 'apple_music' } })}>Apple Music <ArrowIcon diagonal /></a>}
              {artist.instagramUrl && <a className="text-link" href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'artist_link_click', data: { artist: artist.name, platform: 'instagram' } })}>Instagram <ArrowIcon diagonal /></a>}
            </div>
          </div>
        </div>

        {releases.length > 0 && (
          <div className="artist-releases">
            <h2>{t.releases}</h2>
            <div className="release-list">
              {releases.map((release, index) => <ReleaseCard release={release} index={index} lang={lang} key={release.title} />)}
            </div>
          </div>
        )}

        <nav className="artist-others" aria-label={t.otherArtists}>
          <h2>{t.otherArtists}</h2>
          <div>
            {artists.filter((other) => other.slug !== artist.slug).map((other) => (
              <a href={artistPath(other, lang)} key={other.slug} onClick={() => trackEvent({ name: 'artist_profile_click', data: { artist: other.name } })}>{other.name}</a>
            ))}
          </div>
        </nav>
      </main>
      <SiteFooter lang={lang} />
      <ConsentBanner lang={lang} />
    </>
  )
}
