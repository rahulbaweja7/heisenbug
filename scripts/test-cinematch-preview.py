"""Run adapter checks against starter and reference solution without copying files."""
import importlib
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'challenges/challenge-048-django-imdb-movie-search'


def load(which):
    for name in list(sys.modules):
        if name == 'serve' or name == 'src' or name.startswith('src.'):
            del sys.modules[name]
    sys.path.insert(0, str(ROOT / which))
    try:
        return importlib.import_module('serve')
    finally:
        sys.path.pop(0)


class PreviewTests(unittest.TestCase):
    def test_starter_bug_is_visible(self):
        app = load('starter')
        status, page = app.render_page('/movies/search/', {'q': 'STAR'})
        self.assertEqual(status, 500)
        self.assertIn('movie_detail', page)
        self.assertIn('Search movies', page)

    def test_solution_search_and_details(self):
        app = load('solution')
        status, page = app.render_page('/movies/search/', {'q': 'STAR', 'genre': 'sci-fi', 'demo': '1'})
        self.assertEqual(status, 200)
        self.assertIn('Page 1 of 1', page)
        self.assertIn('/movies/detail/', page)
        status, page = app.render_page('/movies/detail/', {'id': '1', 'demo': '1'})
        self.assertEqual(status, 200)
        self.assertIn('Add to watchlist', page)

    def test_solution_watchlist_auth_and_isolation(self):
        app = load('solution')
        self.assertEqual(app.render_page('/movies/watchlist/', {'id': '1'}, 'POST')[0], 401)
        self.assertEqual(app.render_page('/movies/watchlist/', {'id': '1', 'demo': '1'}, 'POST')[0], 201)
        self.assertEqual(app.render_page('/movies/watchlist/', {'id': '1', 'demo': '1'}, 'POST')[0], 200)
        self.assertEqual(app.render_page('/movies/watchlist/', {'id': '1', 'demo': '2'}, 'POST')[0], 201)
        self.assertEqual(app.render_page('/movies/detail/', {'id': '999'})[0], 404)

    def test_html_escaping_and_missing_routes(self):
        app = load('solution')
        status, page = app.render_page('/', {'q': '<script>alert(1)</script>'})
        self.assertEqual(status, 200)
        self.assertNotIn('<script>', page)
        self.assertEqual(app.render_page('/missing', {})[0], 404)

    def test_existing_hidden_suite_passes_for_solution(self):
        load('solution')
        namespace = {}
        exec(compile((ROOT / 'tests/test_cinematch.py').read_text(), 'test_cinematch.py', 'exec'), namespace)
        tests = [value for name, value in namespace.items() if name.startswith('test_') and callable(value)]
        self.assertGreater(len(tests), 10)
        for check in tests:
            with self.subTest(check=check.__name__):
                check()


if __name__ == '__main__':
    unittest.main(verbosity=2)
