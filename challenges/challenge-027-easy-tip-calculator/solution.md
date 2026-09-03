# Solution

## Approach

`tip_percent` represents a percentage (e.g. `20` for 20%), so it needs to
be divided by 100 to become a fraction before multiplying it by the bill.
The buggy version skipped that conversion entirely.

## Solution

```python
def calculate_total_with_tip(bill, tip_percent):
    """Return the bill plus a tip of tip_percent percent."""
    return bill + (bill * tip_percent / 100)
```

## Why this works

`tip_percent / 100` converts `20` into `0.2`, so `bill * (tip_percent /
100)` correctly computes 20% of the bill as the tip amount, which then
gets added to the original bill for the total.
