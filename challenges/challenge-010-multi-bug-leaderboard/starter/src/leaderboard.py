def rank_players(players):
    """Return players sorted by score, highest first."""
    return sorted(players, key=lambda p: p["score"])  # BUG 1: ascending, should be descending


def top_n_average(players, n):
    """Return the average score of the top n players."""
    ranked = rank_players(players)
    top = ranked[:n - 1]  # BUG 2: off-by-one, drops one player from the top n
    return sum(p["score"] for p in top) / len(top)
