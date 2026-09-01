from src.pricing import apply_bulk_discount


def test_below_threshold_no_discount():
    assert apply_bulk_discount(5, 10) == 50


def test_exactly_at_threshold_gets_discount():
    assert apply_bulk_discount(10, 10) == 85


def test_above_threshold_gets_discount():
    assert apply_bulk_discount(20, 10) == 170
