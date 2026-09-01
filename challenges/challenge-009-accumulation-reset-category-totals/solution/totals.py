def total_per_category(items):
    """Return a dict mapping each category to the sum of its amounts."""
    totals = {}
    for item in items:
        totals[item["category"]] = totals.get(item["category"], 0) + item["amount"]
    return totals
