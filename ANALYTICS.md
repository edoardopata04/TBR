# Analytics

The site uses Umami Cloud for aggregate traffic and content-interest analytics. Tracking stays off until `VITE_UMAMI_WEBSITE_ID` is configured.

## Activate

1. Create the site in Umami Cloud and choose the EU data region during account setup.
2. Copy its website ID into `VITE_UMAMI_WEBSITE_ID` in the build environment. For GitHub Pages, add it as a repository Actions variable under Settings → Secrets and variables → Actions → Variables.
3. Rebuild and deploy the site. The tracker is restricted to `thebutchersrecords.it` and `www.thebutchersrecords.it`.
4. Have the privacy notice (`public/privacy/index.html`) reviewed. It describes Umami on the Hobby plan (6-month retention): update it if the plan changes.

Umami Cloud's Hobby plan is currently free for one site, up to 100,000 events per month, with six months of data retention. Check Umami's current plan details before relying on these limits.

The website ID is public configuration embedded in the built JavaScript, not a secret. The Pages workflow reads the repository variable (recommended) or falls back to a repository secret with the same name, then passes it to Vite during the build.

## Consent

Umami loads, and events are recorded, only after the visitor accepts in the site banner (`src/ConsentBanner.tsx`). The choice is stored in `localStorage` under `tbr-analytics-consent` with date and notice version for 180 days and can be changed on `/privacy/`.

## What is measured

- Automatic page views, referrers, browser/device categories, and campaign parameters.
- Clicks to artist profiles, streaming platforms, the Instagram profile, and the contact email (without sending the email address).
- Visits to the main content sections and scroll milestones at 25%, 50%, 75%, and 100%.

Event properties contain only static content labels such as an artist, release, or destination. The site does not send names, email addresses, account IDs, or custom distinct IDs. URL hash fragments and query strings are excluded, except the standard `utm_*` campaign parameters.

The Umami tracker does not use cookies, but its default anonymous session metrics are derived from IP address and browser User-Agent; the IP is processed to calculate the session and approximate location. This is not user identification, but it is still data processing that should be covered by the site's privacy information.
