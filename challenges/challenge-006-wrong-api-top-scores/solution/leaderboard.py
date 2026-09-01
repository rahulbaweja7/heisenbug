def top_scores(scores, n):
    """Return the top n scores, descending, without mutating the input."""
    return sorted(scores, reverse=True)[:n]
