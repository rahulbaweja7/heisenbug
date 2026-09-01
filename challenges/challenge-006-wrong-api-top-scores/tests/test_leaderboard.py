from src.leaderboard import top_scores


def test_returns_top_n_descending():
    assert top_scores([7, 2, 9, 4], 2) == [9, 7]


def test_does_not_mutate_input():
    scores = [7, 2, 9, 4]
    top_scores(scores, 2)
    assert scores == [7, 2, 9, 4]


def test_n_larger_than_list():
    assert top_scores([3, 1], 5) == [3, 1]
