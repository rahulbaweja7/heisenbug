def filter_valid_orders(orders):
    """Return orders whose amount is not None, skipping invalid ones."""
    valid = []
    for order in orders:
        if order["amount"] is None:
            break  # BUG: should skip this order and keep checking, not stop entirely
        valid.append(order)
    return valid
