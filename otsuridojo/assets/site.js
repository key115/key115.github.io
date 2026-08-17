/* おつり道場 公開サイト（PRJ-034）
 *
 * やることは App Store CTA の活性化だけ。依存ゼロ・外部リクエストゼロ。
 *
 * 使い方（LP 側のマークアップ規約）:
 *   <a class="button" data-appstore href="#" data-appstore-label="App Store でダウンロード">
 *     <span data-cta-text>近日公開</span>
 *   </a>
 *
 *   - `data-appstore`       … 活性化の対象。href="#" のまま置いておく
 *   - `data-cta-text`       … 活性化後に差し替わる文言の入れ物（中身は「近日公開」）
 *   - `data-appstore-label` … 差し替え後の文言。省略時は「App Store でダウンロード」
 *   - `data-appstore-wrap`  … 公開後にだけ見せたい行（価格注記など）に付けて hidden にしておく
 */
(function () {
  "use strict";

  // App Store CTA の唯一の差込口（site-deploy-convention 規約3 の bigleaf 方式）。
  //
  // 空文字のあいだは全 CTA が「近日公開」の押せない札として出る。ストア公開を
  // iTunes Lookup（resultCount>=1）で実測したら、**ここ1箇所だけ**に実URLを入れて
  // 同一セッション内でデプロイまで完了させる（規約7・Sharebar の9日間放置の再発防止）。
  // 入れる形は https://apps.apple.com/jp/app/id<AppleID> — 契約テストが形を強制する。
  var APP_STORE_URL = "";

  var PENDING_LABEL = "近日公開";
  var DEFAULT_LABEL = "App Store でダウンロード";

  document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll("a[data-appstore]");

    if (!APP_STORE_URL) {
      // 未公開: 死リンクを踏ませない。文言は HTML 側が既に「近日公開」。
      links.forEach(function (link) {
        link.classList.add("is-pending");
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", function (event) {
          if (link.getAttribute("href") === "#") event.preventDefault();
        });
      });
      return;
    }

    links.forEach(function (link) {
      link.href = APP_STORE_URL;
      link.rel = "noopener";
      link.classList.remove("is-pending");
      link.removeAttribute("aria-disabled");

      var label = link.querySelector("[data-cta-text]");
      if (label && label.textContent.trim() === PENDING_LABEL) {
        label.textContent = link.getAttribute("data-appstore-label") || DEFAULT_LABEL;
      }
    });

    document.querySelectorAll("[data-appstore-wrap]").forEach(function (wrap) {
      wrap.removeAttribute("hidden");
    });
  });
})();
