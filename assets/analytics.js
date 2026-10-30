/* Shared GA4 configuration for the public GitHub Pages websites. */
(function () {
  'use strict';

  // Keep local previews out of production reports and avoid duplicate setup.
  if (window.location.hostname !== 'key115.github.io' || window.key115AnalyticsInitialized) return;

  // Sharebar: the receiver page and any /sharebar/ URL carrying shared state
  // (#v<digit>...) never run Google code (CommandDesk #1698).
  var path = window.location.pathname;
  if (/^\/sharebar\/s(?:\.html)?$/.test(path) ||
      (path.indexOf('/sharebar/') === 0 && /^#v\d/.test(window.location.hash))) return;

  // EU/EEA/UK, layer 1 (CommandDesk #1545): a browser set to a European time
  // zone never loads Google code. The zone is only compared here and is never
  // sent. If it cannot be read, nothing is loaded either.
  var euZonesOutsideEurope = [
    'Atlantic/Canary', 'Africa/Ceuta', 'Atlantic/Azores', 'Atlantic/Madeira',
    'Asia/Nicosia', 'Asia/Famagusta', 'Atlantic/Reykjavik', 'Atlantic/Jan_Mayen', 'Arctic/Longyearbyen',
    'America/Cayenne', 'America/Guadeloupe', 'America/Martinique', 'America/Marigot',
    'Indian/Reunion', 'Indian/Mayotte',
    'GB', 'GB-Eire', 'Eire', 'Iceland', 'Portugal', 'Poland', 'WET', 'CET', 'MET', 'EET'
  ];
  var zone;
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (error) { return; }
  if (typeof zone !== 'string' || /^Europe\//.test(zone) || euZonesOutsideEurope.indexOf(zone) !== -1) return;

  window.key115AnalyticsInitialized = true;

  var measurementId = 'G-C7RWHHPVL6';
  // EU/EEA/UK, layer 2: when Google places the visitor in one of these regions
  // (ISO 3166-1; Google resolves the region), every consent type stays denied,
  // so GA4 reads and writes no cookies. No banner and no consent update, ever.
  // EU 27 + outermost regions/Aland with their own codes, EEA (IS LI NO), UK (GB).
  var notMeasuredRegions = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'AX', 'GF', 'GP', 'MQ', 'MF', 'RE', 'YT',
    'IS', 'LI', 'NO',
    'GB'
  ];
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
    '6766777378': 'Zenrabansho',
    '6802313456': 'Otsuri Dojo'
  };
  var contentGroup = sites[path.split('/')[1]] || 'App directory';

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
  // Consent defaults must be queued before js/config and before gtag.js loads.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: notMeasuredRegions
  });
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
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
