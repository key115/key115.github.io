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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activate);
  } else {
    activate();
  }
})();
