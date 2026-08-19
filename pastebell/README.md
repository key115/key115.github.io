# PasteBell — public site source

Source for `https://key115.github.io/pastebell/` (#533, rewritten for the
notify-only pivot in #585). This directory is the canonical copy; the live tree
is a generated artefact and is never edited directly (site-deploy-convention
規約1).

- `index.html` — landing page. Carries all 11 required items, including the
  honest non-detection list and the scope/warranty section.
- `privacy.html` — App Store privacy-policy URL. Data Not Collected, and how a
  third party can verify that independently.
- `support.html` — App Store support URL. Quick start, widening the detection
  scope, FAQ, and the email contact (Reska's mailto pattern).
- `assets/site.css` — self-contained design system keyed to the app icon
  (charcoal + bell blue), light and dark, responsive.
- `assets/site.js` — dependency-free JA/EN switch, progressive reveal, and the
  App Store CTA activator (`APP_STORE_URL`; 規約3).
- `assets/appicon.png` — copied from the shipping app's 256 px icon
  (`output/Resources/AppIcon.appiconset/icon_256x256.png`). Re-copy it whenever
  the app icon changes; the contract test cannot see that it went stale.
- `tests/site_contract_test.py` — shipping invariants. Runs in
  `scripts/pre-pr-local-gate.sh` as the `pastebell_site` lane.

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

Copy these files into `/pastebell/` in the separate `key115/key115.github.io`
repository so App Store Connect can use:

- Marketing URL: `https://key115.github.io/pastebell/`
- Support URL: `https://key115.github.io/pastebell/support.html`
- Privacy Policy URL: `https://key115.github.io/pastebell/privacy.html`

Deploy `index.html`, `privacy.html`, `support.html`, `assets/` and this README;
`tests/` stays here (source-side gate only). The earlier `/maskgate/`
deployment is retired by the same operation: remove that directory, repoint the
portal card, and update the mapping table in
`3_resources/know-how/site-deploy-convention.md`. No external link points at the
old slug — the app has never shipped.

Submit for Review must wait until those URLs are live and verified
(`docs/store-listing.md` 提出前チェックリスト).

## Content constraints this site is held to

- The product is **PasteBell** (ADR-0004) and it is **notify-only** (ADR-0003):
  the app's single action is a heads-up, and it never writes to the clipboard.
  The positioning is an aid against near-miss pastes, not a safeguard.
- Vocabulary follows `CONTEXT.md`. The forbidden words (常時監視 / 監視 /
  ブロック / 第1層 / 第2層 / 解禁 / 保持中) appear nowhere, and neither does the
  retired mask-era vocabulary (マスク / 伏せ字 / 復元 / 原本 / 守る系 /
  MaskGate / mode names). The contract test enforces both lists, including the
  English equivalents and the 2.4.5 landmine word "Accessibility".
- The detection range is transcribed from `docs/coverage.md` (18 secret formats
  + 3 kinds of personal information). The contract test compares the counts
  **and the section heading vocabulary** against that file, so the LP cannot
  drift into over-claiming and the generated table cannot fall out of sync.
- 「検知できなかった秘密には、気づかせられません」 is stated explicitly on the
  LP and in support, in both languages.
- The legal section is exactly the ADR-0003 three-part set: **scope of the
  function provided**, **no warranty / an aid, not a safeguard**, and **Apple's
  standard EULA applies**. There is **no liability cap and no clickwrap** —
  the contract test fails if either comes back.
- Two promises are third-party checkable and must stay that way: no network
  entitlement (`codesign`), and no clipboard writes (`pbpaste | shasum` before
  and after).

## Local preview

From this directory:

```sh
python3 -m http.server 8533
```

Then open `http://127.0.0.1:8533/`. Check all three pages in JA and EN, light
and dark, desktop and narrow viewports, with no console errors and no external
requests.
