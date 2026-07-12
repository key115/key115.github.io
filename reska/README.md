# Reska — public site source

Source for `https://key115.github.io/reska/`:

- `index.html` — minimal product and trust landing page.
- `privacy.html` — App Store privacy-policy URL; EN + JA, Data Not Collected.
- `support.html` — App Store support URL; setup, controls, permission recovery,
  purchases, limitations, and email contact.
- `assets/site.css` — shared responsive design system based on the app-icon
  palette.
- `assets/site.js` — dependency-free EN/JA switch and progressive reveal.
- `assets/appicon.png` — copied from the shipping app's 512 px icon.

The site makes no third-party requests and contains no analytics, advertising,
forms, or cookies. The only local storage is the visitor's EN/JA preference.

## Production paths

Deploy these files into `/reska/` in the separate `key115/key115.github.io`
GitHub Pages repository so App Store Connect can use:

- Privacy Policy URL: `https://key115.github.io/reska/privacy.html`
- Support URL: `https://key115.github.io/reska/support.html`

## Product facts reflected here

- macOS 14+
- ScreenCaptureKit live mirror; no audio capture
- live frames are never recorded, saved, or sent
- App Sandbox with no network entitlement
- no account, analytics, tracking, ads, or telemetry
- StoreKit / App Store handles free-trial, purchase, and restore transactions
- default shortcut: `⌃⌥⌘P`; maximum two mirrors
- first launch does not start the trial
- the user explicitly activates a free Non-Consumable IAP; its verified StoreKit
  transaction purchase date anchors the 14-day full trial
- no automatic renewal, subscription, or charge; the paid one-time unlock is
  optional until trial expiry and required afterward only to create new mirrors

Sources: `CONTEXT.md`, `README.md`, `docs/store/listing-copy.md`,
`output/app/Resources/Reska.entitlements`, and the shipping Swift sources.

## Local preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. Verify all three pages in EN and JA,
desktop and narrow viewports, with no console errors or external requests.
