from .http import Response
from .repository import search, get_movie, add_watchlist
from .pagination import paginate

def search_movies(request):
    text = str(request.query.get('query', '')).strip()
    genre = request.query.get('genre')
    rows, total, page = paginate(search(text, genre) if text else [], request.query.get('page', 1))
    return Response(context={'movies': rows, 'page': page, 'total_pages': total})

def movie_detail(request, movie_id):
    m = get_movie(movie_id)
    return Response(200 if m else 404, context={'movie': m})

def add_to_watchlist(request, movie_id):
    if not request.user or not request.user.is_authenticated:
        return Response(401)
    if not get_movie(movie_id):
        return Response(404)
    return Response(201 if add_watchlist(request.user.id, movie_id) else 200)
