def is_weekend(day_name):
    """Return True if day_name is Saturday or Sunday, any capitalization."""
    return day_name in ("saturday", "sunday")  # BUG: doesn't normalize case
