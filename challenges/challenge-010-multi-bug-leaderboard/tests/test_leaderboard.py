from src.leaderboard import rank_players, top_n_average


def make_players(scores):
    return [{"name": f"p{i}", "score": s} for i, s in enumerate(scores)]


def test_rank_players_descending():
    players = make_players([10, 30, 20])
    ranked = rank_players(players)
    assert [p["score"] for p in ranked] == [30, 20, 10]


def test_top_n_average_uses_exactly_n_players():
    players = make_players([10, 30, 20])
    assert top_n_average(players, 2) == 25.0


def test_top_n_average_with_n_one_is_the_top_score():
    players = make_players([10, 30, 20])
    assert top_n_average(players, 1) == 30.0
