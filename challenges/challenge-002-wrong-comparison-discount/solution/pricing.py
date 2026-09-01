def apply_bulk_discount(quantity, unit_price):
    """Orders of 10 or more units get a 15% discount."""
    if quantity < 10:
        return quantity * unit_price
    return quantity * unit_price * 0.85
