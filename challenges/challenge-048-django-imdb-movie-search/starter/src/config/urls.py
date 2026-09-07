from src.movies.urls import urlpatterns

def resolve(path):
    return urlpatterns.get(path)
