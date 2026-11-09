"""Render selected videos from build/config/videos.json into the static pages.

Run after adding the owner's video links. Unconfigured slots stay empty;
no sample videos or placeholder players are published.
"""

import argparse
import json
import re
from html import escape
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


ROOT = Path(__file__).resolve().parents[2]


def icon(name):
    return f'<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#{name}"></use></svg>'


def video_info(item):
    url = urlsplit(item["url"])
    host = url.hostname or ""
    kind = ""
    if url.scheme != "https":
        raise ValueError("Video links must use HTTPS.")
    if host in ("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"):
        provider = "youtube"
        parts = url.path.strip("/").split("/")
        video_id = parts[0] if host == "youtu.be" else (
            parts[1] if len(parts) == 2 and parts[0] in ("shorts", "embed")
            else parse_qs(url.query).get("v", [""])[0])
        if not re.fullmatch(r"[\w-]{11}", video_id):
            raise ValueError("Expected a valid YouTube video ID.")
        canonical = "https://www.youtube.com/watch?v=" + video_id
    elif host in ("instagram.com", "www.instagram.com"):
        provider = "instagram"
        parts = url.path.strip("/").split("/")
        if len(parts) == 3 and re.fullmatch(r"[A-Za-z0-9._]+", parts[0]):
            parts = parts[1:]
        if len(parts) != 2 or parts[0] not in ("p", "reel") or not re.fullmatch(r"[\w-]+", parts[1]):
            raise ValueError("Expected an individual Instagram post or Reel link.")
        kind, video_id = parts
        canonical = f"https://www.instagram.com/{kind}/{video_id}/"
    else:
        raise ValueError("Supported video sources are YouTube and Instagram.")
    if not item.get("title", "").strip():
        raise ValueError("Each video needs a descriptive title.")
    return provider, video_id, canonical, kind


def player(item, player_id, external_link=True, priority=False):
    provider, video_id, url, kind = video_info(item)
    title = escape(item["title"], quote=True)
    label = "YouTube" if provider == "youtube" else "Instagram"
    poster = item.get("poster")
    if poster and (not poster.startswith("/img/") or not (ROOT / poster.lstrip("/")).is_file()):
        raise ValueError("Custom posters must reference an existing image in /img/.")
    if not poster and provider == "youtube":
        poster = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    width, height = item.get("poster_width", 480), item.get("poster_height", 360)
    if not all(isinstance(size, int) and size > 0 for size in (width, height)):
        raise ValueError("Poster dimensions must be positive integers.")
    loading = 'loading="eager" fetchpriority="high"' if priority else 'loading="lazy"'
    image = (f'<img class="video-poster" src="{escape(poster, quote=True)}" '
             f'width="{width}" height="{height}" '
             f'alt="" {loading} decoding="async"/>') if poster else ""
    portrait = " video-shell--portrait" if provider == "instagram" else ""
    action = "View" if provider == "instagram" else "Play"
    platform_link = (f'<a href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">'
                     f'Open on {label} {icon("arrow-up-right")}</a>') if external_link else ""
    return f'''<div class="video-player">
 <div class="video-shell{portrait}" id="{player_id}">
  <a class="video-launch" href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer" data-video-launch="" data-video-provider="{provider}" data-video-id="{video_id}" data-instagram-type="{kind}" data-video-title="{title}" aria-label="{action} {title}">
   {image}<span class="video-play">{icon("play")}</span><span class="video-launch-label">Watch on {label}</span>
  </a>
 </div>
 <div class="video-links"><button class="text-link" type="button" data-video-close="" aria-controls="{player_id}" hidden="">Close video {icon("close")}</button>{platform_link}</div>
</div>'''


