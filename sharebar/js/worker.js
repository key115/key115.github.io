// worker.js — the Share Page evaluation Web Worker (F-027 watchdog host).
//
// SPDX-License-Identifier: MIT
//
// All decode + tool evaluation runs HERE, off the main thread, so a catastrophic
// regex (ReDoS) can be killed by terminating the worker WITHOUT freezing the UI
// — the watchdog lives on the main thread (app.js): it starts a 200 ms timer
// before posting an 'evaluate' job and, if no reply arrives, terminates and
// respawns this worker, reporting "pattern is too complex" (F-027). A regex
// engine in catastrophic backtracking cannot be interrupted from inside its own
// event loop, so worker termination is the only reliable cutoff.
//
// This worker holds NO tool logic of its own. It loads the ONE shipped bundle
// and the shared reproduce glue, then just dispatches messages. It posts back
// PLAIN structured data; the main thread renders it as text nodes (never
// innerHTML — F-018). The worker never touches the DOM (it can't) and never
// evals.

'use strict';

// Order matters: the bundle defines self.SharebarCore, then the glue reads it.
// Same-origin 'self' scripts only (the page CSP restricts worker-src/script-src
// to 'self'); no remote importScripts, so no external request.
importScripts('../vendor/sharebar-core.js', 'reproduce.js');

var Repro = self.SharebarReproduce;

self.onmessage = function (ev) {
  var msg = ev.data || {};
  var id = msg.id;

  try {
    if (msg.type === 'decode') {
      // Initial decode of location.hash. Returns the validated state (or a
      // graceful structured error) so the main thread can build the editor UI.
      var d = Repro.decode(msg.fragment);
      self.postMessage({ id: id, type: 'decoded', ok: d.ok, state: d.state, error: d.error });
      return;
    }

    if (msg.type === 'evaluate') {
      // Re-run after a receiver edit. `state` is the (edited) decoded state;
      // opts injects baseEpochMs (main thread's Date.now()) + optional tz toggle
      // (N-011 — the core reads no host clock/tz). The regex case is what the
      // 200 ms watchdog guards: if this never replies, the main thread kills us.
      var ev2 = Repro.evaluate(msg.state, msg.opts || {});
      self.postMessage({ id: id, type: 'evaluated', ok: ev2.ok, kind: ev2.kind, result: ev2.result, error: ev2.error });
      return;
    }

    self.postMessage({ id: id, type: 'error', ok: false, error: { code: 'BAD_MESSAGE', message: 'unknown message type' } });
  } catch (e) {
    // Fail closed: never let an exception escape as an unhandled worker error.
    self.postMessage({ id: id, type: 'error', ok: false, error: { code: 'WORKER_ERROR', message: 'evaluation failed' } });
  }
};

// Signal readiness so the main thread knows importScripts succeeded.
self.postMessage({ type: 'ready' });
