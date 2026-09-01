from src.inventory import count_low_stock


def test_all_items_checked():
    items = [
        {"quantity": 1},
        {"quantity": 5},
        {"quantity": 2},
    ]
    assert count_low_stock(items, 2) == 2


def test_last_item_included():
    items = [{"quantity": 10}, {"quantity": 0}]
    assert count_low_stock(items, 0) == 1


def test_empty_list():
    assert count_low_stock([], 5) == 0
