type SectionName = 'artisti' | 'musica' | 'chi-siamo' | 'contatti'

type AnalyticsEvent =
  | { name: 'navigation_click'; data: { destination: string } }
  | { name: 'hero_cta_click'; data: { destination: 'artisti' | 'musica' } }
  | { name: 'artist_profile_click'; data: { artist: string } }
  | { name: 'artist_link_click'; data: { artist: string; platform: 'spotify' | 'apple_music' | 'instagram' } }
  | {
      name: 'release_stream_click'
      data: { release: string; artist: string; platform: 'spotify' | 'apple_music' }
    }
  | { name: 'contact_email_click'; data: { method: 'email' } }
  | { name: 'social_click'; data: { platform: 'instagram' } }
  | { name: 'section_view'; data: { section: SectionName } }
  | { name: 'scroll_depth'; data: { percent: 25 | 50 | 75 | 100 } }

type UmamiPayload = { url?: string; referrer?: string }

declare global {
  interface Window {
    tbrBeforeSend?: (type: string, payload: UmamiPayload) => UmamiPayload
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
let allowed = false

export const analyticsConfigured = Boolean(websiteId)

const campaignParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

// Keeps campaign parameters only: other query parameters (fbclid, etc.) are never sent.
function keepCampaignParams(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    const params = new URLSearchParams()
    campaignParams.forEach((key) => {
      const param = url.searchParams.get(key)
      if (param) params.set(key, param)
    })
    url.search = params.toString()
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.toString()
  } catch {
    return ''
  }
}

function beforeSend(_type: string, payload: UmamiPayload): UmamiPayload {
  return {
    ...payload,
    ...(payload.url && { url: keepCampaignParams(payload.url) }),
    ...(payload.referrer && { referrer: keepCampaignParams(payload.referrer) }),
  }
}

function sendEvent(event: AnalyticsEvent) {
  window.umami?.track(event.name, event.data)
}

export function allowAnalytics() {
  allowed = true
  initializeAnalytics()
}

function initializeAnalytics() {
  if (!websiteId || initialized || typeof document === 'undefined') return

  initialized = true
  window.tbrBeforeSend = beforeSend
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://cloud.umami.is/script.js'
  script.dataset.websiteId = websiteId
  script.dataset.domains = 'thebutchersrecords.it,www.thebutchersrecords.it'
  script.dataset.beforeSend = 'tbrBeforeSend'
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
  if (!allowed || !websiteId || typeof window === 'undefined') return

  if (window.umami) {
    sendEvent(event)
  } else if (pendingEvents.length < 50) {
    pendingEvents.push(event)
  }
}

export function trackSectionView(section: SectionName) {
  if (!allowed || viewedSections.has(section)) return
  viewedSections.add(section)
  trackEvent({ name: 'section_view', data: { section } })
}

export function trackScrollDepth(percent: 25 | 50 | 75 | 100) {
  if (!allowed || reachedScrollDepths.has(percent)) return
  reachedScrollDepths.add(percent)
  trackEvent({ name: 'scroll_depth', data: { percent } })
}