def render(config):
    featured, reels = config.get("featured"), config.get("reels", [])
    if featured and video_info(featured)[0] != "youtube":
        raise ValueError("The featured performance must be a YouTube video.")
    sections = ['''<section class="page-hero service-hero watch-hero section-shell section-band theme-dark" aria-labelledby="watch-heading">
 <div class="service-title"><p class="eyebrow section-label">Dave D'Amore / Performances</p><h1 id="watch-heading">Drums <span class="heading-accent">in motion</span></h1></div>
 <div class="service-summary"><p class="page-hero-subtitle">Drum performances and covers.</p><p class="page-hero-lead">Explore full drum covers, short performances and collaborations, with free notation for Karnivool's &quot;Drone&quot;.</p>
  <div class="service-actions"><a class="button button--primary" href="#featured-performance">Watch the performances <svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#arrow-down"></use></svg></a><a class="button" href="https://www.instagram.com/drumswithdave/" target="_blank" rel="noopener noreferrer">Follow on Instagram <svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#arrow-up-right"></use></svg></a></div>
 </div>
 <div class="page-hero-media"><img alt="An overhead view of Dave D'Amore playing his acoustic drum kit" src="/img/dd-overhead-1600.webp" srcset="/img/dd-overhead-640.webp 640w, /img/dd-overhead-960.webp 960w, /img/dd-overhead-1600.webp 1600w" sizes="100vw" width="1600" height="903" fetchpriority="high" decoding="async"/></div>
</section>''']
    home = notation = ""
    if featured:
        title = escape(featured["title"])
        description = escape(featured.get("description", ""))
        heading = (escape(featured["artist"]) + " &quot;" + escape(featured["song"]) + "&quot;") if featured.get("artist") and featured.get("song") else title
        home_caption = (escape(featured["artist"]) + ' &quot;' + escape(featured["song"]) + '&quot; – Drum Cover') if featured.get("artist") and featured.get("song") else title + " – Drum Cover"
        sections.append(f'''<section class="watch-featured section-shell section-band page-section theme-medium surface-panel" id="featured-performance" aria-labelledby="featured-heading">
 <div class="watch-featured-copy"><p class="eyebrow section-label">Featured performance</p><h2 id="featured-heading">{heading}</h2><p>{description}</p></div>
 <div class="watch-featured-media" aria-labelledby="featured-heading">{player(featured, "watch-featured", external_link=False)}</div>
 <div class="watch-featured-actions"><a class="button button--primary" href="/notation/karnivool-drone">View free drum notation {icon("arrow-up-right")}</a></div>
</section>''')
        home = f'''<section class="home-watch section-shell section-band page-section theme-dark" aria-labelledby="home-watch-heading">
 <div class="home-watch-copy"><p class="eyebrow section-label">Watch / Behind the kit</p><h2 class="heading-feature" id="home-watch-heading">Drums <span class="heading-accent">in motion</span></h2><p class="lead">{home_caption}</p></div>
 <div class="home-watch-media">{player(featured, "home-performance", external_link=False)}</div>
 <div class="home-watch-action"><a class="button button--primary" href="/watch/">More performances {icon("arrow-up-right")}</a></div>
</section>'''
        notation = f'''<section class="notation-performance" aria-labelledby="notation-performance-heading"><h2 id="notation-performance-heading">Watch the cover</h2>{player(featured, "notation-performance", external_link=False)}<a class="text-link" href="/watch/">More performances {icon("arrow-up-right")}</a></section>'''
    if reels:
        cards = []
        for index, item in enumerate(reels, 1):
            if video_info(item)[0] != "instagram":
                raise ValueError("Selected Reels must use Instagram post links.")
            title = escape(item["title"])
            description = escape(item.get("description", ""))
            cards.append(f'<article class="watch-reel" aria-labelledby="reel-heading-{index}">{player(item, "watch-reel-" + str(index), external_link=False)}<h3 id="reel-heading-{index}">{title}</h3><p>{description}</p></article>')
        sections.append('<section class="watch-clips section-shell section-band theme-dark page-section" aria-labelledby="clips-heading"><div class="watch-clips-intro"><p class="eyebrow section-label">Selected moments</p><h2 id="clips-heading">Short <span class="heading-accent">performances</span></h2></div><div class="watch-reels">' + "\n".join(cards) + '</div></section>')
    return {"WATCH VIDEOS": "\n".join(sections), "HOME VIDEO": home, "NOTATION VIDEO": notation}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    config = json.loads((ROOT / "build/config/videos.json").read_text(encoding="utf-8"))
    sections = render(config)
    targets = {"WATCH VIDEOS": "watch/index.html", "HOME VIDEO": "index.html", "NOTATION VIDEO": "notation/karnivool-drone.html"}
    changed = []
    for slot, filename in targets.items():
        path = ROOT / filename
        source = path.read_bytes().decode("utf-8")
        pattern = re.compile(r"<!-- BEGIN " + slot + r" -->.*?<!-- END " + slot + r" -->", re.S)
        replacement = "<!-- BEGIN " + slot + " -->\n" + sections[slot] + "\n<!-- END " + slot + " -->"
        updated, count = pattern.subn(lambda _: replacement, source)
        if count != 1:
            raise ValueError(f"Expected one {slot} slot in {filename}.")
        if updated != source:
            changed.append(filename)
            if not args.check:
                path.write_bytes(updated.encode("utf-8"))
    print(("Needs video sync: " if args.check and changed else "Video slots synced: ") + (", ".join(changed) or "no changes"))
    if not config.get("featured") and not config.get("reels"):
        print("No video links configured yet; no placeholder players were added.")
    return int(bool(changed) and args.check)


if __name__ == "__main__":
    raise SystemExit(main())
