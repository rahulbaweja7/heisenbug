def qualifies_for_free_shipping(cart_total):
    """Return True if the order qualifies for free shipping (>= $50)."""
    return cart_total >= 50
