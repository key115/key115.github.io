(function () {
  "use strict";

  // ------------------------------------------------------------------
  // App Store CTA — site-deploy-convention.md 規約3 の標準形（1箇所差込）。
  //
  // 下の 1 行に実 URL を入れるだけで、全ページの a[data-appstore] が同時に活性化する。
  //
  //   空文字        … ストア未公開。HTML 側の CTA は最初から href を持たず
  //                    class="... is-pending" が付いているので、**JS が無効でも**
  //                    押せない・リンクしない・非活性の見た目になる。
  //   実 URL を代入 … 下の activate() が href を張り、is-pending を外して活性化する。
  //
  // 差し込みの時期は規約7。iTunes Lookup（resultCount >= 1）でストア公開を実測した
  // **同一セッション内**で、差込 → cp → push → 公開URL実測 まで完走する
  // （「あとで差し込む」をタスクとして残さない — Sharebar の9日間放置の再発防止）。
  //
  // 入れる形: https://apps.apple.com/jp/app/<slug>/id<Apple ID>
  // ------------------------------------------------------------------
  var APP_STORE_URL = "";

  function activate() {
    var links = document.querySelectorAll("a[data-appstore]");
    var i;

    if (!APP_STORE_URL) {
      // 未公開。マークアップ側で既に非活性なので何も足さない（JS の有無で状態を変えない）。
      // CSS の pointer-events で押下は止まっているが、念のため既定動作も潰しておく。
      for (i = 0; i < links.length; i += 1) {
        links[i].addEventListener("click", function (event) { event.preventDefault(); });
      }
      return;
    }

    for (i = 0; i < links.length; i += 1) {
      links[i].setAttribute("href", APP_STORE_URL);
      links[i].setAttribute("rel", "noopener");
      links[i].removeAttribute("aria-disabled");
      links[i].classList.remove("is-pending");
    }
  }

  // ------------------------------------------------------------------
  // スクロール発火の登場演出。
  //
  // .reveal が視界に入ったら .is-in を足すだけ。プログレッシブ強化として次の順で降りる:
  //   - reduced-motion 指定       … 起動しない（CSS 側の @media でも全停止）
  //   - IntersectionObserver 不在 … 起動しない
  //   - JS 無効                   … この関数ごと動かない
  // どの場合も <html> に .js-reveal が付かないので、要素は最初から完成形で見える。
  // 本文の生成・書き換えは一切しない（classList の付け外しだけ）。
  // ------------------------------------------------------------------
  function reveal() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      return;
    }

    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) {
      return;
    }

    document.documentElement.classList.add("js-reveal");

    var observer = new IntersectionObserver(function (entries) {
      var i;
      for (i = 0; i < entries.length; i += 1) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-in");
          observer.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    var i;
    for (i = 0; i < targets.length; i += 1) {
      observer.observe(targets[i]);
    }
  }

  function boot() {
    activate();
    reveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
