def count_low_stock(items, threshold):
    """Return the number of items with quantity at or below threshold."""
    count = 0
    for i in range(len(items) - 1):  # BUG: off-by-one, skips the last item
        if items[i]["quantity"] <= threshold:
            count += 1
    return count
