def filter_valid_orders(orders):
    """Return orders whose amount is not None, skipping invalid ones."""
    valid = []
    for order in orders:
        if order["amount"] is None:
            continue
        valid.append(order)
    return valid
