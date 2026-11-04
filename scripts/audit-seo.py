"""Check the static site's SEO contracts without installing dependencies.

Run with Python 3.11+: python scripts/audit-seo.py [--json]
This checks source markup, not browser rendering or Google's indexing decisions.
"""

import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://www.davedrums.com.au"
CANONICAL_PATHS = {"notation/karnivool-drone.html": "/notation/karnivool-drone"}
VOID = set("area base br col embed hr img input link meta param source track wbr".split())


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        relative = path.relative_to(ROOT).as_posix()
        self.url = ORIGIN + CANONICAL_PATHS.get(relative, "/" + relative.removesuffix("index.html"))
        self.source = path.read_text(encoding="utf-8")
        self.tags = []
        self.ids = []
        self.headings = []
        self.title = ""
        self.jsonld = []
        self.stack = []
        self.errors = []
        self.capture = None
        self.feed(self.source)
        if self.stack:
            self.errors.append("Unclosed tags: " + ", ".join(self.stack))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag not in VOID:
            self.stack.append(tag)
        if tag == "title" or re.fullmatch(r"h[1-6]", tag) or (
            tag == "script" and attrs.get("type") == "application/ld+json"
        ):
            self.capture = [tag, ""]

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        if self.capture:
            self.capture[1] += data

    def handle_endtag(self, tag):
        if tag in VOID:
            self.errors.append(f"Unexpected closing void tag: {tag}")
            return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"Mismatched closing tag: {tag}")
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]
        if self.capture and self.capture[0] == tag:
            text = self.capture[1]
            if tag == "title":
                self.title = " ".join(text.split())
            elif tag == "script":
                try:
                    self.jsonld.append(json.loads(text))
                except json.JSONDecodeError as exc:
                    self.errors.append(f"Invalid JSON-LD: {exc}")
            else:
                self.headings.append((int(tag[1]), " ".join(text.split())))
            self.capture = None

    def meta(self, key):
        return [a.get("content", "") for t, a in self.tags if t == "meta"
                and key in (a.get("name"), a.get("property"))]

    def links(self, rel):
        return [a.get("href", "") for t, a in self.tags if t == "link" and a.get("rel") == rel]


def walk(value):
    if isinstance(value, dict):
        yield value
        for item in value.values():
            yield from walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk(item)


