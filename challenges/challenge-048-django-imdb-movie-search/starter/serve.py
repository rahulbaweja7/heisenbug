"""Small HTTP adapter for the debugging exercise. Run: python serve.py"""
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlencode, urlsplit
import traceback

from src.config.urls import resolve
from src.movies.http import Request, User


def render_page(path, query, method='GET'):
    """Use the exercise's real routes and views; do not correct their bugs here."""
    demo = query.get('demo', 'guest')
    user = User(int(demo), 'Demo ' + demo) if demo in ('1', '2') else None
    request = Request(query=query, user=user)
    status, body = 200, ''
    try:
        if path == '/':
            body = '<p>Search the catalog to begin. Repair the Python files when behavior is incorrect.</p>'
        elif path in ('/movies/search/', '/movies/detail/', '/movies/watchlist/'):
            view = resolve(path)
            if view is None:
                status, body = 404, '<p>Route not found. Check the URL configuration.</p>'
            elif path == '/movies/watchlist/' and method != 'POST':
                status, body = 405, '<p>Use the Add to watchlist button.</p>'
            else:
                response = view(request) if path == '/movies/search/' else view(request, int(query.get('id', '0')))
                status = response.status_code
                context = response.context
                if path == '/movies/search/':
                    cards = []
                    for movie in context.get('movies', []):
                        href = '/movies/detail/?' + urlencode({'id': movie.id, 'demo': demo})
                        cards.append(f'<article><a href="{escape(href)}">{escape(movie.title)}</a><p>{escape(movie.director)} · {escape(", ".join(movie.genres))}</p></article>')
                    body = ''.join(cards) or '<p>No movies found.</p>'
                    page = context.get('page', 1)
                    total = context.get('total_pages', 0)
                    body += f'<p>Page {escape(str(page))} of {escape(str(total))}</p><nav>'
                    for label, number in [('Previous', page - 1), ('Next', page + 1)]:
                        href = '/movies/search/?' + urlencode({**query, 'page': number})
                        body += f'<a href="{escape(href)}">{label}</a> '
                    body += '</nav>'
                elif path == '/movies/detail/':
                    movie = context.get('movie')
                    if movie:
                        body = f'<h2>{escape(movie.title)}</h2><p>{escape(movie.synopsis)}</p><p>Director: {escape(movie.director)}</p><p>Cast: {escape(", ".join(movie.cast))}</p>'
                        body += f'<form method="post" action="/movies/watchlist/"><input type="hidden" name="id" value="{movie.id}"><input type="hidden" name="demo" value="{escape(demo)}"><button>Add to watchlist</button></form>'
                    else:
                        body = '<p>Movie not found.</p>'
                else:
                    body = '<p>' + {201: 'Added to your watchlist.', 200: 'Already in your watchlist.', 401: 'Choose a demo user before adding to a watchlist.', 404: 'Movie not found.'}.get(status, f'Watchlist returned HTTP {status}.') + '</p>'
        else:
            status, body = 404, '<p>Page not found.</p>'
    except Exception:
        status = 500
        body = '<h2>The app raised an error</h2><p>Use this traceback to debug the challenge.</p><pre>' + escape(traceback.format_exc()) + '</pre>'
    options = ''.join(f'<option value="{value}" {"selected" if demo == value else ""}>{label}</option>' for value, label in [('guest', 'Guest'), ('1', 'Demo user 1'), ('2', 'Demo user 2')])
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CineMatch</title>
    <style>body{{font:16px system-ui;background:#f5f4f8;color:#252238;margin:0}}main{{max-width:820px;margin:auto;padding:28px}}a{{color:#6642b8}}h1{{margin:0}}header p{{color:#6b647c}}form,nav{{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}}input,select,button{{font:inherit;padding:9px;border:1px solid #c5bdd7;border-radius:6px}}button{{background:#6746a4;color:white;cursor:pointer}}article{{background:white;padding:16px;margin:12px 0;border-radius:10px}}article a{{font-weight:bold}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:#fff;padding:14px}}.status{{font-size:13px;color:#746a88}}</style></head>
    <body><main><header><h1><a href="/">CineMatch</a></h1><p>A movie discovery debugging exercise</p></header>
    <form action="/movies/search/" method="get"><input aria-label="Search movies" name="q" placeholder="Title, director, or cast" value="{escape(str(query.get('q', '')))}"><input aria-label="Genre" name="genre" placeholder="Genre (optional)" value="{escape(str(query.get('genre', '')))}"><select aria-label="Demo identity" name="demo">{options}</select><button>Search</button></form>
    <p class="status">HTTP {status} · Demo identities apply only to this exercise.</p>{body}</main></body></html>'''
    return status, html


class Handler(BaseHTTPRequestHandler):
    def handle_request(self):
        url = urlsplit(self.path)
        query = {key: values[-1] for key, values in parse_qs(url.query, keep_blank_values=True).items()}
        if self.command == 'POST':
            length = int(self.headers.get('Content-Length', 0))
            if length < 0 or length > 16384:
                self.send_error(413)
                return
            query.update({key: values[-1] for key, values in parse_qs(self.rfile.read(length).decode(), keep_blank_values=True).items()})
        status, html = render_page(url.path, query, self.command)
        body = html.encode()
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    do_GET = handle_request
    do_POST = handle_request


if __name__ == '__main__':
    print('CineMatch listening on port 8000', flush=True)
    ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
