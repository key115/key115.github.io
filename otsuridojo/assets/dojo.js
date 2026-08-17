/* おつり道場 LP — ミニ道場（腕試し）とスクロール演出（PRJ-034）
 *
 * 依存ゼロ・外部リクエストゼロ。アプリと同じ作法:
 *   - 桁数がそろった瞬間に自動判定（Enter なし）
 *   - 正解 = 朱の○ / 誤答 = 墨の× と正解表示
 *   - 三本（3問正解）で「入門を認む」の免状
 * 出題はアプリの生成規則 v2 から採った実例の固定セット（検算済み）。
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- スクロール出現（.reveal / .ladder / .maku） ---------- */

  var observed = document.querySelectorAll(".reveal, .ladder, .maku");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    observed.forEach(function (el) { io.observe(el); });
  } else {
    observed.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 認定証チルト（ポインタ環境のみ） ---------- */

  var tilt = document.querySelector(".cert-tilt");
  if (tilt && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var img = tilt.querySelector("img");
    tilt.addEventListener("pointermove", function (ev) {
      var r = tilt.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      img.style.transform = "rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 8) + "deg)";
    });
    tilt.addEventListener("pointerleave", function () { img.style.transform = ""; });
  }

  /* ---------- ミニ道場 ---------- */

  var root = document.getElementById("mini-dojo");
  if (!root) return;

  // (価格, 支払い, おつり, おつりの内訳) — すべて手検算＋機械検算済みの固定問題。
  var QUIZ = [
    { price: 847,  paid: 1352, ans: 505, coins: "500円玉と5円玉、2枚" },
    { price: 298,  paid: 303,  ans: 5,   coins: "5円玉、1枚" },
    { price: 762,  paid: 1012, ans: 250, coins: "100円玉2枚と50円玉" },
    { price: 1980, paid: 2480, ans: 500, coins: "500円玉、1枚" },
    { price: 429,  paid: 1029, ans: 600, coins: "500円玉と100円玉" },
    { price: 1166, paid: 1216, ans: 50,  coins: "50円玉、1枚" },
    { price: 543,  paid: 1043, ans: 500, coins: "500円玉、1枚" },
    { price: 87,   paid: 102,  ans: 15,  coins: "10円玉と5円玉" },
    { price: 3608, paid: 4008, ans: 400, coins: "100円玉、4枚" },
    { price: 675,  paid: 1225, ans: 550, coins: "500円玉と50円玉" }
  ];

  var elPrice = root.querySelector("[data-price]");
  var elPaid = root.querySelector("[data-paid]");
  var elCells = root.querySelector(".dojo-cells");
  var elPad = root.querySelector(".dojo-pad");
  var elMark = root.querySelector(".dojo-mark");
  var elMarkNote = root.querySelector(".mark-note");
  var elPass = root.querySelector(".dojo-pass");
  var tallies = root.querySelectorAll(".tally");
  var svgO = root.querySelector(".svg-maru");
  var svgX = root.querySelector(".svg-batsu");
  var live = root.querySelector(".dojo-live");

  var order = [], idx = 0, wins = 0, input = "", answer = "", busy = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function fmt(n) { return n.toLocaleString("ja-JP"); }

  function renderCells() {
    var cells = elCells.querySelectorAll(".cell");
    cells.forEach(function (c, i) {
      c.textContent = input[i] || "";
      c.classList.toggle("filled", i < input.length);
    });
  }

  function nextQuestion() {
    var q = order[idx % order.length];
    answer = String(q.ans);
    input = "";
    elPrice.textContent = fmt(q.price);
    elPaid.textContent = fmt(q.paid);
    elCells.replaceChildren();
    for (var i = 0; i < answer.length; i++) {
      var d = document.createElement("span");
      d.className = "cell";
      elCells.appendChild(d);
    }
    renderCells();
    busy = false;
    if (live) live.textContent = fmt(q.price) + "円の買い物に" + fmt(q.paid) + "円出した。おつりは？（" + answer.length + "桁）";
  }

  function judge() {
    busy = true;
    var q = order[idx % order.length];
    var correct = input === answer;
    svgO.style.display = correct ? "" : "none";
    svgX.style.display = correct ? "none" : "";
    /* 固定データのみだが、作法として DOM 構築で組む（innerHTML 不使用） */
    elMarkNote.replaceChildren();
    elMarkNote.append(correct ? "おつり " + fmt(q.ans) + "円" : "正解は " + fmt(q.ans) + "円");
    elMarkNote.append(document.createElement("br"));
    var small = document.createElement("small");
    small.textContent = correct
      ? q.coins + "で返ってきます"
      : fmt(q.paid) + "−" + fmt(q.price) + "。もう一本！";
    elMarkNote.append(small);
    elMark.classList.remove("show");
    void elMark.offsetWidth; /* アニメ再始動 */
    elMark.classList.add("show");
    if (live) live.textContent = (correct ? "正解。" : "残念。正解は " + fmt(q.ans) + "円。");

    if (correct) {
      wins++;
      if (tallies[wins - 1]) tallies[wins - 1].classList.add("won");
    }
    idx++;

    setTimeout(function () {
      elMark.classList.remove("show");
      if (wins >= 3) {
        elPass.classList.add("show");
        if (live) live.textContent = "三本先取。腕試し合格。";
      } else {
        nextQuestion();
      }
    }, correct ? 900 : 1700);
  }

  function press(key) {
    if (busy || elPass.classList.contains("show")) return;
    if (key === "del") {
      input = input.slice(0, -1);
    } else if (key === "clear") {
      input = "";
    } else if (/^[0-9]$/.test(key)) {
      if (input.length >= answer.length) return;
      if (input === "" && key === "0" && answer.length > 1) return; /* 先頭0はアプリ同様に無効 */
      input += key;
    }
    renderCells();
    if (input.length === answer.length) judge(); /* 桁がそろったら自動判定（アプリと同じ） */
  }

  elPad.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-key]");
    if (b) press(b.getAttribute("data-key"));
  });

  /* 物理キーボードでも遊べるように（ウィジェットが見えている間だけ） */
  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    if (/^[0-9]$/.test(ev.key)) { press(ev.key); ev.preventDefault(); }
    else if (ev.key === "Backspace") { press("del"); ev.preventDefault(); }
  });

  root.querySelector(".dojo-reset").addEventListener("click", function () {
    wins = 0; idx = 0;
    tallies.forEach(function (t) { t.classList.remove("won"); });
    elPass.classList.remove("show");
    order = shuffle(QUIZ.slice());
    nextQuestion();
  });

  order = shuffle(QUIZ.slice());
  nextQuestion();
})();
