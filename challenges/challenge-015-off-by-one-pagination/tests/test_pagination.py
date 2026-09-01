from src.pagination import get_page_items


def test_first_page():
    assert get_page_items(["a", "b", "c", "d"], page=1, page_size=2) == ["a", "b"]


def test_second_page():
    assert get_page_items(["a", "b", "c", "d"], page=2, page_size=2) == ["c", "d"]


def test_page_size_of_one():
    assert get_page_items(["a", "b", "c"], page=3, page_size=1) == ["c"]
