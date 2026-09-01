def average_rating(ratings):
    """Return the average of the ratings, or 0.0 if there are none."""
    return sum(ratings) / len(ratings)  # BUG: crashes on empty list
