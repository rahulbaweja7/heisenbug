# Solution

## Approach

`weight_kg < max_weight` excluded packages exactly at a tier boundary,
bumping them into the next, pricier tier. Tiers are inclusive of their
upper bound, so the comparison needs to be `<=`. `rates.py`'s tier data
was already correct.

## Solution

```python
from src.rates import RATE_TIERS


def calculate_shipping_cost(weight_kg):
    """Look up the rate tier for weight_kg and return the total cost."""
    for max_weight, rate in RATE_TIERS:
        if weight_kg <= max_weight:
            return weight_kg * rate
    return weight_kg * RATE_TIERS[-1][1]
```

## Why this works

`<=` includes the exact boundary weight in the current tier being
checked, so a 1kg package matches the `(1, 5.00)` tier instead of falling
through to `(5, 3.50)`.
