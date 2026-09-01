from src.transactions import recent_transactions


def test_last_two_in_order():
    assert recent_transactions(["a", "b", "c", "d"], 2) == ["c", "d"]


def test_last_one_includes_the_most_recent():
    assert recent_transactions(["a", "b", "c", "d"], 1) == ["d"]


def test_n_equals_full_length():
    assert recent_transactions(["a", "b", "c"], 3) == ["a", "b", "c"]
