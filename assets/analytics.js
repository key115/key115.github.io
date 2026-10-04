/* Shared GA4 configuration for the public GitHub Pages websites. */
(function () {
  'use strict';

  // Keep local previews out of production reports and avoid duplicate setup.
  if (window.location.hostname !== 'key115.github.io' || window.key115AnalyticsInitialized) return;
  window.key115AnalyticsInitialized = true;

  var measurementId = 'G-C7RWHHPVL6';
  var sites = {
    bigleaf: 'BigLeaf',
    sharebar: 'Sharebar',
    cliprecall: 'ClipRecall',
    redactshot: 'Redact Shot',
    'zenrabansho-site': 'Zenrabansho',
    reska: 'Reska',
    otsuridojo: 'Otsuri Dojo'
  };
  var storeApps = {
    '6779291028': 'BigLeaf',
    '6781006552': 'Sharebar',
    '6777128940': 'ClipRecall',
    '6777128789': 'Redact Shot',
    '6766777378': 'Zenrabansho'
  };
  var contentGroup = sites[window.location.pathname.split('/')[1]] || 'App directory';

  // Never include query parameters or fragments (Sharebar encodes state in #).
  function pageUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.origin + url.pathname.replace(/\/index\.html$/, '/');
    } catch (error) {
      return '';
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    content_group: contentGroup,
    page_location: pageUrl(window.location.href),
    page_referrer: pageUrl(document.referrer),
    page_title: document.title,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'key115.github.io',
    cookie_flags: 'SameSite=Lax;Secure'
  });

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  tag.referrerPolicy = 'no-referrer';
  document.head.appendChild(tag);

  // Track only public App Store destinations. Never inspect forms, link text,
  // clipboard contents, Sharebar inputs, or shared tool state.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var url;
    try { url = new URL(link.href); } catch (error) { return; }
    if (url.hostname !== 'apps.apple.com' || url.protocol !== 'https:') return;
    var app = url.pathname.match(/\/id(\d+)(?:\/|$)/);
    if (!app) return;
    window.gtag('event', 'app_store_click', {
      send_to: measurementId,
      content_group: storeApps[app[1]] || contentGroup,
      app_id: app[1],
      link_url: 'https://apps.apple.com/app/id' + app[1]
    });
  }, true);
})();
