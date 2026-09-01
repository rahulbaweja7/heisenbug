from src.validator import find_missing_fields


def test_all_fields_present():
    form = {"name": "Ada", "email": "ada@example.com"}
    assert find_missing_fields(form, ["name", "email"]) == []


def test_single_missing_field():
    form = {"name": "Ada", "email": ""}
    assert find_missing_fields(form, ["name", "email"]) == ["email"]


def test_multiple_missing_fields_all_reported():
    form = {"name": "", "email": "", "phone": "555-1234"}
    assert find_missing_fields(form, ["name", "email", "phone"]) == ["name", "email"]


def test_field_absent_entirely_counts_as_missing():
    form = {"name": "Ada"}
    assert find_missing_fields(form, ["name", "email", "phone"]) == ["email", "phone"]
