/* BigLeaf site engine — lang toggle, scroll progress, reveals,
   count-up, parallax, pinned scenes. No dependencies, no requests. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // ---------- App Store URL (single switch — fill in after approval) ----------
  var APP_STORE_URL = 'https://apps.apple.com/app/id6779291028';

  // ---------- Ko-fi page URL (single switch — fill in when the page exists) ----
  // Same placeholder pattern as APP_STORE_URL, and the same rule as the
  // portfolio precedent (PRJ-015): the "Support the developer" section ships
  // HIDDEN and is revealed only when this constant holds a host-exact
  // https://ko-fi.com/<page> URL. An empty or malformed value means the section
  // never appears — a missing tip lane is always preferable to a broken one.
  // The section markup exists on the landing page only; support.html and
  // privacy.html (the pages the app links to directly) must never carry it.
  var KOFI_URL = '';
  var KOFI_RE = /^https:\/\/ko-fi\.com\/[A-Za-z0-9_-]+$/;

  // ---------- language (default EN, persisted) ----------
  var LANG_KEY = 'bigleaf-lang';
  var saved = 'en';
  try { saved = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) {}
  setLang(saved === 'ja' ? 'ja' : 'en');

  function setLang(l) {
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l);
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    document.querySelectorAll('.lang-btn button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(
        (l === 'en') === b.classList.contains('opt-en')
      ));
    });
  }

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  addEventListener('DOMContentLoaded', function () {

    // lang buttons
    document.querySelectorAll('.lang-btn').forEach(function (el) {
      [['opt-en', 'EN', 'en'], ['opt-ja', '日本語', 'ja']].forEach(function (def) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = def[0];
        b.textContent = def[1];
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { setLang(def[2]); });
        el.appendChild(b);
      });
    });
    setLang(document.documentElement.getAttribute('data-lang') || 'en');

    // App Store CTAs
    document.querySelectorAll('[data-appstore]').forEach(function (a) {
      if (APP_STORE_URL) { a.href = APP_STORE_URL; }
      else {
        a.addEventListener('click', function (e) {
          if (a.getAttribute('href') === '#') e.preventDefault();
        });
      }
    });

    // Ko-fi lane — reveal only with a confirmed, host-exact URL.
    document.querySelectorAll('[data-kofi]').forEach(function (a) {
      if (!KOFI_RE.test(KOFI_URL)) { return; }
      a.href = KOFI_URL;
      a.rel = 'noopener';
      var lane = a.closest('[data-kofi-lane]');
      if (lane) { lane.hidden = false; }
    });

    // ---------- scroll progress ----------
    var bar = document.createElement('div');
    bar.id = 'progress';
    document.body.appendChild(bar);
    function progress() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    addEventListener('scroll', progress, { passive: true });
    progress();

    // ---------- reveal on scroll ----------
    if (reduced) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
        });
      }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        var parent = el.closest('[data-stagger]');
        if (parent) {
          var sibs = Array.prototype.slice.call(parent.querySelectorAll('[data-reveal]'));
          el.style.transitionDelay = (sibs.indexOf(el) * 0.1) + 's';
        }
        rio.observe(el);
      });
    }

    // ---------- count-up ----------
    function finalText(el) {
      var raw = el.getAttribute('data-count');
      return parseFloat(raw).toFixed((raw.split('.')[1] || '').length);
    }
    if (reduced) {
      document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = finalText(el); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target;
          var raw = el.getAttribute('data-count');
          var target = parseFloat(raw);
          var dec = (raw.split('.')[1] || '').length;
          var dur = 1400, t0 = null;
          function step(t) {
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(dec);
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: .6 });
      document.querySelectorAll('[data-count]').forEach(function (el) {
        el.textContent = (0).toFixed((el.getAttribute('data-count').split('.')[1] || '').length);
        cio.observe(el);
      });
    }

    // ---------- parallax ----------
    var pxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (pxEls.length && !reduced) {
      var pxTick = function () {
        var vh = innerHeight;
        pxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var mid = r.top + r.height / 2 - vh / 2;
          el.style.transform = 'translateY(' + (-mid * parseFloat(el.getAttribute('data-parallax'))).toFixed(1) + 'px)';
        });
      };
      addEventListener('scroll', pxTick, { passive: true });
      pxTick();
    }

    // ---------- pinned scenes ----------
    // .pin-wrap (tall) > .pin (sticky). Sets --p (0..1) on the wrap and keys
    // [data-step] elements by attribute VALUE (dots and stats share indices).
    var wraps = Array.prototype.slice.call(document.querySelectorAll('.pin-wrap'));
    if (wraps.length && !reduced) {
      var pinTick = function () {
        wraps.forEach(function (w) {
          var r = w.getBoundingClientRect();
          var total = r.height - innerHeight;
          var p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 1;
          w.style.setProperty('--p', p.toFixed(4));
          var steps = w.querySelectorAll('[data-step]');
          var n = 0;
          steps.forEach(function (s) { n = Math.max(n, parseInt(s.getAttribute('data-step'), 10) + 1); });
          if (n < 1) return;
          var curIdx = Math.min(Math.floor(p * n), n - 1);
          steps.forEach(function (s) {
            var i = parseInt(s.getAttribute('data-step'), 10);
            s.classList.toggle('on', i <= curIdx);
            s.classList.toggle('cur', i === curIdx);
          });
        });
      };
      addEventListener('scroll', pinTick, { passive: true });
      addEventListener('resize', pinTick, { passive: true });
      pinTick();
    } else if (wraps.length) {
      // reduced motion: first step visible, CSS flattens the rest into flow
      wraps.forEach(function (w) {
        w.querySelectorAll('[data-step]').forEach(function (s) { s.classList.add('cur', 'on'); });
      });
    }
  });
})();
