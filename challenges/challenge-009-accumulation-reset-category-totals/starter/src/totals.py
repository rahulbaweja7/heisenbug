def total_per_category(items):
    """Return a dict mapping each category to the sum of its amounts."""
    totals = {}
    running_total = 0  # BUG: shared across all categories, never resets
    for item in items:
        running_total += item["amount"]
        totals[item["category"]] = running_total
    return totals
