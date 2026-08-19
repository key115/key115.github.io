# MaskGate — public site source

Source for `https://key115.github.io/maskgate/` (#533). This directory is the
canonical copy; the live tree is a generated artefact and is never edited
directly (site-deploy-convention 規約1).

- `index.html` — landing page. Carries all 12 items required by #533, including
  the honest non-detection list and the liability section.
- `privacy.html` — App Store privacy-policy URL. Data Not Collected, and how a
  third party can verify that independently.
- `support.html` — App Store support URL. Quick start, mode switching, FAQ, and
  the email contact (Reska's mailto pattern).
- `assets/site.css` — self-contained design system keyed to the app icon
  (charcoal + shield blue), light and dark, responsive.
- `assets/site.js` — dependency-free JA/EN switch, progressive reveal, and the
  App Store CTA activator (`APP_STORE_URL`; 規約3).
- `assets/appicon.png` — copied from the shipping app's 256 px icon
  (`output/Resources/AppIcon.appiconset/icon_256x256.png`).
- `tests/site_contract_test.py` — shipping invariants. Runs in
  `scripts/pre-pr-local-gate.sh` as the `maskgate_site` lane.

## CTA is not injected yet

`APP_STORE_URL` in `assets/site.js` is `""`. While it is empty, every
`data-appstore` anchor stays `hidden` **and carries no `href` at all**, so the
site can never show a dead link; a "coming soon" line
(`[data-appstore-pending]`) shows in its place.

**規約7**: inject the real URL only after iTunes Lookup for the app returns
`resultCount >= 1`, and complete injection → deploy → live-URL verification in
the same session. Do not leave "inject it later" as a task. One edit in
`site.js` activates every CTA on every page.

## Production paths

Copy these files into `/maskgate/` in the separate `key115/key115.github.io`
repository so App Store Connect can use:

- Marketing URL: `https://key115.github.io/maskgate/`
- Support URL: `https://key115.github.io/maskgate/support.html`
- Privacy Policy URL: `https://key115.github.io/maskgate/privacy.html`

Submit for Review must wait until those URLs are live and verified
(`docs/store-listing.md` 提出前チェックリスト).

## Content constraints this site is held to

- Vocabulary follows `CONTEXT.md`. The forbidden words (常時監視 / 監視 /
  ブロック / 第1層 / 第2層 / 解禁 / 保持中) appear nowhere, and the modes are
  always named お知らせモード and 自動マスクモード. The contract test enforces
  this, including the English equivalents and the 2.4.5 landmine word
  "Accessibility".
- The detection range is transcribed from `docs/coverage.md` (18 secret formats
  + 3 kinds of personal information). The contract test compares the counts
  against that file so the LP cannot drift into over-claiming.
- 「検知できなかった秘密は守れません」 is stated explicitly on the LP and in
  support, in both languages.
- The liability section is **capped and limited to light negligence, stated in
  both directions**, with free provision spelled out — the shape #533 requires
  under 消費者契約法 8条1項1号 / 8条3項. No custom EULA is registered in App
  Store Connect; Apple's standard licence applies.

## Local preview

From this directory:

```sh
python3 -m http.server 8533
```

Then open `http://127.0.0.1:8533/`. Check all three pages in JA and EN, light
and dark, desktop and narrow viewports, with no console errors and no external
requests.
