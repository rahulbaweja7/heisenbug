from copy import deepcopy
from unittest.mock import patch
from src.config.urls import resolve
from src.movies.http import Request, User
from src.movies import repository
from src.movies.repository import search, get_movie
from src.movies.pagination import paginate
from src.movies.views import search_movies, movie_detail, add_to_watchlist

_CATALOG = deepcopy(repository.MOVIES)

def reset():
    repository.WATCHLISTS.clear()
    repository.MOVIES[:] = deepcopy(_CATALOG)

def test_route():
    reset()
    assert resolve('/movies/search/') is search_movies

def test_title_partial_casefold():
    reset()
    assert [m.id for m in search('STAR')] == [1, 2, 3, 6]

def test_director_only():
    reset()
    assert [m.id for m in search('ava reed')] == [1, 4]

def test_cast_only():
    reset()
    assert [m.id for m in search('star jones')] == [3]

def test_or_semantics():
    reset()
    assert [m.id for m in search('mira')] == [1, 6]

def test_genre_casefold_empty_text():
    reset()
    assert [m.id for m in search('', 'sCi-Fi')] == [1, 6]

def test_genre_and_text():
    reset()
    assert [m.id for m in search('star', 'sci-fi')] == [1, 6]

def test_repository_unique_ids():
    reset()
    repository.MOVIES.append(deepcopy(repository.MOVIES[0]))
    try:
        ids = [m.id for m in search('')]
        assert ids == list(range(1, 9))
    finally:
        reset()

def test_page_one():
    reset()
    rows, total, page = paginate(list(range(5)), 1)
    assert rows == [0, 1] and total == 3 and (page == 1)

def test_page_two():
    reset()
    rows, total, page = paginate(list(range(5)), 2)
    assert rows == [2, 3] and total == 3 and (page == 2)

def test_empty_pages():
    reset()
    assert paginate([], 1) == ([], 1, 1)

def test_even_total():
    reset()
    assert paginate(list(range(4)), 1)[1] == 2

def test_odd_total():
    reset()
    assert paginate(list(range(5)), 1)[1] == 3

def test_bad_page():
    reset()
    assert paginate(list(range(5)), 'bad')[2] == 1

def test_zero_page():
    reset()
    assert paginate(list(range(5)), 0)[2] == 1

def test_negative_page():
    reset()
    assert paginate(list(range(5)), -1)[2] == 1

def test_fraction_string_page():
    reset()
    assert paginate(list(range(5)), '2.5')[2] == 1

def test_fraction_page():
    reset()
    assert paginate(list(range(5)), 2.5)[2] == 1

def test_large_page():
    reset()
    assert paginate(list(range(5)), 999)[2] == 1

def test_none_page():
    reset()
    assert paginate(list(range(5)), None)[2] == 1

def test_view_q_trim():
    reset()
    response = search_movies(Request({'q': '  sTaR  '}))
    assert [m.id for m in response.context['movies']] == [1, 2]
    assert response.context['page'] == 1
    assert response.context['total_pages'] == 2

def test_query_input_independent_of_search_and_pagination():
    reset()
    with patch('src.movies.views.search', return_value=[]) as query:
        search_movies(Request({'q': '  sTaR  '}))
        assert query.call_count == 1
        assert query.call_args[0][0].lower() == 'star'

def test_view_missing_q_empty():
    reset()
    assert search_movies(Request({})).context['movies'] == []

def test_view_page_two():
    reset()
    response = search_movies(Request({'q': 'star', 'page': '2'}))
    assert [m.id for m in response.context['movies']] == [3, 6]
    assert response.context['page'] == 2
    assert response.context['total_pages'] == 2

def test_view_genre():
    reset()
    response = search_movies(Request({'q': 'star', 'genre': 'SCI-fi'}))
    assert [m.id for m in response.context['movies']] == [1, 6]
    assert response.context['total_pages'] == 1

def test_view_invalid_pages_return_first_page_movies():
    reset()
    for value in ('bad', '0', '-1', '2.5', 2.5, '999', None, True):
        response = search_movies(Request({'q': 'star', 'page': value}))
        assert [m.id for m in response.context['movies']] == [1, 2]
        assert response.context['page'] == 1
        assert response.context['total_pages'] == 2

def test_blank_search_and_unmatched_search():
    reset()
    for text in ('', '   ', 'no such movie'):
        response = search_movies(Request({'q': text}))
        assert response.context == {'movies': [], 'page': 1, 'total_pages': 1}

def test_last_page_can_contain_one_movie():
    reset()
    assert paginate(list(range(5)), 3) == ([4], 3, 3)

def test_detail_known():
    reset()
    response = movie_detail(Request(), 1)
    assert response.status_code == 200
    assert response.context['movie'] == get_movie(1)

def test_detail_unknown():
    reset()
    assert movie_detail(Request(), 999).status_code == 404

def test_watchlist_none():
    reset()
    assert add_to_watchlist(Request({}, None), 1).status_code == 401
    assert repository.WATCHLISTS == {}

def test_watchlist_unauthenticated():
    reset()
    assert add_to_watchlist(Request({}, User(1, 'x', False)), 1).status_code == 401
    assert repository.WATCHLISTS == {}

def test_watchlist_unknown():
    reset()
    assert add_to_watchlist(Request({}, User(1, 'x')), 999).status_code == 404
    assert repository.WATCHLISTS == {}

def test_watchlist_valid():
    reset()
    assert add_to_watchlist(Request({}, User(1, 'x')), 1).status_code == 201
    assert repository.WATCHLISTS == {1: [1]}

def test_watchlist_isolation():
    reset()
    a = User(1, 'a')
    b = User(2, 'b')
    add_to_watchlist(Request({}, a), 1)
    add_to_watchlist(Request({}, b), 2)
    assert repository.WATCHLISTS == {1: [1], 2: [2]}

def test_watchlist_duplicate_status():
    reset()
    u = User(1, 'x')
    add_to_watchlist(Request({}, u), 1)
    assert add_to_watchlist(Request({}, u), 1).status_code == 200

def test_watchlist_duplicate_ids():
    reset()
    u = User(1, 'x')
    add_to_watchlist(Request({}, u), 1)
    add_to_watchlist(Request({}, u), 1)
    assert repository.WATCHLISTS[1] == [1]
