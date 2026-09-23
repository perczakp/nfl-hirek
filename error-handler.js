/* Shared global error handler - a safety net for uncaught errors and unhandled promise rejections. */
(function () {
  "use strict";

  var IGNORED_MESSAGES = [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications"
  ];

  var banner = null;
  var countEl = null;
  var errorCount = 0;

  function isIgnored(message) {
    if (!message) return false;
    for (var i = 0; i < IGNORED_MESSAGES.length; i++) {
      if (String(message).indexOf(IGNORED_MESSAGES[i]) !== -1) return true;
    }
    return false;
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".nfln-errbar{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#c0392b;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:13.5px;line-height:1.4;box-shadow:0 -2px 10px rgba(0,0,0,.25);padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:10px;flex-wrap:wrap;}" +
      ".nfln-errbar .nfln-errmsg{flex:1;min-width:180px}.nfln-errbar .nfln-errcount{opacity:.85;font-size:12px;white-space:nowrap}.nfln-errbar button{border:0;border-radius:6px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}.nfln-errbar .nfln-err-reload{background:#fff;color:#c0392b}.nfln-errbar .nfln-err-dismiss{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6)}";
    document.head.appendChild(style);
  }

  function appendToBody(el) {
    if (document.body) document.body.appendChild(el);
    else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(el); });
  }

  function ensureBanner() {
    if (banner) return banner;
    injectStyles();

    banner = document.createElement("div");
    banner.className = "nfln-errbar";
    banner.setAttribute("role", "alert");

    var msg = document.createElement("span");
    msg.className = "nfln-errmsg";
    msg.textContent = "Váratlan hiba történt az oldalon. Próbáld újratölteni.";

    countEl = document.createElement("span");
    countEl.className = "nfln-errcount";

    var reloadBtn = document.createElement("button");
    reloadBtn.className = "nfln-err-reload";
    reloadBtn.type = "button";
    reloadBtn.textContent = "Újratöltés";
    reloadBtn.addEventListener("click", function () { window.location.reload(); });

    var dismissBtn = document.createElement("button");
    dismissBtn.className = "nfln-err-dismiss";
    dismissBtn.type = "button";
    dismissBtn.textContent = "Bezár";
    dismissBtn.addEventListener("click", function () {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = null;
      countEl = null;
      errorCount = 0;
    });

    banner.appendChild(msg);
    banner.appendChild(countEl);
    banner.appendChild(reloadBtn);
    banner.appendChild(dismissBtn);
    appendToBody(banner);
    return banner;
  }

  function reportError(source, detail, message) {
    if (isIgnored(message)) return;
    errorCount++;
    try { console.error("[NFLN error-handler] " + source + ":", detail); } catch (e) {}
    ensureBanner();
    if (countEl) countEl.textContent = errorCount > 1 ? "(" + errorCount + " hiba)" : "";
  }

  window.addEventListener("error", function (event) {
    var message = event && (event.message || (event.error && event.error.message));
    reportError("window.onerror", (event && event.error) || message, message);
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    var message = reason && reason.message ? reason.message : String(reason);
    reportError("unhandledrejection", reason, message);
  });
})();