export type ConsentChoice = 'granted' | 'denied'

// Same key is used by public/privacy/index.html.
const STORAGE_KEY = 'tbr-analytics-consent'
// Bump here and in public/privacy/index.html when the notice changes materially: visitors are asked again.
const POLICY_VERSION = '2026-11-25'
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000

export function readConsent(): ConsentChoice | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!saved || saved.version !== POLICY_VERSION || Date.now() - saved.at > MAX_AGE_MS) return null
    return saved.choice === 'granted' || saved.choice === 'denied' ? saved.choice : null
  } catch {
    return null
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now(), version: POLICY_VERSION }))
  } catch {
    // Storage unavailable: the choice lasts for this page view only.
  }
}
