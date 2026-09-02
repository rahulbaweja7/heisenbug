# Solution

## Approach

"10 or more" is an inclusive lower bound, so the check for the no-discount
case needs to be `quantity < 10` (strictly below 10), not `quantity <= 10`.
With `<=`, an order of exactly 10 units falls into the "no discount"
branch, which contradicts the spec.

## Solution

```python
def apply_bulk_discount(quantity, unit_price):
    """Orders of 10 or more units get a 15% discount."""
    if quantity < 10:
        return quantity * unit_price
    return quantity * unit_price * 0.85
```

## Why this works

`quantity < 10` is only true for 1–9 units, so any order of 10 or more
falls through to the discounted return path — matching "10 or more"
exactly, including the boundary value itself.
