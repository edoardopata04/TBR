import { useEffect, useState } from 'react'
import { allowAnalytics, analyticsConfigured } from './analytics'
import { readConsent, saveConsent, type ConsentChoice } from './consent'

export function ConsentBanner() {
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
    <section className="consent-banner" aria-label="Preferenze sulle statistiche">
      <p>Con il tuo consenso usiamo statistiche senza cookie per capire come viene usato il sito. <a href="/privacy/">Privacy</a></p>
      <div>
        <button type="button" onClick={() => choose('denied')}>Rifiuta</button>
        <button type="button" onClick={() => choose('granted')}>Accetta</button>
      </div>
    </section>
  )
}
