from src.totals import total_per_category


def test_two_categories_stay_independent():
    items = [
        {"category": "food", "amount": 10},
        {"category": "gas", "amount": 5},
        {"category": "food", "amount": 3},
    ]
    assert total_per_category(items) == {"food": 13, "gas": 5}


def test_single_category():
    items = [{"category": "food", "amount": 4}, {"category": "food", "amount": 6}]
    assert total_per_category(items) == {"food": 10}


def test_empty_list():
    assert total_per_category([]) == {}
