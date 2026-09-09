from pathlib import Path
import re
import subprocess

ROOT = Path.cwd()
BACKUP_REF = "origin/backup-20260909-before-nfl-games-navigation"
PAGES = [
    "index.html", "trade-chart.html", "rookie-idp-rankings.html", "tips.html",
    "bye-weeks.html", "my-team.html", "strength-of-schedule.html",
    "IDP26rankings.html", "nfl-games.html",
]
LINKS = [
    ("index.html", "Players Trending"),
    ("trade-chart.html", "Dynasty Trade Calculator"),
    ("rookie-idp-rankings.html", "IDP Rankings (Rookies)"),
    ("tips.html", "Tips"),
    ("bye-weeks.html", "Bye Weeks"),
    ("my-team.html", "My Fantasy Team"),
    ("strength-of-schedule.html", "Strength of Schedule"),
    ("IDP26rankings.html", "2026 IDP Rankings"),
    ("nfl-games.html", "NFL Games"),
]


def nav_html(active: str, wrapper: str) -> str:
    lines = [f'<{wrapper} class="nfln-nav" aria-label="Site navigation">']
    for href, label in LINKS:
        state = "active" if href == active else "inactive"
        lines.append(f'  <a href="{href}" class="{state}">{label}</a>')
    lines.append(f"</{wrapper}>")
    return "\n".join(lines)


def main() -> None:
    subprocess.run(
        ["git", "fetch", "origin", "backup-20260909-before-nfl-games-navigation"],
        check=True,
    )

    if subprocess.run(
        ["git", "diff", "--quiet", BACKUP_REF, "--", *PAGES],
        check=False,
    ).returncode != 0:
        raise SystemExit("ABORTED: production pages differ from the verified backup branch.")

    nav_pattern = re.compile(
        r'<(div|nav)\s+class=["\']nfln-nav["\'][^>]*>.*?</\1>',
        re.S | re.I,
    )

    for page in PAGES[:8]:
        path = ROOT / page
        text = path.read_text(encoding="utf-8")

        if page == "my-team.html":
            pattern = re.compile(
                r'<nav\s+class=["\']nav["\'][^>]*>.*?</nav>',
                re.S | re.I,
            )
        else:
            matches = list(nav_pattern.finditer(text))
            if len(matches) != 1:
                raise SystemExit(
                    f"ABORTED: {page}: expected exactly one existing nfln-nav block, found {len(matches)}"
                )
            wrapper = matches[0].group(1).lower()
            pattern = re.compile(
                rf'<{wrapper}\s+class=["\']nfln-nav["\'][^>]*>.*?</{wrapper}>',
                re.S | re.I,
            )

        if len(list(pattern.finditer(text))) != 1:
            raise SystemExit(f"ABORTED: {page}: expected exactly one navigation block")

        replacement = nav_html(page, "nav" if page == "my-team.html" else wrapper)
        path.write_text(pattern.sub(replacement, text, count=1), encoding="utf-8")

    path = ROOT / "nfl-games.html"
    text = path.read_text(encoding="utf-8")
    if nav_pattern.search(text):
        raise SystemExit("ABORTED: nfl-games.html already has an nfln-nav block")

    css = """
<style id="site-navigation-layout-fix-nfl-games">
.nfln-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0 0 18px; }
.nfln-nav a { display: block; text-align: center; }
@media (max-width: 900px) { .nfln-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .nfln-nav { grid-template-columns: 1fr; } }
</style>
"""

    if "site-navigation-layout-fix-nfl-games" not in text:
        if "</head>" not in text:
            raise SystemExit("ABORTED: no </head> in nfl-games.html")
        text = text.replace("</head>", css + "</head>", 1)

    nav = nav_html("nfl-games.html", "nav")
    for marker in ("<main", '<div class="container">', '<div class="controls">'):
        if marker in text:
            text = text.replace(marker, nav + "\n" + marker, 1)
            break
    else:
        raise SystemExit("ABORTED: no safe insertion point in nfl-games.html")
    path.write_text(text, encoding="utf-8")

    state = ROOT / "PROJECT_STATE.md"
    content = state.read_text(encoding="utf-8")
    heading = "## 2026-09-09 — NFL Games navigation integration"
    if heading not in content:
        content = content.rstrip() + f"""

{heading}
- Integrated **NFL Games** into the main site navigation across all 9 production pages.
- Synchronized navigation order across every page; **Preseason** remains excluded.
- Set the active navigation state to the current page on each page.
- Added responsive 3-column / 2-column / 1-column navigation behavior to `nfl-games.html`.
- No NFL Games data source, ESPN endpoint, normalization logic, or existing page functionality was changed.
"""
        state.write_text(content, encoding="utf-8")

    for page in PAGES:
        text = (ROOT / page).read_text(encoding="utf-8")
        matches = list(nav_pattern.finditer(text))
        if len(matches) != 1:
            raise SystemExit(
                f"VERIFICATION FAILED: {page}: expected 1 nfln-nav block, found {len(matches)}"
            )
        block = matches[0].group(0)
        found = re.findall(r'href=["\']([^"\']+)["\']', block, re.I)
        expected = [href for href, _ in LINKS]
        if found != expected:
            raise SystemExit(f"VERIFICATION FAILED: {page}: navigation href order is {found}")
        active = re.findall(
            r'<a[^>]*href=["\']([^"\']+)["\'][^>]*class=["\']active["\']',
            block,
            re.I,
        )
        if active != [page]:
            raise SystemExit(f"VERIFICATION FAILED: {page}: active={active}")
        if re.search(r"Preseason", block, re.I):
            raise SystemExit(f"VERIFICATION FAILED: {page}: Preseason found in navigation")

    print("NFL Games navigation migration passed all checks.")


if __name__ == "__main__":
    main()
