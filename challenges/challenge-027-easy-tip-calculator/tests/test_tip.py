from src.tip import calculate_total_with_tip


def test_twenty_percent_tip():
    assert calculate_total_with_tip(100, 20) == 120.0


def test_zero_percent_tip():
    assert calculate_total_with_tip(50, 0) == 50.0


def test_fifteen_percent_tip():
    assert calculate_total_with_tip(80, 15) == 92.0
