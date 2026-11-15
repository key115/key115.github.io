(() => {
  "use strict";
  // Public App Store URL is enabled after iTunes Lookup confirms this app is live.
  const APP_STORE_URL = "";
  if (!/^https:\/\/apps\.apple\.com\/jp\/app\/id6834989273$/.test(APP_STORE_URL)) return;
  document.querySelectorAll("a[data-appstore]").forEach((link) => {
    link.href = APP_STORE_URL;
    link.classList.remove("is-pending");
    link.removeAttribute("aria-disabled");
    link.querySelector("[data-cta-text]").textContent = link.dataset.appstoreLabel;
  });
  document.querySelectorAll(".release-note").forEach((note) => {
    note.textContent = "iPhone向け・無料 / App Storeで配信中";
  });
})();
