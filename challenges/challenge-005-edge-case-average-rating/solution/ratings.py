def average_rating(ratings):
    """Return the average of the ratings, or 0.0 if there are none."""
    if not ratings:
        return 0.0
    return sum(ratings) / len(ratings)
