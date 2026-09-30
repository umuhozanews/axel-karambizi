"""Builds the inner pages of the offline replica.

The homepage in this folder was captured by an earlier tool. This script adds the
rest of the site's pages from the same source, pointing every page at the one
shared assets/ folder and rewriting internal links so the site works from disk.

    python build_pages.py --probe    inspect a page without writing anything
    python build_pages.py            fetch and build every page
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.parse

import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ORIGIN = "https://portavia.framer.website"
ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, "assets")
MANIFEST = os.path.join(ASSETS, "remote-manifest.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# path on the live site -> folder in this project
PAGES = {
    "/about": "about",
    "/projects": "projects",
    "/blogs": "blogs",
    "/projects/summer-vibes-festival-campaign": "projects/summer-vibes-festival-campaign",
    "/projects/coral-spiral-abstract": "projects/coral-spiral-abstract",
    "/projects/shopease-redesign-sprint": "projects/shopease-redesign-sprint",
    "/projects/black-geometric-prisms": "projects/black-geometric-prisms",
    "/blogs/5-design-trends-that-will-define-2024": "blogs/5-design-trends-that-will-define-2024",
    "/blogs/how-to-streamline-your-design-workflow": "blogs/how-to-streamline-your-design-workflow",
}

# Blocks the template author marked as removable, plus Framer's own badge.
PROMO_MARKERS = [
    'data-framer-name="New Release ( you can delete )"',
    'data-framer-name="Get Template ( you can delete )"',
]
BADGE_MARKER = 'href="https://www.framer.com"'

ASSET_EXTS = {
    ".woff2", ".woff", ".ttf", ".otf",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".ico",
    ".mp4", ".webm", ".css",
}
# Stops before HTML entities such as &quot; so escaped JSON payloads stay intact.
REMOTE_ASSET = re.compile(r"https://(?:framerusercontent\.com|fonts\.gstatic\.com)/[^\"'\s)\\<>&]+")

# Widest variant worth storing; Framer offers originals far larger than needed.
MAX_WIDTH = 1200

# Scripts that only exist to drive the site's own features are rebuilt locally.
FEATURE_SCRIPTS = [
    ("scroll-flip.js", "framer-43x9nz"),
    ("service-hover.js", "framer-1id3mzr"),
    ("theme-toggle.js", "framer-1978dwj-container"),
]


def enclosing_block(html, index, tag="div"):
    """Return (start, end) of the `tag` element containing `index`, balanced."""
    open_pat = "<" + tag
    start = html.rfind(open_pat, 0, index + 1)
    if start == -1:
        return None

    depth = 0
    pos = start
    while pos < len(html):
        nxt_open = html.find(open_pat, pos)
        nxt_close = html.find("</" + tag + ">", pos)
        if nxt_close == -1:
            return None
        if nxt_open != -1 and nxt_open < nxt_close:
            depth += 1
            pos = nxt_open + len(open_pat)
        else:
            depth -= 1
            pos = nxt_close + len(tag) + 3
            if depth == 0:
                return start, pos
    return None


def strip_blocks(html, label=""):
    """Remove the promo widgets, Framer's badge, telemetry and script preloads."""
    removed = []

    for marker in PROMO_MARKERS + [BADGE_MARKER]:
        while True:
            hit = html.find(marker)
            if hit == -1:
                break
            span = enclosing_block(html, hit)
            if not span:
                print(f"  ! {label}: could not bound {marker}")
                break
            removed.append((marker[:46], span[1] - span[0]))
            html = html[:span[0]] + html[span[1]:]

    patterns = [
        ("editor iframe", r"<iframe[^>]*__framer-editorbar[^>]*>.*?</iframe>"),
        ("telemetry", r"<script[^>]*events\.framer\.com[^>]*>.*?</script>"),
        ("telemetry", r'<link[^>]+events\.framer\.com[^>]*>'),
        ("script preload", r'<link[^>]+rel="modulepreload"[^>]*>'),
        ("script preload", r'<link[^>]+rel="preload"[^>]+as="script"[^>]*>'),
        ("script preload", r'<link[^>]+rel="preload"[^>]+as="fetch"[^>]*>'),
        ("network hint", r'<link[^>]+rel="(?:preconnect|dns-prefetch)"[^>]*>'),
    ]
    for name, pat in patterns:
        for m in list(re.finditer(pat, html, re.S)):
            removed.append((name, m.end() - m.start()))
        html = re.sub(pat, "", html, flags=re.S)

    return html, removed


def variant_width(url):
    m = re.search(r"scale-down-to=(\d+)", url)
    return int(m.group(1)) if m else None


def choose_variants(urls):
    """Map every URL to the single file worth downloading for it.

    Framer serves the same image at several widths. Keeping one copy per image
    and pointing all of its variants at that copy avoids storing near-duplicates.
    """
    groups = {}
    for url in urls:
        groups.setdefault(url.split("?")[0], []).append(url)

    mapping = {}
    for base, variants in groups.items():
        capped = [(w, u) for w, u in ((variant_width(v), v) for v in variants)
                  if w is not None and w <= MAX_WIDTH]
        pick = max(capped)[1] if capped else (base if base in variants else variants[0])
        for u in variants:
            mapping[u] = pick
    return mapping


def collect_urls(html):
    found = set()
    for m in REMOTE_ASSET.finditer(html):
        url = m.group(0).rstrip(".,;")
        ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
        if ext in ASSET_EXTS:
            found.add(url)
    return found


def load_manifest():
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)


