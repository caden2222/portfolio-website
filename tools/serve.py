"""Serve only dist/, at the GitHub Pages project prefix. Never serve research notes."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'dist'
PREFIX = '/portfolio-website/'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if not self.path.startswith(PREFIX):
            self.send_error(404)
            return
        self.path = '/' + self.path[len(PREFIX):]
        super().do_GET()

print('Preview: http://localhost:8000/portfolio-website/', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
