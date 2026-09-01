def rank_players(players):
    """Return players sorted by score, highest first."""
    return sorted(players, key=lambda p: p["score"], reverse=True)


def top_n_average(players, n):
    """Return the average score of the top n players."""
    ranked = rank_players(players)
    top = ranked[:n]
    return sum(p["score"] for p in top) / len(top)
