# key115.github.io
Apps — landing / privacy / support pages

## Website analytics

- GA4 account: `key115`; property: `key115 websites` (`557286301`).
- One web stream for `https://key115.github.io` (`16039657833`).
- Measurement ID: `G-C7RWHHPVL6`, maintained in `assets/analytics.js`.
- All public HTML pages include that shared script. Asset-rendering HTML and
  unpublished source files are excluded. The ClipRecall exporter also includes it.
- `content_group` identifies the app, or `App directory` for the root pages.
- `app_store_click` records a public App Store app ID and canonical destination.
  This is a link click, not a confirmed app download or purchase.
- Query strings and fragments are excluded from the configured page/referrer URLs.
  Form values and Sharebar shared state are never included in custom events.
- **Keep enhanced measurement disabled** in the GA4 web stream. The shared script
  sends page views and explicit App Store click events; automatic form, search,
  history, and outbound-link measurement could include unwanted URL data.
- Google signals and advertising personalization are disabled in the script.
- Tracking loads only on `key115.github.io`, so local previews do not send events.
- Website disclosure: `/privacy.html`; app policies also link to it.

Validate with `node scripts/validate-analytics.mjs`. To compare apps in GA4, use
the Content group dimension in Pages and screens or Explorations. Page path
also distinguishes landing, guide, support, privacy, and localized pages.
