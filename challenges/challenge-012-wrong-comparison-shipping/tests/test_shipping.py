from src.shipping import qualifies_for_free_shipping


def test_above_threshold():
    assert qualifies_for_free_shipping(75) is True


def test_exactly_at_threshold():
    assert qualifies_for_free_shipping(50) is True


def test_below_threshold():
    assert qualifies_for_free_shipping(49.99) is False
