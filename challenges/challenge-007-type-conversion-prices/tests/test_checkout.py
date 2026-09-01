from src.checkout import total_price


def test_sums_decimal_prices():
    assert total_price(["12.50", "3.25"]) == 15.75


def test_single_price():
    assert total_price(["9.99"]) == 9.99


def test_empty_list():
    assert total_price([]) == 0.0
