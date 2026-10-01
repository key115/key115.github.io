# ClipRecall website

Shared React templates render five localized landing pages and five localized guides. The deployed output is plain HTML and CSS, with native FAQ disclosures and no client-side runtime.

From this directory, run `npm ci` then `npm run build`. The build writes into the parent `cliprecall` directory. It preserves existing privacy, support, and unrelated assets. Edit `app/content.ts` for all five languages, `app/site.tsx` for layout, and `app/globals.css` for the Echo design system.

Source design decisions and the application feature audit are in `docs/`. The primary artwork and mobile rendition are in `public/assets/`.
