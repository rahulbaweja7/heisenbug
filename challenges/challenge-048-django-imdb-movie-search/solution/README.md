# CineMatch workspace

Run `python serve.py`, then open **Preview**. The Preview button can also start
the server for you. After editing Python files, use **Restart server** to reload
the application. Stop a server started in the terminal with Ctrl+C before using
the automatic start button.

Search for `STAR`, filter by `sci-fi`, open movie details, and add a movie to a
watchlist. Switch between Guest, Demo user 1, and Demo user 2 to exercise
authorization and isolation. These are fictional exercise identities.

The HTTP adapter calls the same route and view functions as the grading suite.
Starter errors and incorrect results are intentional. Repair `src/`; the HTTP
adapter is supporting infrastructure, not the solution.

Use `python` for a REPL, or create `scratch.py` to call functions directly:

```python
from src.movies.repository import search
print([movie.title for movie in search('STAR')])
```

Run `python scratch.py` in the terminal. You may write your own `test_*.py` files
and run `pytest`. Hidden grading tests run separately through **Run tests**.
Packages are preinstalled; internet access is disabled. Workspace processes
and temporary files expire, while editor drafts remain in this browser.
