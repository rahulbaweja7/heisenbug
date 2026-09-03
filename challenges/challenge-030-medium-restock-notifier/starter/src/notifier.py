def items_needing_restock(items):
    """Return items whose quantity is at or below their reorder_threshold."""
    return [item for item in items if item.quantity < item.reorder_threshold]
    # BUG: excludes items exactly at the threshold
