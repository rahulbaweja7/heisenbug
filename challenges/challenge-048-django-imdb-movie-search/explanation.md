# CineMatch: debugging walkthrough

CineMatch is an original movie-discovery practice scenario with fictitious films.
It uses Django-inspired routing, request objects, views, and repository operations,
but depends only on Python's standard library. No Django installation, database,
network service, filesystem persistence, or environment configuration is required.

## Request flow

`src.config.urls.resolve(path)` looks up a callable in the movie URL table.
The caller invokes that view with a `Request` (and a movie ID for detail or
watchlist handlers). Search reads the request, queries title/director/cast,
applies an optional genre constraint, and paginates unique results before
returning a `Response` context. Results retain catalog order. The public search
view returns no movies for a blank query; repository `search('')` alone lists
the catalog, which also permits independent genre queries.

There are exactly six intentional differences between starter and solution.

## 1. Search route points to the detail handler

**Symptom:** resolving `/movies/search/` returns the wrong callable.
**Root cause:** `src/movies/urls.py` maps that path to `movie_detail`.
**Fix:** change that one mapping to `search_movies`.
**Regression rationale:** assert callable identity directly, independently of
query and pagination behavior. The other routes need no change.

## 2. Search reads the wrong request parameter

**Symptom:** populated search requests appear empty.
**Root cause:** `search_movies` reads `query` instead of the documented `q` key.
**Fix:** use `request.query.get('q', '')` and retain whitespace trimming and the
existing empty-input guard. Safe lookup and trimming already exist in starter;
the incorrect key is the single defect here.
**Regression rationale:** a focused test captures the repository call with a
standard-library mock so the other broken layers cannot hide this defect.
End-to-end checks also cover padded, missing, and blank input.

## 3. Text search requires every field to match

**Symptom:** title-only, director-only, and cast-only terms return no results.
**Root cause:** the repository uses `all` across the title, director, and cast.
**Fix:** use `any` so a case-insensitive substring match in any field qualifies.
**Regression rationale:** separate field-specific tests and an exact expected
list for a term spanning title and cast prevent incomplete or early-return fixes.

## 4. Genre comparison normalizes only one side

**Symptom:** mixed-case genre filters discard valid movies.
**Root cause:** the query genre is lowercased, but stored genre labels are not.
**Fix:** lowercase each stored genre during equality comparison. Retain the
existing seen-ID set; deduplication itself is already correct in starter.
**Regression rationale:** test genre independently with empty repository text,
then combine genre with text. A repeated catalog record checks ID uniqueness,
including multi-genre movies.

## 5. Pagination slices as though pages start at zero

**Symptom:** page one skips the first two results and later pages lose records.
**Root cause:** slicing begins at `page * 2` instead of `(page - 1) * 2`.
**Fix:** use the latter start and `page * 2` end. Keep the shared normalization
and ceiling page-count logic: invalid, fractional, non-positive, or out-of-range
pages become page one. Empty results have one empty page; a final page may hold
one movie.
**Regression rationale:** check exact slices, odd/even totals, the final page,
empty results, and invalid-page response contents, not just page labels.

## 6. Repeated watchlist additions are appended again

**Symptom:** adding the same movie twice duplicates its ID and returns 201 again.
**Root cause:** `add_watchlist` always appends and reports a new addition.
**Fix:** return `False` when the ID already exists, otherwise append and return
`True`. The existing view maps these outcomes to 200 and 201 respectively.
Authentication (401), unknown movie handling (404), and per-user storage already
work in starter and must remain intact.
**Regression rationale:** test duplicate status and stored IDs separately, plus
two-user isolation and rejected requests that must not mutate state.

## Debugging and validation workflow

Read the request contract and trace each boundary before editing. Reproduce a
single symptom, inspect its immediate inputs and outputs, make a small correction,
then retest that boundary and the complete request flow. Do not modify the tests
to accommodate incorrect behavior. Tests restore catalog and watchlist state
explicitly; the duplicate-catalog check also restores state in a `finally` block.

To validate either reference state, create a temporary submission root containing
the selected `starter/src` or `solution/src` as `src`, alongside the unchanged
`tests` directory. From that root run:

```text
python -B -m pytest tests -v --tb=short -p no:cacheprovider
python -B -S -m tests.run_tests
```

The second command requires no pytest or site packages and runs the same test
functions. Both entry points import only submitted `src` files, never solution
source. Syntax and runtime APIs are compatible with Python 3.8.
