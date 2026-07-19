// app.js — Share Page main thread: hash decode, editor UI, watchdog, CTAs.
//
// SPDX-License-Identifier: MIT
//
// This is the ONLY DOM-touching file. It holds NO tool/codec logic — all of
// that is in the worker + the ONE shipped bundle (ADR-0001). Responsibilities:
//   * read location.hash, hand it to the worker to decode (F-026 guards apply
//     inside the core),
//   * build a small editor for the decoded tool and re-run on edit via the
//     worker (the receiver tweaks values; edits are NEVER written back to the
//     URL — F-018),
//   * enforce the 200 ms regex watchdog by terminating + respawning the worker
//     (F-027),
//   * render every result as TEXT NODES only (innerHTML is never used on
//     fragment-derived data — XSS-safe by construction),
//   * wire the CTAs: "Open in Sharebar" (sharebar://, with graceful fallback to
//     Get the app when the app is not installed) and "Get the app".
//
// No external requests, no cookies, no storage of link content.

'use strict';

(function () {
  var WATCHDOG_MS = 200; // F-027 regex evaluation cutoff.
  var $ = function (id) { return document.getElementById(id); };

  // --- tiny DOM helpers (text nodes only; never innerHTML on link data) -----
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.appendChild(document.createTextNode(String(text)));
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function row(label, value) {
    var r = el('div', 'kv');
    r.appendChild(el('span', 'k', label));
    r.appendChild(el('span', 'v', value));
    return r;
  }

  // --- worker lifecycle + 200ms watchdog -----------------------------------
  var worker = null;
  var nextId = 1;
  var pending = {}; // id -> {resolve, timer}

  function spawnWorker() {
    if (worker) { try { worker.terminate(); } catch (e) {} }
    worker = new Worker('js/worker.js');
    worker.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.type === 'ready') return;
      var p = pending[msg.id];
      if (!p) return;
      clearTimeout(p.timer);
      delete pending[msg.id];
      p.resolve(msg);
    };
    worker.onerror = function () {
      // A worker-level error (e.g. importScripts failure) — fail closed.
      Object.keys(pending).forEach(function (id) {
        var p = pending[id];
        clearTimeout(p.timer);
        delete pending[id];
        p.resolve({ ok: false, error: { code: 'WORKER_ERROR', message: 'evaluation engine failed to load' } });
      });
    };
  }

  // Post a job to the worker with a deadline. On timeout we TERMINATE the worker
  // (the only way to stop catastrophic backtracking) and respawn it, resolving
  // with a TIMEOUT error so the UI shows "pattern too complex" (F-027).
  function ask(type, payload, deadlineMs) {
    return new Promise(function (resolve) {
      var id = nextId++;
      var timer = setTimeout(function () {
        delete pending[id];
        spawnWorker(); // kill the stuck engine, get a fresh one for next time.
        resolve({ ok: false, timeout: true, error: { code: 'TIMEOUT', message: 'pattern is too complex (evaluation timed out)' } });
      }, deadlineMs);
      pending[id] = { resolve: resolve, timer: timer };
      var m = { id: id, type: type };
      for (var k in payload) m[k] = payload[k];
      worker.postMessage(m);
    });
  }

  // --- friendly messages for the structured error codes (presentation layer) -
  var ERROR_TEXT = {
    UNKNOWN_VERSION: 'This link was made by a newer version of Sharebar. Get the latest app to open it.',
    OVERSIZE_ENCODED: 'This link is too large to be a valid Sharebar link.',
    DEFLATE_BOMB: 'This link is too large to be a valid Sharebar link.',
    BAD_BASE64URL: 'This link is damaged and can’t be read.',
    BAD_DEFLATE: 'This link is damaged and can’t be read.',
    MALFORMED_UTF8: 'This link is damaged and can’t be read.',
    BAD_JSON: 'This link is damaged and can’t be read.',
    SCHEMA_INVALID: 'This link doesn’t contain a valid Sharebar tool.',
    UNKNOWN_TOOL: 'This link uses a tool this page doesn’t support yet.',
    EMPTY: 'This link is empty.',
    BAD_INPUT: 'This isn’t a Sharebar link.',
    TIMEOUT: 'That pattern is too complex to evaluate safely.',
    WORKER_ERROR: 'Something went wrong loading the engine. Please reload.'
  };
  function errorText(err) {
    if (!err) return 'This link could not be read.';
    return ERROR_TEXT[err.code] || 'This link could not be read.';
  }

  // --- state ----------------------------------------------------------------
  var current = null; // the decoded (and possibly edited) state.

  function baseOpts(extra) {
    var o = { baseEpochMs: Date.now() };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  // ========================================================================
  // Boot
  // ========================================================================
  // A real Sharebar link fragment is "#v<digits>.<payload>" (the core stamps the
  // schema version into the prefix). Plain in-page anchors like "#get" / "#open"
  // are NOT links and must NOT be handed to the decoder — doing so yields
  // UNKNOWN_VERSION (the core reads "get" as an unknown version) and wrongly
  // shows the receiver error screen instead of the anchored landing section.
  // This is the boot-level backstop behind the receiver "Get the app" fallback
  // (which links to index.html#get): a non-link hash always shows the landing.
  // (#90 — F-018 graceful fallback.)
  var LINK_FRAGMENT = /^#?v\d+\./;
  function isLinkFragment(frag) {
    return LINK_FRAGMENT.test(frag || '');
  }

  function boot() {
    spawnWorker();
    var frag = location.hash || '';
    if (!isLinkFragment(frag)) {
      showLanding();
      return;
    }
    showReceiver();
    ask('decode', { fragment: frag }, 5000).then(function (res) {
      if (!res || !res.ok) {
        renderLinkError(res && res.error);
        return;
      }
      current = res.state;
      buildEditor(current);
      rerun();
      wireCTAs(frag);
    });
  }

  function showLanding() {
    if ($('landing')) $('landing').hidden = false;
    if ($('receiver')) $('receiver').hidden = true;
  }
  function showReceiver() {
    if ($('landing')) $('landing').hidden = true;
    if ($('receiver')) $('receiver').hidden = false;
  }

  function renderLinkError(err) {
    var box = $('result');
    clear(box);
    var e = el('div', 'error');
    e.appendChild(el('p', 'error-msg', errorText(err)));
    var cta = el('a', 'btn primary', 'Get the app');
    cta.setAttribute('href', '#get');
    cta.id = 'cta-getapp-error';
    e.appendChild(cta);
    box.appendChild(e);
    var ed = $('editor'); if (ed) clear(ed);
    var title = $('tool-title'); if (title) { clear(title); title.appendChild(document.createTextNode('Couldn’t open this link')); }
    // Nothing is editable and there is no state to hand to the app: the
    // "reproduction" blurb and the Open/Get CTA row would contradict the error.
    var sub = $('tool-sub'); if (sub) sub.hidden = true;
    var ctas = $('receiver-ctas'); if (ctas) ctas.hidden = true;
  }

  // ========================================================================
  // Editors (one small form per tool kind). Inputs reflect the decoded state;
  // editing re-runs through the worker. Edits never touch location.hash.
  // ========================================================================
  function buildEditor(state) {
    var host = $('editor');
    clear(host);
    var t = state.tool;
    var title = $('tool-title');
    if (title) { clear(title); title.appendChild(document.createTextNode(TOOL_LABEL[t.kind] || t.kind)); }
    // Undo renderLinkError's hiding (hashchange can go error → valid link).
    var sub = $('tool-sub'); if (sub) sub.hidden = false;
    var ctas = $('receiver-ctas'); if (ctas) ctas.hidden = false;

    if (t.kind === 'regex') {
      addField(host, 'Pattern', 'pattern', t.pattern || '', onEdit);
      addField(host, 'Flags', 'flags', t.flags || '', onEdit);
      addField(host, 'Test string', 'test', t.test || '', onEdit, true);
    } else if (t.kind === 'cron') {
      addField(host, 'Expression', 'expr', t.expr || '', onEdit);
      // Sender TZ shown by default; receiver can switch to their own TZ.
      addTzToggle(host, t.tz, state.sender_tz);
    } else if (t.kind === 'color') {
      addField(host, 'Color', 'value', t.value || '', onEdit);
    } else if (t.kind === 'unixtime') {
      addField(host, 'Epoch', 'epoch', String(t.epoch), onEdit);
      addSelect(host, 'Unit', 'unit', ['s', 'ms'], t.unit || 's', onEdit);
    }
  }

  var TOOL_LABEL = { regex: 'Regex (JavaScript flavour)', cron: 'Cron schedule', color: 'Color', unixtime: 'Unix time' };

  function addField(host, label, key, value, onChange, multiline) {
    var wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field-label', label));
    var input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    input.value = value;
    input.setAttribute('data-key', key);
    input.addEventListener('input', function () { onChange(key, input.value); });
    wrap.appendChild(input);
    host.appendChild(wrap);
  }
  function addSelect(host, label, key, options, value, onChange) {
    var wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field-label', label));
    var sel = document.createElement('select');
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o; opt.appendChild(document.createTextNode(o));
      if (o === value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { onChange(key, sel.value); });
    wrap.appendChild(sel);
    host.appendChild(wrap);
  }

  // Cron TZ toggle: default = sender TZ (the tz baked into the link); receiver
  // can switch to their own browser TZ. Switching only changes evaluation, never
  // the link. (Acceptance: "cron共有が送り手TZ既定表示＋受け手TZ切替で動く".)
  var tzOverride = null;
  function addTzToggle(host, senderTz, docSenderTz) {
    tzOverride = null;
    var receiverTz = '';
    try { receiverTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var wrap = el('div', 'field tz-toggle');
    wrap.appendChild(el('span', 'field-label', 'Time zone'));
    var sel = document.createElement('select');
    var opts = [];
    opts.push({ v: '', label: 'Sender (' + (senderTz || docSenderTz || 'UTC') + ')' });
    if (receiverTz && receiverTz !== senderTz) opts.push({ v: receiverTz, label: 'My time zone (' + receiverTz + ')' });
    opts.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v; opt.appendChild(document.createTextNode(o.label));
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      tzOverride = sel.value || null;
      rerun();
    });
    wrap.appendChild(sel);
    host.appendChild(wrap);
  }

  // Coerce edited field values into the typed shape the schema expects, then
  // re-run. We do NOT re-encode or re-validate here (that is the core's job on
  // evaluate); unixtime.epoch must be a number for the evaluator.
  function onEdit(key, value) {
    if (!current) return;
    if (key === 'epoch') {
      var n = Number(value);
      current.tool.epoch = Number.isFinite(n) ? Math.trunc(n) : value; // invalid -> evaluator reports it
    } else {
      current.tool[key] = value;
    }
    rerun();
  }

  // ========================================================================
  // Run + render
  // ========================================================================
  function rerun() {
    if (!current) return;
    var opts = baseOpts(tzOverride ? { tz: tzOverride } : null);
    // Only the regex path needs the tight watchdog; give the others generous
    // headroom (they are bounded and cannot backtrack).
    var deadline = current.tool.kind === 'regex' ? WATCHDOG_MS : 5000;
    ask('evaluate', { state: current, opts: opts }, deadline).then(function (res) {
      render(res);
    });
  }

  function render(res) {
    var box = $('result');
    clear(box);
    if (!res || !res.ok) {
      var e = el('div', 'error');
      e.appendChild(el('p', 'error-msg', errorText(res && res.error)));
      box.appendChild(e);
      return;
    }
    var r = res.result;
    if (res.kind === 'regex') renderRegex(box, r);
    else if (res.kind === 'cron') renderCron(box, r);
    else if (res.kind === 'color') renderColor(box, r);
    else if (res.kind === 'unixtime') renderUnixtime(box, r);
  }

  function renderRegex(box, r) {
    box.appendChild(row('Flavour', r.flavour));
    if (!r.valid) { box.appendChild(el('p', 'invalid', r.error || 'invalid pattern')); return; }
    box.appendChild(row('Matches', String(r.matchCount)));
    var list = el('div', 'matches');
    (r.matches || []).forEach(function (m, i) {
      var line = el('div', 'match');
      line.appendChild(el('span', 'mi', '#' + (i + 1)));
      line.appendChild(el('span', 'mr', 'index ' + m.index + ', length ' + m.length));
      if (m.groups && m.groups.length) {
        var gtxt = m.groups.map(function (g, gi) {
          if (g === null) return 'g' + (gi + 1) + ': —';
          return 'g' + (gi + 1) + (g.name ? ' (' + g.name + ')' : '') + ': index ' + g.index + ', length ' + g.length;
        }).join('  ');
        line.appendChild(el('span', 'mg', gtxt));
      }
      list.appendChild(line);
    });
    box.appendChild(list);
  }

  function renderCron(box, r) {
    if (!r.valid) { box.appendChild(el('p', 'invalid', r.error || 'invalid expression')); return; }
    box.appendChild(row('Schedule', r.description));
    box.appendChild(row('Time zone', r.tz));
    var list = el('div', 'runs');
    (r.nextRuns || []).forEach(function (run) {
      var lw = run.local;
      var s = WEEKDAY[lw.weekday] + ' ' + lw.year + '-' + pad(lw.month) + '-' + pad(lw.day) + ' ' + pad(lw.hour) + ':' + pad(lw.minute);
      if (run.dst) s += '  (' + run.dst + ')';
      list.appendChild(el('div', 'run', s));
    });
    box.appendChild(list);
  }

  function renderColor(box, r) {
    if (!r.valid) { box.appendChild(el('p', 'invalid', r.error || 'unrecognised color')); return; }
    var sw = el('div', 'swatch');
    // Inline style is a STATIC numeric rgba from validated 0..255 ints — not
    // markup, not script. Setting style properties (not innerHTML) is safe and
    // allowed by CSP style-src 'self' 'unsafe-inline' is NOT used; we set the
    // CSSOM property directly, which CSP does not gate.
    sw.style.backgroundColor = 'rgb(' + r.rgb.r + ',' + r.rgb.g + ',' + r.rgb.b + ')';
    box.appendChild(sw);
    box.appendChild(row('RGB', r.rgb.r + ', ' + r.rgb.g + ', ' + r.rgb.b));
    box.appendChild(row('HSL', r.hsl.h + '°, ' + (r.hsl.sPermille / 10) + '%, ' + (r.hsl.lPermille / 10) + '%'));
    box.appendChild(row('Alpha', (r.alphaPermille / 1000).toString()));
    box.appendChild(row('Detected format', r.format));
  }

  function renderUnixtime(box, r) {
    if (!r.valid) { box.appendChild(el('p', 'invalid', r.error || 'invalid epoch')); return; }
    var u = r.utc;
    box.appendChild(row('Unit', r.unit + (r.detected ? ' (detected)' : '')));
    box.appendChild(row('Epoch (s)', String(r.epochSeconds)));
    box.appendChild(row('Epoch (ms)', String(r.epochMillis)));
    var iso = u.year + '-' + pad(u.month) + '-' + pad(u.day) + 'T' + pad(u.hour) + ':' + pad(u.minute) + ':' + pad(u.second) + 'Z';
    box.appendChild(row('UTC', iso));
    box.appendChild(row('Weekday', WEEKDAY[u.weekday]));
    box.appendChild(row('Day of year', String(u.dayOfYear)));
  }

  var WEEKDAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // ========================================================================
  // CTAs: Open in Sharebar (with graceful fallback) + Get the app.
  // ========================================================================
  function wireCTAs(fragment) {
    var open = $('cta-open');
    // In receiver mode the visible "Get the app" button is #cta-getapp-receiver;
    // the bare #cta-getapp lives in the HIDDEN #landing section, so we must NOT
    // touch it here (getElementById would otherwise hand back that hidden one,
    // and a bare '#get' href on it scrolls/links nowhere reachable — #90). The
    // receiver button already carries a real, reachable href (index.html#get);
    // leave it intact.
    if (!open) return;

    // sharebar:// carries the SAME fragment (the receive state), not the edits.
    var deepLink = 'sharebar://open' + fragment;
    open.addEventListener('click', function (ev) {
      ev.preventDefault();
      openInApp(deepLink);
    });
  }

  // Try the custom-scheme deep link; if nothing handles it (app not installed),
  // fall back to "Get the app" gracefully. We detect non-handling via the page
  // staying visible after a short grace period (a successful handoff blurs/hides
  // the page). No navigation to an external URL happens here — only the local
  // anchor. (F-018: graceful fallback to Get the app when app not installed.)
  function openInApp(deepLink) {
    var fellBack = false;
    var t = setTimeout(function () {
      if (fellBack) return;
      // Still here -> app didn't take over. Reveal Get-the-app guidance.
      var hint = $('open-hint');
      if (hint) hint.hidden = false;
      location.hash && null;
      gotoGetApp();
    }, 1200);
    function cancel() { fellBack = true; clearTimeout(t); }
    window.addEventListener('blur', cancel, { once: true });
    window.addEventListener('pagehide', cancel, { once: true });
    // Trigger the scheme. Assigning location triggers the OS handler without a
    // navigation if a handler exists.
    try { window.location.href = deepLink; } catch (e) { cancel(); gotoGetApp(); }
  }
  function gotoGetApp() {
    // Graceful fallback (F-018): draw attention to the VISIBLE "Get the app"
    // CTA. In receiver mode that is #cta-getapp-receiver (the bare #cta-getapp is
    // in the hidden #landing section); on a decode error it is #cta-getapp-error.
    // Never fall back to the hidden landing element or to setting location.hash
    // = 'get' (which would re-boot the page on '#get' → decode error — #90).
    var get = $('cta-getapp-receiver') || $('cta-getapp-error');
    if (get && typeof get.scrollIntoView === 'function') { get.scrollIntoView({ behavior: 'smooth' }); return; }
    // Last resort: navigate to the real, reachable Get-the-app section.
    location.href = 'index.html#get';
  }

  // Re-decode if the hash changes (e.g. user pastes a new link). Edits never
  // change the hash, so this only fires for genuinely new links.
  window.addEventListener('hashchange', boot);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
