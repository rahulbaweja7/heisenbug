from src.calendar_utils import is_weekend


def test_capitalized_saturday():
    assert is_weekend("Saturday") is True


def test_capitalized_sunday():
    assert is_weekend("Sunday") is True


def test_weekday_is_false():
    assert is_weekend("Monday") is False


def test_lowercase_still_works():
    assert is_weekend("sunday") is True
