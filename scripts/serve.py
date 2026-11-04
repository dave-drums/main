"""Local static preview with GitHub Pages-style extensionless HTML routes.

Usage: python scripts/serve.py [port]
"""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        if urlsplit(self.path).path in ("/notation", "/notation/"):
            error_page = ROOT / "404.html"
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(error_page.stat().st_size))
            self.end_headers()
            return error_page.open("rb")
        return super().send_head()

    def translate_path(self, path):
        translated = Path(super().translate_path(path))
        if not translated.exists() and not translated.suffix and not urlsplit(path).path.endswith("/"):
            candidate = translated.with_suffix(".html")
            if candidate.is_file():
                return str(candidate)
        return str(translated)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", nargs="?", type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f"Serving http://127.0.0.1:{args.port}/ (extensionless HTML supported)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
