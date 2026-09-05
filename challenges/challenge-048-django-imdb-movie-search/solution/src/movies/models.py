from dataclasses import dataclass

@dataclass
class Movie:
    id: int
    title: str
    director: str
    cast: list
    genres: list
    synopsis: str = ''
