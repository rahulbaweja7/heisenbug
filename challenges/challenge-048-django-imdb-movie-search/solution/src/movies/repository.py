from .seed import MOVIES
WATCHLISTS = {}

def all_movies():
    return list(MOVIES)

def get_movie(movie_id):
    return next((m for m in MOVIES if m.id == movie_id), None)

def search(text='', genre=None):
    text = (text or '').strip().lower()
    genre = (genre or '').strip().lower()
    seen = set()
    out = []
    for m in MOVIES:
        hay = [m.title, m.director] + list(m.cast)
        if text and (not any((text in x.lower() for x in hay))):
            continue
        if genre and (not any((genre == g.lower() for g in m.genres))):
            continue
        if m.id not in seen:
            seen.add(m.id)
            out.append(m)
    return out

def add_watchlist(user_id, movie_id):
    ids = WATCHLISTS.setdefault(user_id, [])
    if movie_id in ids:
        return False
    ids.append(movie_id)
    return True
