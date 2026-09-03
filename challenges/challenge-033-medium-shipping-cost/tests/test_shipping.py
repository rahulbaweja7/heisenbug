from src.shipping import calculate_shipping_cost


def test_within_first_tier():
    assert calculate_shipping_cost(0.5) == 2.5


def test_exactly_at_first_tier_boundary():
    assert calculate_shipping_cost(1) == 5.0


def test_exactly_at_second_tier_boundary():
    assert round(calculate_shipping_cost(5), 2) == 17.5


def test_above_all_tiers():
    assert calculate_shipping_cost(25) == 25 * 1.25