def filename_for(url, manifest):
    """A stable local filename, hash-suffixed only when basenames collide."""
    for name, known in manifest.items():
        if known == url:
            return name

    raw = os.path.basename(urllib.parse.urlparse(url).path) or "asset"
    base = re.sub(r"[^A-Za-z0-9._-]", "_", raw)
    stem, ext = os.path.splitext(base)

    name = base
    taken = set(manifest) | set(os.listdir(ASSETS))
    if name in taken:
        name = f"{stem}-{hashlib.sha1(url.encode()).hexdigest()[:8]}{ext}"
    manifest[name] = url
    return name


def fetch_assets(client, urls, manifest):
    """Download anything missing. Returns url -> local filename for all urls."""
    picks = choose_variants(urls)
    names = {}
    for url in sorted(set(picks.values())):
        name = filename_for(url, manifest)
        names[url] = name
        target = os.path.join(ASSETS, name)
        if os.path.exists(target):
            continue
        try:
            r = client.get(url)
            r.raise_for_status()
            with open(target, "wb") as f:
                f.write(r.content)
            print(f"    + assets/{name} ({len(r.content)} bytes)")
        except Exception as exc:
            print(f"    ! failed {url}: {exc}")
            names.pop(url, None)
            manifest.pop(name, None)
    return {src: names[pick] for src, pick in picks.items() if pick in names}


def relative(depth, target):
    return ("../" * depth if depth else "./") + target


def localize_assets(html, mapping, depth):
    # Longest first so no URL is a prefix of another mid-replacement.
    for url in sorted(mapping, key=len, reverse=True):
        html = html.replace(url, relative(depth, "assets/" + mapping[url]))
    return html


def rewrite_links(html, depth):
    """Point the site's own links at the local pages."""
    # Longest paths first so /projects/foo is not clobbered by /projects.
    for path in sorted(PAGES, key=len, reverse=True):
        html = html.replace(ORIGIN + path, relative(depth, PAGES[path] + "/index.html"))
    html = html.replace(ORIGIN + "/#", relative(depth, "index.html#"))
    html = html.replace(ORIGIN + "/", relative(depth, "index.html"))
    html = html.replace(ORIGIN, relative(depth, "index.html"))
    return html


def banner_markup():
    home = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    hit = home.find("Offline Rebuilt Replica")
    if hit == -1:
        return ""
    span = enclosing_block(home, hit)
    return home[span[0]:span[1]] if span else ""


def inject(html, depth, banner):
    """Add the replica banner and whichever feature scripts this page needs."""
    if banner and "Offline Rebuilt Replica" not in html:
        m = re.search(r"<body[^>]*>", html)
        if m:
            html = html[:m.end()] + banner + html[m.end():]

    tags = [
        f'<script src="{relative(depth, "assets/" + name)}" defer=""></script>'
        for name, marker in FEATURE_SCRIPTS if marker in html
    ]
    if tags:
        block = "\n<!-- Start of bodyEnd -->\n" + "\n".join(tags) + "\n<!-- End of bodyEnd -->\n"
        html = html.replace("</body>", block + "</body>", 1)
    return html, len(tags)


def probe():
    url = ORIGIN + "/about"
    print(f"[probe] {url}")
    with httpx.Client(headers=HEADERS, timeout=60.0, follow_redirects=True) as c:
        html = c.get(url).text
    print(f"  fetched {len(html)} bytes")

    stripped, removed = strip_blocks(html, label="about")
    print(f"  removed {len(removed)} block(s), {len(html) - len(stripped)} bytes")

    urls = collect_urls(stripped)
    mapping = choose_variants(urls)
    print(f"  {len(urls)} asset URLs -> {len(set(mapping.values()))} files to store")
    print(f"  raw 'framerusercontent' mentions: {stripped.count('framerusercontent')}")

    out = localize_assets(stripped, {u: "X" for u in urls}, 1)
    out = rewrite_links(out, 1)
    print(f"  leftover framerusercontent: {out.count('framerusercontent')}")
    print(f"  leftover {ORIGIN}: {out.count(ORIGIN)}")
    print(f"  remaining hosts: {sorted(set(re.findall(r'https://[a-z0-9.-]+', out)))}")
    print(f"  banner: {len(banner_markup())} bytes")

    print("  leftover remote refs:")
    for m in re.finditer(r"https://(?:framerusercontent\.com|fonts\.gstatic\.com)[^\"'\s)\\<>]*", out):
        print(f"    {m.group(0)[:130]}")


def build():
    os.makedirs(ASSETS, exist_ok=True)
    manifest = load_manifest()
    banner = banner_markup()
    if not banner:
        print("! could not find the replica banner in index.html")

    with httpx.Client(headers=HEADERS, timeout=90.0, follow_redirects=True) as client:
        for path, folder in PAGES.items():
            depth = folder.count("/") + 1
            print(f"\n[build] {path} -> {folder}/index.html (depth {depth})")

            r = client.get(ORIGIN + path)
            r.raise_for_status()
            html = r.text
            print(f"  fetched {len(html)} bytes")

            html, removed = strip_blocks(html, label=path)
            print(f"  stripped {len(removed)} block(s)")

            mapping = fetch_assets(client, collect_urls(html), manifest)
            html = localize_assets(html, mapping, depth)
            html = rewrite_links(html, depth)
            html, n_scripts = inject(html, depth, banner)
            print(f"  localized {len(mapping)} URL(s), wired {n_scripts} script(s)")

            left = html.count("framerusercontent") + html.count(ORIGIN)
            if left:
                print(f"  ! {left} remote reference(s) remain")

            out_dir = os.path.join(ROOT, *folder.split("/"))
            os.makedirs(out_dir, exist_ok=True)
            with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  wrote {folder}/index.html ({len(html)} bytes)")

    save_manifest(manifest)
    print(f"\n[done] manifest holds {len(manifest)} asset(s)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--probe", action="store_true", help="inspect one page, write nothing")
    args = ap.parse_args()
    probe() if args.probe else build()


if __name__ == "__main__":
    main()
