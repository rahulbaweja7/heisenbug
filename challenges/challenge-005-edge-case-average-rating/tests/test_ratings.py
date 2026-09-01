from src.ratings import average_rating


def test_normal_list():
    assert average_rating([4, 5, 3]) == 4.0


def test_single_rating():
    assert average_rating([5]) == 5.0


def test_empty_list_returns_zero():
    assert average_rating([]) == 0.0
