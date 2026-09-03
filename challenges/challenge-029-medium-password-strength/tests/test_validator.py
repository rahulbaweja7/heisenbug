from src.validator import is_strong_password


def test_strong_password_passes():
    assert is_strong_password("Abcdefg1") is True


def test_too_short_fails_even_with_digit_and_upper():
    assert is_strong_password("Ab1") is False


def test_no_digit_fails():
    assert is_strong_password("Abcdefgh") is False


def test_no_uppercase_fails():
    assert is_strong_password("abcdefg1") is False
