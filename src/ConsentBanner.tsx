import { useEffect, useState } from 'react'
import { allowAnalytics, analyticsConfigured } from './analytics'
import { dict, privacyPath, type Lang } from './i18n'
import { readConsent, saveConsent, type ConsentChoice } from './consent'

export function ConsentBanner({ lang }: { lang: Lang }) {
  const t = dict[lang]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!analyticsConfigured) return
    const consent = readConsent()
    if (consent === 'granted') allowAnalytics()
    if (consent === null) setVisible(true)
  }, [])

  if (!visible) return null

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice)
    if (choice === 'granted') allowAnalytics()
    setVisible(false)
  }

  return (
    <section className="consent-banner" aria-label={t.consentLabel}>
      <p>{t.consentText} <a href={privacyPath(lang)}>Privacy</a></p>
      <div>
        <button type="button" onClick={() => choose('denied')}>{t.decline}</button>
        <button type="button" onClick={() => choose('granted')}>{t.accept}</button>
      </div>
    </section>
  )
}
