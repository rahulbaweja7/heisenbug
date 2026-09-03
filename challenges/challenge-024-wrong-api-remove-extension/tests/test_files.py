from src.files import remove_extension


def test_simple_extension():
    assert remove_extension("report.pdf") == "report"


def test_multiple_dots_only_last_removed():
    assert remove_extension("report.v2.final.pdf") == "report.v2.final"


def test_no_extension():
    assert remove_extension("README") == "README"
