import { useEffect } from 'react'
import { ConsentBanner } from './ConsentBanner'
import { trackEvent } from './analytics'
import { artists, artistPath, releasesByArtist, type Artist } from './data'
import { ArrowIcon, ReleaseCard, SiteFooter, SiteHeader } from './shared'

export function ArtistPage({ artist }: { artist: Artist }) {
  const releases = releasesByArtist(artist)

  // Section scroll-snap is a home-page behaviour.
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
  }, [])

  return (
    <>
      <SiteHeader base="/" />
      <main className="artist-page" id="top">
        <a className="artist-back" href="/#artisti">← Roster</a>
        <div className="artist-hero">
          <img src={artist.image} alt={`${artist.name}, artista di The Butchers Records`} width="640" height="640" />
          <div>
            <span className="eyebrow">THE BUTCHERS RECORDS</span>
            <h1>{artist.name}</h1>
            {artist.bio && <p>{artist.bio}</p>}
            <div className="artist-links">
              <a className="button button-light" href={artist.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'artist_link_click', data: { artist: artist.name, platform: 'spotify' } })}>Ascolta su Spotify <ArrowIcon diagonal /></a>
              {artist.instagramUrl && <a className="text-link" href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent({ name: 'artist_link_click', data: { artist: artist.name, platform: 'instagram' } })}>Instagram <ArrowIcon diagonal /></a>}
            </div>
          </div>
        </div>

        {releases.length > 0 && (
          <div className="artist-releases">
            <h2>Uscite</h2>
            <div className="release-list">
              {releases.map((release, index) => <ReleaseCard release={release} index={index} key={release.title} />)}
            </div>
          </div>
        )}

        <nav className="artist-others" aria-label="Altri artisti">
          <h2>Altri artisti</h2>
          <div>
            {artists.filter((other) => other.slug !== artist.slug).map((other) => (
              <a href={artistPath(other)} key={other.slug} onClick={() => trackEvent({ name: 'artist_profile_click', data: { artist: other.name } })}>{other.name}</a>
            ))}
          </div>
        </nav>
      </main>
      <SiteFooter />
      <ConsentBanner />
    </>
  )
}
