#!/usr/bin/env python3
"""Local dev server: like `python3 -m http.server`, but tells the browser never to cache.

The plain http.server sends no Cache-Control header, so browsers may keep serving an old
style.css / articles.js for hours after you change them. Run from the project root:

    python3 scripts/serve.py          # http://localhost:8000
    python3 scripts/serve.py 4173     # another port
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f'Serving {ROOT} on http://localhost:{port} (no-cache). Ctrl+C to stop.')
    ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
