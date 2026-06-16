// reproduce.js — the Share Page decode→reproduce GLUE (no logic fork).
//
// SPDX-License-Identifier: MIT
//
// This module owns ZERO tool/codec logic. Every decode, every receive guard,
// every tool evaluation is delegated to the ONE shipped bundle
// (dist/sharebar-core.js → global `SharebarCore`). Per ADR-0001 the macOS app
// (JavaScriptCore) and this Share Page (browser) run that IDENTICAL bundle, so
// the reproduced structured value here is byte/structurally identical to the
// app's — by construction, not by a parallel implementation.
//
// What this file DOES do:
//   * pick the right `SharebarCore.tools.<kind>.evaluate(...)` for a decoded
//     state, ARGUMENT-INJECTING the things the core refuses to read itself
//     (cron's base instant + receiver tz — N-011: the core never reads a host
//     clock or host tz),
//   * normalise the codec/schema LinkError into a small, render-safe shape.
//
// It returns PLAIN DATA only (numbers, enums, ranges, epochs). The caller
// renders it via text nodes (innerHTML is banned on the page — F-018). Nothing
// here touches the DOM, evals, or compiles a regex; the regex compile happens
// inside SharebarCore, which the worker runs under a 200 ms watchdog (F-027).
//
// Loadable two ways with the SAME source (so the node parity test exercises the
// exact path the worker uses):
//   * Web Worker: `importScripts('sharebar-core.js')` defines globalThis.
//     SharebarCore, then `importScripts('reproduce.js')` defines
//     globalThis.SharebarReproduce.
//   * Node test:  the test injects the bundle's SharebarCore as a global, then
//     requires this file; module.exports is used.

'use strict';

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  // Always expose a global too, so the Web Worker (no module system) can use it.
  if (typeof root !== 'undefined') {
    root.SharebarReproduce = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Resolve the single core. In the worker / node it is a global the host set up
  // BEFORE loading this file (importScripts order / test global injection).
  function core() {
    var C = typeof globalThis !== 'undefined' ? globalThis.SharebarCore : undefined;
    if (!C || typeof C.decodeFragment !== 'function') {
      throw new Error('SharebarCore bundle not loaded before reproduce.js');
    }
    return C;
  }

  // How many cron runs the page shows. The core caps at 50 regardless.
  var CRON_RUN_COUNT = 5;

  // Decode a fragment (string with or without '#', or a full URL) into a
  // validated v1 state. Receive guards (F-026: 16KB encoded / 1MB inflate /
  // strict schema / unknown-version) all live in the core; we only translate the
  // structured LinkError into a flat, render-safe object. Fail CLOSED: any throw
  // becomes { ok:false, error } — never propagates to the user as a raw crash.
  function decode(fragment) {
    var C = core();
    try {
      var state = C.decodeFragment(fragment);
      return { ok: true, state: state };
    } catch (e) {
      return { ok: false, error: normaliseError(e, C) };
    }
  }

  // Evaluate a (possibly receiver-edited) state with the SAME core the app uses.
  // `opts` injects the values the core will not read itself:
  //   opts.baseEpochMs  — cron base instant (defaults to "now"; the page passes
  //                       Date.now(), the test passes a fixed instant). N-011.
  //   opts.tz           — receiver-chosen tz override for cron (the tz toggle).
  //                       When absent, cron uses state.tool.tz (sender tz).
  // Returns { ok:true, kind, result } where `result` is the core's structured
  // value, or { ok:false, error } if the state is structurally unusable.
  function evaluate(state, opts) {
    var C = core();
    opts = opts || {};
    if (!state || typeof state !== 'object' || !state.tool || typeof state.tool.kind !== 'string') {
      return { ok: false, error: { code: 'BAD_STATE', message: 'no tool to reproduce' } };
    }
    var kind = state.tool.kind;
    var tools = C.tools || {};
    try {
      switch (kind) {
        case 'regex':
          return { ok: true, kind: kind, result: tools.regex.evaluate({
            pattern: state.tool.pattern,
            flags: state.tool.flags,
            test: state.tool.test,
          }) };
        case 'cron': {
          var baseEpochMs = typeof opts.baseEpochMs === 'number' ? opts.baseEpochMs : Date.now();
          var tz = typeof opts.tz === 'string' && opts.tz ? opts.tz : state.tool.tz;
          return { ok: true, kind: kind, result: tools.cron.evaluate({
            expr: state.tool.expr,
            tz: tz,
            baseEpochMs: baseEpochMs,
            count: typeof opts.count === 'number' ? opts.count : CRON_RUN_COUNT,
          }) };
        }
        case 'color':
          return { ok: true, kind: kind, result: tools.color.evaluate({ value: state.tool.value }) };
        case 'unixtime':
          return { ok: true, kind: kind, result: tools.unixtime.evaluate({
            epoch: state.tool.epoch,
            unit: state.tool.unit,
          }) };
        default:
          return { ok: false, error: { code: 'UNKNOWN_TOOL', message: 'unsupported tool: ' + kind } };
      }
    } catch (e) {
      // Tool evaluators are written to return { valid:false } rather than throw;
      // a throw here is unexpected, but we still fail closed and never surface a
      // raw stack to the receiver.
      return { ok: false, error: { code: 'EVAL_FAILED', message: 'could not reproduce this tool' } };
    }
  }

  // One-shot: decode then evaluate. Used by the worker for the initial render of
  // location.hash. Re-runs (after the receiver edits a field) call evaluate()
  // directly on the already-decoded state, so a tweak never re-parses the link.
  function reproduceFromFragment(fragment, opts) {
    var d = decode(fragment);
    if (!d.ok) return d;
    var ev = evaluate(d.state, opts);
    if (!ev.ok) return ev;
    return { ok: true, state: d.state, kind: ev.kind, result: ev.result };
  }

  // Flatten a codec LinkError (or any throwable) into a small, fixed,
  // render-safe object. We surface the machine `code` (stable across runtimes)
  // and a human message; the page maps the code to a friendly sentence so the
  // exact wording stays in the presentation layer.
  function normaliseError(e, C) {
    var LinkError = C && C.LinkError;
    if (LinkError && e instanceof LinkError) {
      return { code: e.code || 'LINK_ERROR', message: String(e.message || 'invalid link') };
    }
    // Defensive: anything else (should not happen — the core only throws
    // LinkError on decode) is reported generically, never as a raw stack.
    return { code: 'LINK_ERROR', message: 'this link could not be read' };
  }

  return {
    decode: decode,
    evaluate: evaluate,
    reproduceFromFragment: reproduceFromFragment,
    CRON_RUN_COUNT: CRON_RUN_COUNT,
  };
});
