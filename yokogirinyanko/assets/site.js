(function () {
  "use strict";

  // ------------------------------------------------------------------
  // App Store CTA — site-deploy-convention 規約3 の標準形。
  //
  // ここ 1 箇所に実 URL を入れるだけで、全ページの a[data-appstore] が同時に活性化する。
  //
  //   空文字        … ストア未公開。HTML 側の CTA は最初から href を持たず
  //                    class="... is-pending" が付いているので、**JS が無効でも**
  //                    押せない・リンクしない・非活性の見た目になる。
  //   実 URL を代入 … 下の activate() が href を張り、is-pending を外して活性化する。
  //
  // 差し込みの時期は規約7 に従う。iTunes Lookup（resultCount >= 1）でストア公開を
  // 実測した**同一セッション内**で、ここに URL を入れて cp → push → 公開URL実測まで
  // 完了させる（「あとで差し込む」を残さない）。
  //
  // 入れる形: https://apps.apple.com/jp/app/<slug>/id<Apple ID>
  // ------------------------------------------------------------------
  var APP_STORE_URL = "";

  function activate() {
    var links = document.querySelectorAll("a[data-appstore]");
    var i;

    if (!APP_STORE_URL) {
      // 未公開。マークアップ側で既に非活性なので何も足さない（JS 有無で状態を変えない）。
      // pointer-events まで含めて CSS で止めているが、念のため押下も無効化しておく。
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
  // スクロール発火の登場演出（v2）。
  //
  // 下層セクション（.reveal / .reveal-brush）は、視界に入った時点で .is-in が付いて
  // 登場アニメーションが走る。プログレッシブ強化として次の順で降りる:
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

    var targets = document.querySelectorAll(".reveal, .reveal-brush");
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
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });

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
