from .views import search_movies, movie_detail, add_to_watchlist

urlpatterns = {
    '/movies/search/': movie_detail,
    '/movies/detail/': movie_detail,
    '/movies/watchlist/': add_to_watchlist,
}
