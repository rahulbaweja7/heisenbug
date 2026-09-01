def top_scores(scores, n):
    """Return the top n scores, descending, without mutating the input."""
    return scores.sort(reverse=True)[:n]  # BUG: list.sort() sorts in place and returns None
