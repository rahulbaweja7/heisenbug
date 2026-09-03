# Solution

## Approach

The comparison operator was backwards — `>=` returned `True` exactly when
a coupon had already expired, and `False` for coupons that were still
perfectly valid. Flipping it to `<=` fixes both directions at once.
`coupons.py` needed no changes.

## Solution

```python
def is_coupon_valid(coupon, today):
    """Return True if today is on or before the coupon's expiration date."""
    return today <= coupon.expires_on
```

## Why this works

`today <= coupon.expires_on` is `True` for every day up to and including
the expiration date, and `False` the moment `today` moves past it —
exactly matching "valid on or before expiration."
