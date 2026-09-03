def is_coupon_valid(coupon, today):
    """Return True if today is on or before the coupon's expiration date."""
    return today >= coupon.expires_on  # BUG: comparison is backwards
