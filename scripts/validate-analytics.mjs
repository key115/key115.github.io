import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/analytics.js'), 'utf8');
const excluded = new Set(['.git', 'assets', 'source', 'work', 'outputs', 'node_modules']);
function htmlPages(directory, skip = excluded) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return skip.has(entry.name) ? [] : htmlPages(file, skip);
    return /\.html?$/i.test(entry.name) ? [file] : [];
  });
}
// Include Sharebar assets (such as og_card.html), even though root assets are
// excluded from the general analytics-loader inventory.
const sharebarPages = htmlPages(path.join(root, 'sharebar'), new Set());
const pages = [...new Set([...htmlPages(root), ...sharebarPages])];
const CSP_SITE = "default-src 'none'; script-src 'self' https://www.googletagmanager.com; worker-src 'self'; child-src 'self'; style-src 'self'; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; font-src 'self'; connect-src https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; base-uri 'none'; form-action 'none'";
const CSP_RECEIVER = "default-src 'none'; script-src 'self'; worker-src 'self'; child-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'";
const receiver = path.join(root, 'sharebar/s.html');
assert.ok(pages.includes(receiver), 'sharebar/s.html: receiver must exist');
function sharebarPolicy(html, expected, file) {
  const active = html.replace(/<!--(?:>|->|[\s\S]*?(?:-->|--!>|$))/g, '');
  const policies = [...active.matchAll(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"[^>]*>/gi)];
  assert.equal(policies.length, 1, `${file}: exactly one CSP meta`);
  assert.equal(policies[0][1], expected, `${file}: exact Sharebar CSP`);
  const head = active.match(/<head\b[^>]*>[\s\S]*?<\/head\s*>/i);
  const meta = policies[0];
  const end = meta.index + meta[0].length;
  assert.ok(head && meta.index >= head.index + head[0].indexOf('>') + 1 &&
    end <= head.index + head[0].search(/<\/head\s*>/i), `${file}: CSP meta must be inside head`);
  const script = active.search(/<script\b/i);
  assert.ok(script === -1 || end <= script, `${file}: CSP meta must precede every script`);
}
function passiveSharebarPage(html, file) {
  assert.ok(!/<script\b/i.test(html), `${file}: no-CSP page must not contain scripts`);
  assert.ok(!/googletagmanager|google-analytics|analytics\.google|gtag|dataLayer|analytics\.js/i.test(html),
    `${file}: no-CSP page must not contain analytics`);
  assert.ok(!/(?:https?:\/\/|(?<![\w:])\/\/)[^\s"'<>]+/i.test(html) &&
    !/[\w-]*(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i.test(html) &&
    !/\burl\s*\(\s*["']?(?:https?:)?\/\//i.test(html) &&
    !/@import\s*["'](?:https?:)?\/\//i.test(html), `${file}: no-CSP page must not contain external URLs`);
}
// Other Google resources would make "sends nothing to Google" in /privacy.html false.
const otherGoogle = /\b(?:src|href)="https?:\/\/[^"]*(?:googleapis\.com|gstatic\.com|doubleclick\.net|youtube(?:-nocookie)?\.com|google\.com\/recaptcha)/i;
function checkDirectAnalytics(html, file) {
  // Keep comments and RCDATA. Only the CSP meta's content is exempt; its
  // allowed endpoints are policy, not resources loaded by the document.
  const raw = html.replace(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, tag =>
    /\bhttp-equiv\s*=\s*["']Content-Security-Policy["']/i.test(tag)
      ? tag.replace(/(\bcontent\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '$1""') : tag);
  const references = [
    ...raw.matchAll(/[\w-]*(?:src|href|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi),
    ...raw.matchAll(/\burl\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))/gi)
  ];
  const host = /(?:https?:)?\/\/(?:[\w-]+\.)*(?:google-analytics\.com|analytics\.google\.com)(?=[:/?#\s"'<>)]|$)/i;
  for (const match of references) {
    assert.ok(!host.test(match[1] ?? match[2] ?? match[3]),
      `${file}: direct analytics reference forbidden; use the shared loader`);
  }
}
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  checkDirectAnalytics(html, file);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]*analytics\.js)"[^>]*>/g)];
  assert.ok(!otherGoogle.test(html), `${file}: loads another Google resource`);
  if (file === receiver) {
    assert.equal(scripts.length, 0, `${file}: receiver must have zero loaders`);
    assert.ok(!/googletagmanager|google-analytics|analytics\.google|gtag|dataLayer|analytics\.js/i.test(html),
      `${file}: receiver must have zero Google code/hosts`);
    sharebarPolicy(html, CSP_RECEIVER, file);
    continue;
  }
  if (sharebarPages.includes(file)) {
    if (file.startsWith(path.join(root, 'sharebar/assets') + path.sep) &&
        !/<meta\b[^>]*http-equiv=["']Content-Security-Policy["']/i.test(html)) {
      passiveSharebarPage(html, file);
      continue;
    }
    sharebarPolicy(html, CSP_SITE, file);
  }
  assert.equal(scripts.length, 1, `${file}: expected one analytics loader`);
  const ref = scripts[0][1];
  const resolved = ref.startsWith('/') ? path.join(root, ref) : path.resolve(path.dirname(file), ref);
  assert.equal(resolved, path.join(root, 'assets/analytics.js'), `${file}: wrong loader path`);
  assert.ok(/\bdefer\b/.test(scripts[0][0]), `${file}: loader must not block rendering`);
  assert.ok(html.indexOf(scripts[0][0]) < html.indexOf('</head>'), `${file}: loader must be in head`);
  assert.ok(!html.includes('googletagmanager.com/gtag/js'), `${file}: duplicate direct tag`);
}

// The loader reads the browser time zone. Inject it so results never depend on
// the machine running this check. THROWS = Intl throws; MISSING = no timeZone
// in resolvedOptions(); null = no Intl at all.
const THROWS = Symbol('throws'), MISSING = Symbol('missing');
function fakeIntl(timeZone) {
  if (timeZone === null) return undefined;
  return {
    DateTimeFormat() {
      if (timeZone === THROWS) throw new RangeError('no time zone');
      return { resolvedOptions: () => ({ timeZone: timeZone === MISSING ? undefined : timeZone }) };
    }
  };
}
function browser(url, { referrer = '', timeZone = 'Asia/Tokyo' } = {}) {
  const tags = [], listeners = new Map();
  const window = { location: new URL(url) };
  const document = {
    title: 'Public page', referrer,
    // Record what was queued when gtag.js was requested: consent must already be there.
    head: { appendChild: tag => tags.push({ tag, queued: window.dataLayer.map(command => Array.from(command)) }) },
    createElement: () => ({}),
    addEventListener: (type, listener) => listeners.set(type, listener)
  };
  const context = vm.createContext({ window, document, URL, Date, Intl: fakeIntl(timeZone) });
  vm.runInContext(source, context);
  return { window, tags, listeners, context };
}
function quiet(result, label) {
  assert.equal(result.tags.length, 0, `${label}: must not load gtag.js`);
  assert.equal(result.window.dataLayer, undefined, `${label}: must not queue commands`);
  assert.equal(result.listeners.size, 0, `${label}: must not listen for clicks`);
  assert.equal(result.window.key115AnalyticsInitialized, undefined, `${label}: must not mark itself initialized`);
}

// Layer 2: EU 27 (with outermost regions/Aland that have their own ISO 3166-1 codes), EEA, UK.
const notMeasured = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'AX', 'GF', 'GP', 'MQ', 'MF', 'RE', 'YT', 'IS', 'LI', 'NO', 'GB'];
const adsDenied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
function assertConsent(commands, label) {
  const consent = commands.filter(command => command[0] === 'consent');
  assert.equal(consent.length, 2, `${label}: two consent defaults`);
  assert.ok(consent.every(command => command[1] === 'default'), `${label}: defaults only, never update`);
  const regional = consent.find(command => 'region' in command[2]);
  const global = consent.find(command => !('region' in command[2]));
  assert.deepEqual(JSON.parse(JSON.stringify(regional[2])), { ...adsDenied, analytics_storage: 'denied', region: notMeasured });
  assert.deepEqual(JSON.parse(JSON.stringify(global[2])), { ...adsDenied, analytics_storage: 'granted' });
  const last = Math.max(...consent.map(command => commands.indexOf(command)));
  assert.ok(last < commands.findIndex(command => command[0] === 'js'), `${label}: consent before js`);
  assert.ok(last < commands.findIndex(command => command[0] === 'config'), `${label}: consent before config`);
}
assert.equal(notMeasured.length, 38);
assert.equal(new Set(notMeasured).size, notMeasured.length);
assert.ok(notMeasured.every(code => /^[A-Z]{2}$/.test(code)));
assert.ok(!notMeasured.includes('EL') && !notMeasured.includes('UK'), 'ISO codes are GR and GB');
// Also reject dormant/indirect calls (dataLayer.push, gtag.apply, comments).
// Preserve main's literal ban and cover all three JavaScript quote styles.
for (const update of ["'update'", '"update"', '`update`']) {
  assert.ok(!source.includes(update), 'analytics.js must not use consent update');
}
for (const forbidden of ['wait_for_update', 'url_passthrough', 'ads_data_redaction']) {
  assert.ok(!source.includes(forbidden), `analytics.js must not use ${forbidden}`);
}

const groups = {
  bigleaf: 'BigLeaf', sharebar: 'Sharebar', cliprecall: 'ClipRecall',
  redactshot: 'Redact Shot', 'zenrabansho-site': 'Zenrabansho',
  reska: 'Reska', otsuridojo: 'Otsuri Dojo'
};
for (const [folder, group] of Object.entries(groups)) {
  const result = browser(`https://key115.github.io/${folder}/index.html?private=query#private-state`,
    { referrer: 'https://example.com/path?secret=referrer#secret' });
  const commands = result.window.dataLayer.map(command => Array.from(command));
  assertConsent(commands, folder);
  const config = commands.find(command => command[0] === 'config');
  assert.equal(config[1], 'G-C7RWHHPVL6');
  assert.equal(config[2].content_group, group);
  assert.equal(config[2].page_location, `https://key115.github.io/${folder}/`);
  assert.equal(config[2].page_referrer, 'https://example.com/path');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.ok(!JSON.stringify(commands).includes('secret'));
  assert.ok(!JSON.stringify(commands).includes('private'));
  assert.ok(!JSON.stringify(commands).includes('Asia/Tokyo'), `${folder}: the time zone is never sent`);
  assert.equal(result.tags.length, 1);
  assert.equal(result.tags[0].tag.referrerPolicy, 'no-referrer');
  assertConsent(result.tags[0].queued, `${folder} (queued before gtag.js)`);
  // Loading the same shared file twice must not count the page twice.
  vm.runInContext(source, result.context);
  assert.equal(result.tags.length, 1);
  assert.equal(result.window.dataLayer.length, commands.length);
}

// Layer 1: European (and EU/EEA outside Europe) time zones never run Google code (CommandDesk #1545).
for (const timeZone of ['Europe/Paris', 'Europe/London', 'Europe/Dublin', 'Europe/Oslo', 'Europe/Zurich',
  'Europe/Mariehamn', 'Atlantic/Canary', 'Africa/Ceuta', 'Atlantic/Azores', 'Atlantic/Madeira',
  'Asia/Nicosia', 'Asia/Famagusta', 'Atlantic/Reykjavik', 'Atlantic/Jan_Mayen', 'Arctic/Longyearbyen',
  'America/Cayenne', 'America/Guadeloupe', 'America/Martinique', 'America/Marigot', 'Indian/Reunion',
  'Indian/Mayotte', 'GB', 'GB-Eire', 'Eire', 'Iceland', 'Portugal', 'Poland', 'WET', 'CET', 'MET', 'EET',
  MISSING, 42, THROWS, null]) {
  const label = `time zone ${String(timeZone)}`;
  const result = browser('https://key115.github.io/bigleaf/', { timeZone });
  quiet(result, label);
  vm.runInContext(source, result.context);
  quiet(result, `${label} (second load)`);
}
for (const timeZone of ['Asia/Tokyo', 'America/New_York', 'America/Sao_Paulo', 'UTC', '+00:00',
  'Asia/Dubai', 'Africa/Abidjan', 'Australia/Sydney', 'America/St_Barthelemy']) {
  const result = browser('https://key115.github.io/bigleaf/', { timeZone });
  assert.equal(result.tags.length, 1, `time zone ${timeZone}: measured outside Europe`);
  assertConsent(result.window.dataLayer.map(command => Array.from(command)), `time zone ${timeZone}`);
}

// Sharebar: the receiver page and share fragments never run Google code (CommandDesk #1698).
for (const url of [
  'https://key115.github.io/sharebar/s', 'https://key115.github.io/sharebar/s.html',
  'https://key115.github.io/sharebar/s#v2.payload', 'https://key115.github.io/sharebar/s.html?x=1#v2.payload',
  'https://key115.github.io/sharebar/#v1payload', 'https://key115.github.io/sharebar/index.html#v12.payload',
  'https://key115.github.io/sharebar/guide.html#v3'
]) quiet(browser(url), url);
for (const url of ['https://key115.github.io/sharebar/', 'https://key115.github.io/sharebar/#faq',
  'https://key115.github.io/sharebar/#v', 'https://key115.github.io/cliprecall/#v1']) {
  assert.equal(browser(url).tags.length, 1, `${url}: product pages stay measured`);
}

const product = browser('https://key115.github.io/sharebar/guide.html?private=query#sensitive-tool-state');
const baseline = product.window.dataLayer.length;
const click = product.listeners.get('click');
click({ target: { closest: () => ({ href: 'https://key115.github.io/sharebar/s.html#private-share' }) } });
assert.equal(product.window.dataLayer.length, baseline, 'Shared links must not generate click events');
click({ target: { closest: () => ({ href: 'https://apps.apple.com.evil.test/app/id6777128940' }) } });
assert.equal(product.window.dataLayer.length, baseline, 'Only the exact App Store host may be measured');
click({ target: { closest: () => ({ href: 'https://apps.apple.com/jp/app/cliprecall/id6777128940?private=click#secret' }) } });
assert.equal(product.window.dataLayer.length, baseline + 1);
const event = Array.from(product.window.dataLayer.at(-1));
assert.equal(event[0], 'event');
assert.equal(event[1], 'app_store_click');
assert.equal(event[2].content_group, 'ClipRecall');
assert.equal(event[2].app_id, '6777128940');
assert.equal(event[2].link_url, 'https://apps.apple.com/app/id6777128940');
assert.ok(!JSON.stringify(event).includes('private'));
const directory = browser('https://key115.github.io/').window.dataLayer.map(command => Array.from(command));
assert.equal(directory.find(command => command[0] === 'config')[2].content_group, 'App directory');
for (const url of ['http://localhost:8765/', 'http://127.0.0.1:8765/sharebar/', 'file:///tmp/index.html']) {
  quiet(browser(url), url);
}
for (const folder of Object.keys(groups)) {
  const policy = fs.readFileSync(path.join(root, folder, 'privacy.html'), 'utf8');
  assert.ok(policy.includes('GA4') && policy.includes('../privacy.html'), `${folder}: missing website disclosure`);
}
const websitePolicy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
for (const sentence of [
  'GA4はブラウザを識別するためCookieを使用します（EU・EEA・英国からの閲覧は下記のとおり）。',
  'ブラウザのタイムゾーンがヨーロッパか、ヨーロッパの外にあるEU・EEAの地域（カナリア諸島・キプロス・フランスの海外県など）の場合、このサイトはGoogleのタグを読み込まず、Googleへは何も送信しません。',
  'タイムゾーンがそれ以外でも、GoogleがEU・EEA・英国からの閲覧と判定した場合、GA4はCookieを読み書きしません。',
  'この場合もGoogleのタグは読み込まれ、Cookieを使わない最小限のデータ（ページのURL・タイトル・参照元、App Storeへのリンクのクリック、ブラウザ・画面サイズ・言語など）が、通信元のIPアドレスとともにGoogleへ届きます。',
  'Sharebarの共有リンク（#v…）を開いた時と、/sharebar/sでは、Googleのタグを読み込みません。',
  'Sharebarのページを開いたまま、同じページの中でURLを共有リンク（#v…）に変えた場合、それまでに読み込んだタグは残ります（トップページ（/sharebar/）はすぐに/sharebar/sへ移ります）。履歴の変化による計測はオフにしています。',
  'GA4 uses cookies to distinguish browsers (see below for visits from the EU, the EEA, and the UK).',
  "If your browser's time zone is in Europe or in an EU/EEA region outside Europe (such as the Canary Islands, Cyprus, or the French overseas departments), this site does not load the Google tag and sends nothing to Google.",
  'If your time zone is elsewhere but Google determines that the visit comes from the EU, the EEA, or the UK, GA4 does not read or write cookies.',
  "The Google tag still loads in that case, and minimal cookieless data (page URL, title, and referrer, App Store link clicks, browser, screen size, language, and similar) reaches Google along with the connection's IP address.",
  'Opening a Sharebar shared link (#v…) or /sharebar/s does not load the Google tag.',
  'If an open Sharebar page changes its URL to a shared link (#v…) within the same page, tags already loaded remain (the landing page /sharebar/ immediately redirects to /sharebar/s); history-change measurement is disabled.'
]) assert.ok(websitePolicy.includes(sentence), `privacy.html: missing disclosure: ${sentence}`);
for (const unconditional of ['GA4はブラウザを識別するためCookieを使用します。', 'GA4 uses cookies to distinguish browsers.']) {
  assert.ok(!websitePolicy.includes(unconditional), `privacy.html: unconditional cookie sentence: ${unconditional}`);
}
const legal = fs.readFileSync(path.join(root, 'cliprecall/privacy.html'), 'utf8');
const translations = JSON.parse(legal.match(/var ROOTS = (\{.*?\});\n  var TITLE/s)[1]);
for (const [locale, html] of Object.entries(translations)) {
  assert.ok(html.includes('GA4') && html.includes('../privacy.html'), `${locale}: missing translated disclosure`);
}
// ClipRecall's LP/guide source lives in CommandDesk (PRJ-011 output/site/landing, #1673).
assert.ok(!fs.existsSync(path.join(root, 'cliprecall/source')), 'cliprecall/source must not be published');
console.log(`PASS: ${pages.length} public pages; all 7 site groups; no other Google resources; EU/EEA/UK layer 1 (time zone) and layer 2 (regional consent defaults before gtag.js); Sharebar receiver and share fragments untracked; sanitized URLs and App Store clicks; no duplicate/local tracking; disclosures in all locales; Sharebar CSP; ClipRecall source not published.`);
