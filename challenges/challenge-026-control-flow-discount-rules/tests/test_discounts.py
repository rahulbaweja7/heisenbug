from src.discounts import apply_first_matching_discount


def test_first_rule_matches():
    rules = [(lambda p: p >= 100, 0.1), (lambda p: p >= 50, 0.05)]
    assert apply_first_matching_discount(150, rules) == 135.0


def test_second_rule_matches_after_first_fails():
    rules = [(lambda p: p >= 100, 0.1), (lambda p: p >= 50, 0.05)]
    assert apply_first_matching_discount(75, rules) == 71.25


def test_no_rule_matches_returns_original_price():
    rules = [(lambda p: p >= 100, 0.1), (lambda p: p >= 50, 0.05)]
    assert apply_first_matching_discount(10, rules) == 10


def test_empty_rules_returns_original_price():
    assert apply_first_matching_discount(20, []) == 20
