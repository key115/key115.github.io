# key115.github.io
Apps — landing / privacy / support pages

## Website analytics

- GA4 account: `key115`; property: `key115 websites` (`557286301`).
- One web stream for `https://key115.github.io` (`16039657833`).
- Measurement ID: `G-C7RWHHPVL6`, maintained in `assets/analytics.js`.
- All public HTML pages include that shared script. Asset-rendering HTML and
  unpublished source files are excluded. ClipRecall's LP and guide are generated from CommandDesk (PRJ-011 `output/site/landing/`) with the same loader.
- `content_group` identifies the app, or `App directory` for the root pages.
- `app_store_click` records a public App Store app ID and canonical destination.
  This is a link click, not a confirmed app download or purchase.
- Query strings and fragments are excluded from the configured page/referrer URLs.
  Form values and Sharebar shared state are never included in custom events.
- **Keep enhanced measurement (every toggle) and user-provided data collection
  disabled** in the GA4 web stream / property. The shared script
  sends page views and explicit App Store click events; automatic form, search,
  history, and outbound-link measurement could include unwanted URL data.
- Google signals and advertising personalization are disabled in the script.
- Tracking loads only on `key115.github.io`, so local previews do not send events.
- EU/EEA/UK (CommandDesk #1545, owner decision 2026-10-19: do not measure, no
  consent banner). `analytics.js` implements this in two layers:
  1. If the browser time zone is `Europe/*` or in `euZonesOutsideEurope`, or
     cannot be read, the script returns before touching `dataLayer` or loading
     gtag.js, so nothing is sent to Google. The zone itself is not sent.
  2. Otherwise it queues two `consent default` commands before `js`/`config` and
     before gtag.js. The 38 ISO codes in `notMeasuredRegions` (EU 27 incl.
     AX/GF/GP/MQ/MF/RE/YT, IS/LI/NO, GB) deny all four consent types; everyone
     else gets `analytics_storage: granted` with the three ad types denied.
     Google resolves the region when it serves gtag.js (observed 2026-10-25, not
     documented). Denied visitors get no GA4 cookies, but consent mode still
     sends cookieless pings. A region Google cannot resolve falls to the
     granted default.
- Never add a consent `update`, `wait_for_update`, `url_passthrough` or
  `ads_data_redaction`.
- Sharebar: opening `/sharebar/s`, `/sharebar/s.html` or any `/sharebar/` URL whose
  hash starts with `#v<digit>` does not load the Google tag (CommandDesk #1698).
  If an open Sharebar page changes its URL to a shared link within the same page,
  tags already loaded remain (the landing page `/sharebar/` immediately redirects
  to `/sharebar/s`); history-change measurement is disabled.
- Pages must not load any other Google resource (fonts, embeds), or `/privacy.html`
  ("sends nothing to Google") becomes false.
- Source of truth for this README, `assets/analytics.js`,
  `scripts/validate-analytics.mjs` and `/privacy.html`: CommandDesk
  `AI秘書/2_areas/published-sites/key115-root/site/`. Do not edit them here;
  deploy with that folder's `deploy/apply.sh`.
- Website disclosure: `/privacy.html`; app policies also link to it.

Validate with `node scripts/validate-analytics.mjs` (the result does not depend on
the machine's time zone). To compare apps in GA4, use
the Content group dimension in Pages and screens or Explorations. Page path
also distinguishes landing, guide, support, privacy, and localized pages.
