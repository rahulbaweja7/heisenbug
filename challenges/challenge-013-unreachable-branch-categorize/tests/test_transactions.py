from src.transactions import categorize_transaction


def test_positive_amount_is_purchase():
    assert categorize_transaction(25) == "purchase"


def test_negative_amount_is_refund():
    assert categorize_transaction(-25) == "refund"


def test_zero_amount():
    assert categorize_transaction(0) == "zero"