def audit():
    paths = sorted(p for p in ROOT.rglob("*.html")
                   if not any(part.startswith(".") for part in p.relative_to(ROOT).parts))
    pages = [Page(path) for path in paths]
    by_path = {p.path.resolve(): p for p in pages}
    errors, warnings, rows = [], [], []
    definitions = {n["@id"] for p in pages for data in p.jsonld for n in walk(data)
                   if "@id" in n and "@type" in n}

    def check_url(page, value, label, fragment=True):
        resolved = urlsplit(urljoin(page.url, value))
        if resolved.netloc != urlsplit(ORIGIN).netloc:
            return
        target = ROOT / unquote(resolved.path).lstrip("/")
        if resolved.path.endswith("/"):
            target /= "index.html"
        elif not target.exists() and not target.suffix and target.with_suffix(".html").is_file():
            # GitHub Pages serves existing .html documents at extensionless URLs.
            target = target.with_suffix(".html")
        if not target.is_file():
            page.errors.append(f"Missing {label}: {value}")
        elif fragment and resolved.fragment and target.resolve() in by_path:
            if unquote(resolved.fragment) not in by_path[target.resolve()].ids:
                page.errors.append(f"Missing anchor in {label}: {value}")

    for page in pages:
        is_error = page.path.name == "404.html"
        description = page.meta("description")
        if not re.search(r"<!doctype html>", page.source, re.I):
            page.errors.append("Missing HTML5 doctype")
        if len([1 for t, _ in page.tags if t == "title"]) != 1 or not page.title:
            page.errors.append("Expected one nonempty title")
        if len(description) != 1 or not description[0]:
            page.errors.append("Expected one nonempty description")
        if len([h for h in page.headings if h[0] == 1]) != 1:
            page.errors.append("Expected one H1")
        previous = 0
        for level, text in page.headings:
            if not text or level > previous + 1:
                page.errors.append(f"Empty/skipped heading: h{level} {text}")
            previous = level
        if not page.meta("viewport") or not any(t == "html" and a.get("lang") == "en-AU" for t, a in page.tags):
            page.errors.append("Missing Australian English/viewport declaration")
        if not any(t == "meta" and a.get("charset", "").lower() == "utf-8" for t, a in page.tags):
            page.errors.append("Missing UTF-8 declaration")
        if any(n > 1 for n in Counter(page.ids).values()):
            page.errors.append("Duplicate IDs")
        if "\ufffd" in page.source:
            page.errors.append("Unicode replacement character in source")
        for tag, attrs in page.tags:
            for key in ["aria-labelledby", "aria-describedby", "aria-controls"]:
                if any(ref not in page.ids for ref in attrs.get(key, "").split()):
                    page.errors.append(f"Broken {key}: {attrs[key]}")
            if "style" in attrs or tag == "style":
                page.errors.append("Inline styles conflict with shared stylesheet convention")
            if tag == "a" and attrs.get("href"):
                check_url(page, attrs["href"], "link")
            if tag in ["img", "script", "iframe", "source"] and attrs.get("src"):
                check_url(page, attrs["src"], "resource", False)
            if tag == "link" and attrs.get("href"):
                check_url(page, attrs["href"], "link resource", False)
            if tag == "img":
                if "alt" not in attrs or not attrs.get("width", "").isdigit() or not attrs.get("height", "").isdigit():
                    page.errors.append("Image missing alt/dimensions: " + attrs.get("src", ""))
                for candidate in attrs.get("srcset", "").split(","):
                    if candidate.strip():
                        check_url(page, candidate.strip().split()[0], "srcset image", False)
            if is_error and tag in ["img", "script", "link"]:
                value = attrs.get("src") or attrs.get("href", "")
                if value and not value.startswith(("/", "https://")):
                    page.errors.append("404 asset is not root-relative: " + value)
        styles = page.links("stylesheet")
        if len(styles) != 1 or not styles[0].endswith("assets/styles.css"):
            page.errors.append("Expected the single shared stylesheet")
        if is_error:
            if not any("noindex" in v for v in page.meta("robots")):
                page.errors.append("404 must be noindex")
            if page.links("canonical"):
                page.errors.append("404 should not canonicalise missing URLs")
        else:
            if page.links("canonical") != [page.url]:
                page.errors.append("Canonical differs from actual page URL")
            if any("noindex" in v for v in page.meta("robots")):
                page.errors.append("Public page unexpectedly noindex")
            for key, expected in [("og:title", page.title), ("twitter:title", page.title),
                                  ("og:description", description[0]), ("twitter:description", description[0]),
                                  ("og:url", page.url)]:
                if page.meta(key) != [expected]:
                    page.errors.append("Inconsistent metadata: " + key)
            for key in ["og:image", "twitter:image"]:
                if len(page.meta(key)) != 1:
                    page.errors.append("Missing social image: " + key)
                else:
                    check_url(page, page.meta(key)[0], key, False)
            for key in ["og:image:alt", "twitter:image:alt", "og:image:width", "og:image:height", "twitter:card"]:
                if len(page.meta(key)) != 1:
                    page.errors.append("Missing social metadata: " + key)
            if not page.jsonld:
                page.errors.append("Missing JSON-LD")
            for data in page.jsonld:
                for node in walk(data):
                    if node.get("@id", "").startswith(ORIGIN) and node["@id"] not in definitions:
                        page.errors.append("Undefined JSON-LD entity: " + node["@id"])
                    if node.get("@type") == "WebPage":
                        if node.get("name") != page.title or node.get("description") != description[0] or node.get("url") != page.url:
                            page.errors.append("WebPage metadata mismatch")
                    if node.get("@type") in ["Service", "ServiceChannel", "WebApplication"]:
                        for prop in ["url", "serviceUrl"]:
                            if node.get(prop):
                                check_url(page, node[prop], "structured data " + prop)
                    if node.get("@type") == "BreadcrumbList":
                        for position, item in enumerate(node.get("itemListElement", []), 1):
                            if item.get("position") != position or not item.get("name"):
                                page.errors.append("Invalid breadcrumb sequence")
                            if item.get("item"):
                                check_url(page, item["item"], "breadcrumb")
        rows.append({"file": page.path.relative_to(ROOT).as_posix(), "url": page.url,
                     "indexable": not is_error, "title": page.title,
                     "description": description[0] if description else "", "headings": page.headings,
                     "html_bytes": page.path.stat().st_size,
                     "images": sum(t == "img" for t, _ in page.tags),
                     "jsonld_types": sorted({str(n["@type"]) for d in page.jsonld for n in walk(d) if "@type" in n})})
        errors.extend(f"{rows[-1]['file']}: {message}" for message in page.errors)

    for key in ["title", "description"]:
        if any(n > 1 for n in Counter(p[key] for p in rows if p["indexable"]).values()):
            errors.append("Duplicate " + key)
    sitemap = ElementTree.parse(ROOT / "sitemap.xml")
    urls = [n.text for n in sitemap.findall("{*}url/{*}loc")]
    if len(urls) != len(set(urls)) or set(urls) != {p["url"] for p in rows if p["indexable"]}:
        errors.append("Sitemap does not match indexable pages")
    if "Sitemap: " + ORIGIN + "/sitemap.xml" not in (ROOT / "robots.txt").read_text():
        errors.append("robots.txt sitemap mismatch")
    if (ROOT / "CNAME").read_text().strip() != urlsplit(ORIGIN).netloc:
        errors.append("CNAME differs from canonical host")
    css = (ROOT / "assets/styles.css").read_text(encoding="utf-8")
    for value in re.findall(r"url\([\"']?([^\"')]+)", css):
        if not value.startswith(("data:", "https:")) and not (ROOT / "assets" / value).is_file():
            errors.append("Missing CSS resource: " + value)
    warnings.append("Browser layout, audio, interaction, external links and Google rich-result eligibility require separate checks.")
    return {"pages": rows, "sitemap_urls": urls, "errors": errors, "notes": warnings}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = audit()
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=True))
    else:
        for error in result["errors"]:
            print("FAIL: " + error)
        print(f"Checked {len(result['pages'])} pages, {len(result['sitemap_urls'])} sitemap URLs: {len(result['errors'])} errors.")
        for note in result["notes"]:
            print("NOTE: " + note)
    raise SystemExit(bool(result["errors"]))
