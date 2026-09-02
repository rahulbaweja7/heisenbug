from src.text import truncate_with_ellipsis


def test_truncates_and_appends_ellipsis():
    result = truncate_with_ellipsis("hello world", 8)
    assert result == "hello..."
    assert len(result) == 8


def test_text_at_max_len_is_unchanged():
    assert truncate_with_ellipsis("hello", 5) == "hello"


def test_text_under_max_len_is_unchanged():
    assert truncate_with_ellipsis("hi", 10) == "hi"
