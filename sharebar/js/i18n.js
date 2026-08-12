// i18n.js — EN / 日本語 toggle for the whole site (header lang tabs).
//
// SPDX-License-Identifier: MIT
//
// Mechanism (deliberately dumb, CSP-safe, zero DOM building):
//   * every translatable piece of content exists TWICE in the static HTML,
//     tagged data-lang="en" / data-lang="ja"; assets/style.css shows exactly
//     one of the pair based on the <html lang> attribute,
//   * this file only decides WHICH language is active: it sets <html lang>,
//     wires the two header tab buttons (#lang-en / #lang-ja), swaps
//     document.title from the <title> element's data-ja attribute, and
//     remembers an explicit choice.
//
// It never touches location.hash (Share Links stay intact), never builds or
// injects markup (no innerHTML anywhere — F-018 discipline), and makes no
// network requests. The stored value is a single 'en'/'ja' preference in
// localStorage; storage being unavailable (private mode, blocked) just means
// the choice isn't remembered across visits — the toggle still works.
//
// app.js is NOT coupled to this file: the receiver's dynamic evaluation UI
// (field labels, error text) stays in English, which keeps the app.test.js
// sandbox contract untouched. Everything static — including the receiver
// chrome around the editor — is translated via the data-lang pairs.

'use strict';

(function () {
  var KEY = 'sharebar-lang';
  var root = document.documentElement;

  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(lang) {
    try { window.localStorage.setItem(KEY, lang); } catch (e) {}
  }

  // Explicit choice wins; otherwise first ja/en hit in the browser languages.
  function detect() {
    var s = stored();
    if (s === 'ja' || s === 'en') return s;
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i] || '').toLowerCase();
      if (l === 'ja' || l.indexOf('ja-') === 0) return 'ja';
      if (l === 'en' || l.indexOf('en-') === 0) return 'en';
    }
    return 'en';
  }

  var titleEl = document.querySelector('title');
  var enTitle = titleEl ? titleEl.textContent : '';

  function apply(lang) {
    root.setAttribute('lang', lang);
    if (titleEl) {
      var ja = titleEl.getAttribute('data-ja');
      document.title = (lang === 'ja' && ja) ? ja : enTitle;
    }
    var be = document.getElementById('lang-en');
    var bj = document.getElementById('lang-ja');
    if (be) be.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
    if (bj) bj.setAttribute('aria-pressed', lang === 'ja' ? 'true' : 'false');
  }

  function init() {
    apply(detect());
    var be = document.getElementById('lang-en');
    var bj = document.getElementById('lang-ja');
    if (be) be.addEventListener('click', function () { store('en'); apply('en'); });
    if (bj) bj.addEventListener('click', function () { store('ja'); apply('ja'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
