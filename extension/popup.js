(() => {
  "use strict";

  if (typeof chrome === "undefined" || !chrome.i18n) {
    return;
  }

  if (typeof chrome.i18n.getUILanguage === "function") {
    const uiLang = chrome.i18n.getUILanguage();
    if (uiLang) {
      document.documentElement.lang = uiLang;
    }
  }

  if (typeof chrome.i18n.getMessage === "function") {
    const elements = document.querySelectorAll("[data-i18n]");
    for (let i = 0; i < elements.length; i += 1) {
      const el = elements[i];
      const key = el.getAttribute("data-i18n");
      if (!key) {
        continue;
      }
      const message = chrome.i18n.getMessage(key);
      if (message) {
        el.textContent = message;
      }
    }
  }
})();
