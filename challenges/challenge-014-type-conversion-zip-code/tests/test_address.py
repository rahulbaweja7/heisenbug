from src.address import normalize_zip_code


def test_leading_zero_preserved():
    assert normalize_zip_code("02139") == "02139"


def test_strips_whitespace():
    assert normalize_zip_code(" 02139 ") == "02139"


def test_no_leading_zero():
    assert normalize_zip_code("90210") == "90210"
