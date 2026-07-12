(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var storageKey = "reska-site-language";
  var initial = "en";
  try {
    var saved = localStorage.getItem(storageKey);
    initial = saved || (navigator.language.toLowerCase().indexOf("ja") === 0 ? "ja" : "en");
  } catch (error) {
    initial = navigator.language.toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }

  function setLanguage(language) {
    var next = language === "ja" ? "ja" : "en";
    root.setAttribute("lang", next);
    root.setAttribute("data-lang", next);
    try { localStorage.setItem(storageKey, next); } catch (error) {}

    document.querySelectorAll("[data-set-lang]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-set-lang") === next));
    });
  }

  setLanguage(initial);

  document.addEventListener("DOMContentLoaded", function () {
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
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach(function (item) { observer.observe(item); });
  });
})();
