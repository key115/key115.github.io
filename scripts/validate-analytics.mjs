import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/analytics.js'), 'utf8');
const excluded = new Set(['.git', 'assets', 'source', 'work', 'outputs', 'node_modules']);
function htmlPages(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return excluded.has(entry.name) ? [] : htmlPages(file);
    return entry.name.endsWith('.html') ? [file] : [];
  });
}
const pages = htmlPages(root);
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]*analytics\.js)"[^>]*>/g)];
  assert.equal(scripts.length, 1, `${file}: expected one analytics loader`);
  const ref = scripts[0][1];
  const resolved = ref.startsWith('/') ? path.join(root, ref) : path.resolve(path.dirname(file), ref);
  assert.equal(resolved, path.join(root, 'assets/analytics.js'), `${file}: wrong loader path`);
  assert.ok(/\bdefer\b/.test(scripts[0][0]), `${file}: loader must not block rendering`);
  assert.ok(html.indexOf(scripts[0][0]) < html.indexOf('</head>'), `${file}: loader must be in head`);
  assert.ok(!html.includes('googletagmanager.com/gtag/js'), `${file}: duplicate direct tag`);
}

function browser(url, referrer = '') {
  const tags = [], listeners = new Map();
  const window = { location: new URL(url) };
  const document = {
    title: 'Public page', referrer,
    head: { appendChild: tag => tags.push(tag) },
    createElement: () => ({}),
    addEventListener: (type, listener) => listeners.set(type, listener)
  };
  const context = vm.createContext({ window, document, URL, Date });
  vm.runInContext(source, context);
  return { window, tags, listeners, context };
}
const groups = {
  bigleaf: 'BigLeaf', sharebar: 'Sharebar', cliprecall: 'ClipRecall',
  redactshot: 'Redact Shot', 'zenrabansho-site': 'Zenrabansho',
  reska: 'Reska', otsuridojo: 'Otsuri Dojo'
};
for (const [folder, group] of Object.entries(groups)) {
  const result = browser(`https://key115.github.io/${folder}/index.html?private=query#private-state`,
    'https://example.com/path?secret=referrer#secret');
  const commands = result.window.dataLayer.map(command => Array.from(command));
  const config = commands.find(command => command[0] === 'config');
  assert.equal(config[1], 'G-C7RWHHPVL6');
  assert.equal(config[2].content_group, group);
  assert.equal(config[2].page_location, `https://key115.github.io/${folder}/`);
  assert.equal(config[2].page_referrer, 'https://example.com/path');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.ok(!JSON.stringify(commands).includes('secret'));
  assert.ok(!JSON.stringify(commands).includes('private'));
  assert.equal(result.tags.length, 1);
  assert.equal(result.tags[0].referrerPolicy, 'no-referrer');
  // Loading the same shared file twice must not count the page twice.
  vm.runInContext(source, result.context);
  assert.equal(result.tags.length, 1);
  assert.equal(result.window.dataLayer.length, commands.length);
}
const share = browser('https://key115.github.io/sharebar/s.html?private=query#sensitive-tool-state');
const click = share.listeners.get('click');
click({ target: { closest: () => ({ href: 'https://key115.github.io/sharebar/s.html#private-share' }) } });
assert.equal(share.window.dataLayer.length, 2, 'Shared links must not generate click events');
click({ target: { closest: () => ({ href: 'https://apps.apple.com.evil.test/app/id6777128940' }) } });
assert.equal(share.window.dataLayer.length, 2, 'Only the exact App Store host may be measured');
click({ target: { closest: () => ({ href: 'https://apps.apple.com/jp/app/cliprecall/id6777128940?private=click#secret' }) } });
const event = Array.from(share.window.dataLayer.at(-1));
assert.equal(event[0], 'event');
assert.equal(event[1], 'app_store_click');
assert.equal(event[2].content_group, 'ClipRecall');
assert.equal(event[2].app_id, '6777128940');
assert.equal(event[2].link_url, 'https://apps.apple.com/app/id6777128940');
assert.ok(!JSON.stringify(event).includes('private'));
assert.equal(browser('https://key115.github.io/').window.dataLayer[1][2].content_group, 'App directory');
for (const url of ['http://localhost:8765/', 'http://127.0.0.1:8765/sharebar/', 'file:///tmp/index.html']) {
  const result = browser(url);
  assert.equal(result.tags.length, 0);
  assert.equal(result.window.dataLayer, undefined);
}
for (const folder of Object.keys(groups)) {
  const policy = fs.readFileSync(path.join(root, folder, 'privacy.html'), 'utf8');
  assert.ok(policy.includes('GA4') && policy.includes('../privacy.html'), `${folder}: missing website disclosure`);
}
const legal = fs.readFileSync(path.join(root, 'cliprecall/privacy.html'), 'utf8');
const translations = JSON.parse(legal.match(/var ROOTS = (\{.*?\});\n  var TITLE/s)[1]);
for (const [locale, html] of Object.entries(translations)) {
  assert.ok(html.includes('GA4') && html.includes('../privacy.html'), `${locale}: missing translated disclosure`);
}
for (const file of pages.filter(file => file.includes(`${path.sep}sharebar${path.sep}`))) {
  const html = fs.readFileSync(file, 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.ok(csp.includes("script-src 'self' https://www.googletagmanager.com"));
  assert.ok(csp.includes('connect-src https://*.google-analytics.com'));
  assert.ok(csp.includes("worker-src 'self'"));
  assert.ok(!csp.includes('unsafe-inline') && !csp.includes('unsafe-eval'));
}
assert.ok(fs.readFileSync(path.join(root, 'cliprecall/source/scripts/export-pages.cjs'), 'utf8')
  .includes('<script src="/assets/analytics.js" defer></script>'));
console.log(`PASS: ${pages.length} public pages; all 7 site groups; sanitized URLs and App Store clicks; no duplicate/local tracking; disclosures in all locales; Sharebar CSP; ClipRecall exporter.`);
