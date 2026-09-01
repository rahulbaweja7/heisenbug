from src.tags import add_unique_tag


def test_single_call_with_no_existing():
    assert add_unique_tag("urgent") == ["urgent"]


def test_second_unrelated_call_does_not_see_first_calls_tag():
    add_unique_tag("urgent")
    assert add_unique_tag("billing") == ["billing"]


def test_explicit_existing_list_is_respected():
    assert add_unique_tag("new", existing=["old"]) == ["old", "new"]


def test_does_not_add_duplicate():
    assert add_unique_tag("old", existing=["old"]) == ["old"]
