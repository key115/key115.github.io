(function () {
  "use strict";

  // App Store CTA — site-deploy-convention 規約3（1箇所差込で全 data-appstore を活性化）。
  //
  // 空文字 = 未公開。この状態では data-appstore の <a> は href を持たず hidden のままで、
  // 代わりに [data-appstore-pending] の「近日公開」表示が出る（死リンクを一度も出さない）。
  // 差込は規約7 に従い、iTunes Lookup で resultCount>=1 を実測してから — ここに実URLを
  // 入れて再デプロイすれば全ページの CTA が同時に活性化する。
  var APP_STORE_URL = "";

  var root = document.documentElement;
  root.classList.add("js");

  var storageKey = "pastebell-site-language";
  var initial = "ja";
  try {
    var saved = localStorage.getItem(storageKey);
    initial = saved || (navigator.language.toLowerCase().indexOf("ja") === 0 ? "ja" : "en");
  } catch (error) {
    initial = navigator.language.toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }

  function setLanguage(language) {
    var next = language === "en" ? "en" : "ja";
    root.setAttribute("lang", next);
    root.setAttribute("data-lang", next);
    try { localStorage.setItem(storageKey, next); } catch (error) {}

    document.querySelectorAll("[data-set-lang]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-set-lang") === next));
    });
  }

  setLanguage(initial);

  document.addEventListener("DOMContentLoaded", function () {
    if (APP_STORE_URL) {
      document.querySelectorAll("a[data-appstore]").forEach(function (link) {
        link.href = APP_STORE_URL;
        link.removeAttribute("hidden");
      });
      document.querySelectorAll("[data-appstore-wrap]").forEach(function (item) {
        item.removeAttribute("hidden");
      });
      document.querySelectorAll("[data-appstore-pending]").forEach(function (item) {
        item.setAttribute("hidden", "");
      });
    }

    document.querySelectorAll("[data-set-lang]").forEach(function (button) {
      button.addEventListener("click", function () {
        setLanguage(button.getAttribute("data-set-lang"));
      });
    });
    setLanguage(root.getAttribute("data-lang"));

    var revealItems = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

    revealItems.forEach(function (item) { observer.observe(item); });
  });
})();
