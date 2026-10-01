# Echo — ClipRecall website design system

Echo translates the app's quiet utility into a gallery-like first encounter: translucent fragments return through one continuous ribbon. The hero is a single commissioned abstract image with live, selectable text. The guide switches to a warm paper surface for extended reading.

## Principles and references

Reviewed 2026-10-01:

- [Apple Human Interface Guidelines](https://developer.apple.com/jp/design/human-interface-guidelines): clear hierarchy and consistent, adaptable navigation. Applied as a sparse hero, stable language controls, familiar links, and a separate practical guide.
- [Apple design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles): purposeful simplicity, user agency, privacy, and craft. Applied through concise copy, direct access to the guide, and precise explanations of local storage and optional permissions.
- [Material 3 foundations](https://m3.material.io/foundations/): reusable tokens, explicit interaction states, accessibility, layout, and content design. Applied through semantic CSS variables, consistent spacing, keyboard focus, responsive reading layouts, and native disclosure controls.

This is a site-specific synthesis, not a claim of universal superiority over either system. Its improvement for this brief is the deliberate transition from expressive art to calm, task-oriented reading.

## Tokens

| Role | Value | Purpose |
| --- | --- | --- |
| Night | `#080d11` | Hero and footer |
| Paper | `#f0efe9` | Reading surface |
| Ink | `#202524` | Primary text on paper |
| Muted | `#626966` | Supporting text |
| Ice | `#beeaff` | Dark-surface accent |
| Accent | `#244f69` | Links and guide markers |
| Rule | `#cdcec7` | Editorial separators |
| Spacing | 4/8-based rhythm; 24–80px responsive gutter | Consistent breathing room |
| Reading measure | 720px maximum guide column | Comfortable long-form reading |
| Display | Georgia / Japanese Mincho system fallback | Editorial voice |
| Body | Arial / Japanese Gothic system fallback | Clear instructions without remote fonts |

## Rules

- One full-screen composition leads the LP. No decorative card grid or application mockup competes with the artwork.
- Every locale has its own LP and guide URL. Switching language preserves the current page. Document language and alternate-language metadata use `zh-Hans` and `pt-BR` where appropriate.
- Japanese hero lines are semantic phrases. CJK display text has no artificial italics; Japanese uses strict line breaking. Body copy can reflow naturally.
- Interactive header and primary controls have at least 44px targets. Visible focus styles, a skip link, semantic landmarks, real headings, a shortcut table, and native FAQ disclosures work without JavaScript.
- The hero is decorative; its empty alt attribute avoids repeating marketing copy. All meaning and actions remain live HTML.
- Motion is limited to short hover feedback and anchor scrolling. Reduced-motion preferences remove both.
- Mobile preserves the same artwork with an intentional crop, then places readable copy over a dark region. The guide's contents move above the article.
- Main body text uses high-contrast ink on opaque paper. Artwork never sits behind long-form instructions.

## Artwork

`echo-hero.webp` and `echo-hero-small.webp` derive from one generated original (1672 × 941). The translucent loop suggests returning to copied fragments, with layered planes as subtle traces of clipboard history. Desktop is about 98 KB; the mobile rendition is about 34 KB. No third-party fonts, tracking scripts, or client JavaScript are required by the GitHub Pages export.
