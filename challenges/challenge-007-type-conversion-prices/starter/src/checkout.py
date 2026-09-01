def total_price(price_strings):
    """Sum a list of price strings like "12.50" and return the total."""
    total = 0
    for price in price_strings:
        total += int(price)  # BUG: int() truncates/crashes on decimal strings
    return total
