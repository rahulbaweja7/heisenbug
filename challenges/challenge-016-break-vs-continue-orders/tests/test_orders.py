from src.orders import filter_valid_orders


def test_invalid_order_in_middle_is_skipped_not_fatal():
    orders = [
        {"id": 1, "amount": 10},
        {"id": 2, "amount": None},
        {"id": 3, "amount": 5},
    ]
    result = filter_valid_orders(orders)
    assert [o["id"] for o in result] == [1, 3]


def test_all_valid():
    orders = [{"id": 1, "amount": 10}, {"id": 2, "amount": 20}]
    assert len(filter_valid_orders(orders)) == 2


def test_all_invalid():
    orders = [{"id": 1, "amount": None}, {"id": 2, "amount": None}]
    assert filter_valid_orders(orders) == []
