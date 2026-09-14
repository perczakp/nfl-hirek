/* Shared site navigation - single source of truth for the nfln-nav menu.
   Every page includes: <div id="nfln-nav-root"></div><script src="nav.js"></script>
   This script renders the nav synchronously into that placeholder, so there
   is no visible flash of missing navigation. */
(function () {
  "use strict";

  var NAV_LINKS = [
    { href: "index.html", label: "Players Trending" },
    { href: "trade-chart.html", label: "Dynasty Trade Calculator" },
    { href: "rookie-idp-rankings.html", label: "IDP Rankings (Rookies)" },
    { href: "tips.html", label: "Tips" },
    { href: "bye-weeks.html", label: "Bye Weeks" },
    { href: "my-team.html", label: "My Fantasy Team" },
    { href: "strength-of-schedule.html", label: "Strength of Schedule" },
    { href: "IDP26rankings.html", label: "2026 IDP Rankings" },
    { href: "nfl-games.html", label: "NFL Games" }
  ];

  function currentFile() {
    var path = window.location.pathname.split("/").pop();
    return path === "" ? "index.html" : path;
  }

  function buildNavHtml() {
    var current = currentFile();
    var html = '<nav class="nfln-nav" aria-label="Site navigation">';
    for (var i = 0; i < NAV_LINKS.length; i++) {
      var link = NAV_LINKS[i];
      var isActive = link.href === current;
      html +=
        '<a href="' + link.href + '" class="' + (isActive ? "active" : "inactive") + '">' +
        link.label +
        "</a>";
    }
    html += "</nav>";
    return html;
  }

  var root = document.getElementById("nfln-nav-root");
  if (root) {
    root.outerHTML = buildNavHtml();
  }
})();
