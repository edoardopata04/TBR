type SectionName = 'artisti' | 'musica' | 'chi-siamo' | 'contatti'

type AnalyticsEvent =
  | { name: 'navigation_click'; data: { destination: string } }
  | { name: 'hero_cta_click'; data: { destination: 'artisti' | 'musica' } }
  | { name: 'artist_profile_click'; data: { artist: string } }
  | {
      name: 'release_stream_click'
      data: { release: string; artist: string; platform: 'spotify' | 'apple_music' }
    }
  | { name: 'contact_email_click'; data: { method: 'email' } }
  | { name: 'section_view'; data: { section: SectionName } }
  | { name: 'scroll_depth'; data: { percent: 25 | 50 | 75 | 100 } }

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void
    }
  }
}

const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim()
const pendingEvents: AnalyticsEvent[] = []
const viewedSections = new Set<SectionName>()
const reachedScrollDepths = new Set<25 | 50 | 75 | 100>()
let initialized = false

function sendEvent(event: AnalyticsEvent) {
  window.umami?.track(event.name, event.data)
}

export function initializeAnalytics() {
  if (!websiteId || initialized || typeof document === 'undefined') return

  initialized = true
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://cloud.umami.is/script.js'
  script.dataset.websiteId = websiteId
  script.dataset.domains = 'thebutchersrecords.it,www.thebutchersrecords.it'
  script.dataset.excludeSearch = 'true'
  script.dataset.excludeHash = 'true'
  script.addEventListener(
    'load',
    () => {
      pendingEvents.splice(0).forEach(sendEvent)
    },
    { once: true },
  )
  script.addEventListener(
    'error',
    () => {
      pendingEvents.length = 0
    },
    { once: true },
  )
  document.head.append(script)
}

export function trackEvent(event: AnalyticsEvent) {
  if (!websiteId || typeof window === 'undefined') return

  if (window.umami) {
    sendEvent(event)
  } else if (pendingEvents.length < 50) {
    pendingEvents.push(event)
  }
}

export function trackSectionView(section: SectionName) {
  if (viewedSections.has(section)) return
  viewedSections.add(section)
  trackEvent({ name: 'section_view', data: { section } })
}

export function trackScrollDepth(percent: 25 | 50 | 75 | 100) {
  if (reachedScrollDepths.has(percent)) return
  reachedScrollDepths.add(percent)
  trackEvent({ name: 'scroll_depth', data: { percent } })
}
