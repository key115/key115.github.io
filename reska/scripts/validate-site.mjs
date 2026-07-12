import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "privacy.html", "support.html"];
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const failures = [];

function fail(file, message) { failures.push(`${file}: ${message}`); }

function validateMarkup(file, html) {
  if (!/^<!doctype html>/i.test(html)) fail(file, "missing HTML5 doctype");
  if (!/<meta charset="utf-8">/i.test(html)) fail(file, "missing UTF-8 declaration");
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(file, "missing title");
  if (!html.includes('class="en"') || !html.includes('class="ja"')) fail(file, "missing bilingual content");
  if (/\son[a-z]+\s*=/i.test(html)) fail(file, "inline event handler found");
  if (/Accessibility|アクセシビリティ/.test(html)) fail(file, "store-facing forbidden term found");

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) fail(file, `duplicate id #${id}`);
  }

  const stack = [];
  const source = html.replace(/<!--[^]*?-->/g, "");
  for (const token of source.matchAll(/<\/?([a-z][a-z0-9-]*)(?:\s[^<>]*?)?\s*\/?>/gi)) {
    const full = token[0];
    const tag = token[1].toLowerCase();
    if (full.startsWith("</")) {
      const expected = stack.pop();
      if (expected !== tag) fail(file, `closing </${tag}> does not match <${expected || "none"}>`);
    } else if (!voidTags.has(tag) && !full.endsWith("/>")) {
      stack.push(tag);
    }
  }
  if (stack.length) fail(file, `unclosed tags: ${stack.join(", ")}`);

  for (const match of html.matchAll(/<(?:script|img|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/gi)) {
    const ref = match[1];
    if (/^https?:\/\//i.test(ref)) {
      if (!/rel="canonical"/i.test(match[0])) fail(file, `external resource request: ${ref}`);
      continue;
    }
    const resolved = path.resolve(site, ref.split(/[?#]/)[0]);
    if (!fs.existsSync(resolved)) fail(file, `missing local resource: ${ref}`);
  }

  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)) {
    const ref = match[1];
    if (ref.startsWith("mailto:") || ref.startsWith("#")) continue;
    if (/^[a-z]+:/i.test(ref)) fail(file, `unexpected external link: ${ref}`);
    const resolved = path.resolve(site, ref.split(/[?#]/)[0]);
    if (!fs.existsSync(resolved)) fail(file, `broken local link: ${ref}`);
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { fail(file, `invalid JSON-LD: ${error.message}`); }
  }
}

for (const file of pages) {
  const html = fs.readFileSync(path.join(site, file), "utf8");
  validateMarkup(file, html);
}

const privacy = fs.readFileSync(path.join(site, "privacy.html"), "utf8");
for (const phrase of ["Data Not Collected", "network entitlement", "ScreenCaptureKit", "StoreKit", "nothing is recorded, saved, or sent"]) {
  if (!privacy.toLowerCase().includes(phrase.toLowerCase())) fail("privacy.html", `required disclosure missing: ${phrase}`);
}

const support = fs.readFileSync(path.join(site, "support.html"), "utf8");
for (const phrase of ["⌃⌥⌘P", "Restore Purchase", "Screen Recording", "2–3 business days"]) {
  if (!support.includes(phrase)) fail("support.html", `required support detail missing: ${phrase}`);
}

const trialDisclosures = {
  "index.html": [
    "does not start at first launch",
    "free Non-Consumable in-app purchase",
    "verified StoreKit transaction purchase date",
    "no automatic renewal, subscription, or charge",
    "初回起動では試用は始まりません",
    "自動更新、サブスクリプション、自動課金はありません",
  ],
  "privacy.html": [
    "does not start when you first open Reska",
    "free Non-Consumable in-app purchase",
    "purchase date from a verified StoreKit transaction",
    "does not renew, convert to a subscription, or charge you automatically",
    "初回起動では試用は始まりません",
    "自動更新されず、サブスクリプションへ移行せず、自動課金もありません",
  ],
  "support.html": [
    "Opening Reska does not start the trial",
    "free Non-Consumable in-app purchase",
    "verified StoreKit transaction purchase date",
    "paid unlock is optional while the trial is active",
    "初回起動では試用は始まりません",
    "自動更新されたり、サブスクリプションへ移行したり、自動課金されたりすることはありません",
  ],
};
for (const [file, phrases] of Object.entries(trialDisclosures)) {
  const html = fs.readFileSync(path.join(site, file), "utf8");
  for (const phrase of phrases) {
    if (!html.includes(phrase)) fail(file, `current trial disclosure missing: ${phrase}`);
  }
}

const legacyTrialPatterns = [
  /local\s+date\s+used\s+to\s+determine\s+trial\s+eligibility/i,
  /試用資格.{0,4}判定.{0,6}ローカル.{0,3}日付/,
  /trial\s+starts\s+automatically/i,
  /試用.{0,4}自動的に開始/,
];
for (const file of pages) {
  const html = fs.readFileSync(path.join(site, file), "utf8");
  for (const pattern of legacyTrialPatterns) {
    if (pattern.test(html)) fail(file, `legacy trial claim remains: ${pattern}`);
  }
}

const js = fs.readFileSync(path.join(site, "assets/site.js"), "utf8");
try { new vm.Script(js, { filename: "assets/site.js" }); } catch (error) { fail("assets/site.js", error.message); }

const css = fs.readFileSync(path.join(site, "assets/site.css"), "utf8").replace(/\/\*[^]*?\*\//g, "");
let depth = 0;
for (const character of css) {
  if (character === "{") depth += 1;
  if (character === "}") depth -= 1;
  if (depth < 0) break;
}
if (depth !== 0) fail("assets/site.css", `unbalanced braces (${depth})`);

const icon = fs.readFileSync(path.join(site, "assets/appicon.png"));
const pngSignature = "89504e470d0a1a0a";
if (icon.subarray(0, 8).toString("hex") !== pngSignature) fail("assets/appicon.png", "invalid PNG signature");
if (icon.readUInt32BE(16) !== 512 || icon.readUInt32BE(20) !== 512) fail("assets/appicon.png", "expected 512 x 512 icon");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`PASS — ${pages.length} HTML pages, shared CSS/JS, local links, disclosures, and 512px icon validated.`);
