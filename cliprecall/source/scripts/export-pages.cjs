const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const req = Module.createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
const React = req('react');
const {renderToStaticMarkup} = req('react-dom/server');
const out = path.resolve(process.argv[2] || path.join(root, 'outputs/github-pages/cliprecall'));
const cache = {};
function load(name) {
  if (cache[name]) return cache[name].exports;
  const file = path.join(root, 'app', name);
  const mod = new Module(file); mod.filename = file; mod.paths = Module._nodeModulePaths(root); cache[name] = mod;
  const fallback = mod.require.bind(mod);
  mod.require = id => id.startsWith('./') ? load(id.slice(2) + (id === './content' ? '.ts' : '.tsx')) : fallback(id);
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText, file);
  return mod.exports;
}
const {HomePage, GuidePage} = load('site.tsx');
const {locales, languageTags, translator, route} = load('content.ts');
const base = '/cliprecall'; const origin = 'https://key115.github.io';
const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.mkdirSync(path.join(out, 'assets'), {recursive:true});
fs.copyFileSync(path.join(root,'app/globals.css'),path.join(out,'assets/site.css'));
for(const file of ['appicon.png','echo-hero.webp','echo-hero-small.webp']) fs.copyFileSync(path.join(root,'public/assets',file),path.join(out,'assets',file));
const urls=[];
for(const [i,lang] of locales.entries()) for(const page of ['', 'guide']) {
  const t=translator(lang), url=origin+route(lang,page,base), title=page?`${t('guide')} — ClipRecall`:'ClipRecall', description=t(page?'guideIntro':'meta');
  const alternates=locales.map((l,j)=>`<link rel="alternate" hreflang="${languageTags[j]}" href="${origin+route(l,page,base)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${origin+route('en',page,base)}">`;
  const html='<!doctype html>'+`<html lang="${languageTags[i]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${page?'#f0efe9':'#080d11'}"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}">${alternates}<link rel="icon" href="${base}/assets/appicon.png"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}${base}/assets/echo-hero.webp"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="${base}/assets/site.css"></head><body>`+renderToStaticMarkup(React.createElement(page?GuidePage:HomePage,{lang,base}))+'</body></html>\n';
  const target=path.join(out,lang==='en'?'':lang,page,'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);urls.push(url);console.log(path.relative(out,target),Buffer.byteLength(html));
}
urls.push(origin+base+'/privacy.html',origin+base+'/support.html');
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>`  <url><loc>${url}</loc></url>`).join('\n')+'\n</urlset>\n');
