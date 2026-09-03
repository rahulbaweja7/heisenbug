from src.inventory import Item
from src.notifier import items_needing_restock


def test_below_threshold_flagged():
    items = [Item("A", 2, 5)]
    assert items_needing_restock(items) == items


def test_exactly_at_threshold_flagged():
    items = [Item("A", 5, 5)]
    assert items_needing_restock(items) == items


def test_above_threshold_not_flagged():
    items = [Item("A", 10, 5)]
    assert items_needing_restock(items) == []
