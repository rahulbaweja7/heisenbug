# Solution

## Approach

The original code went straight to `sum(ratings) / len(ratings)` with no
check for an empty list, so `len(ratings)` being `0` caused a
`ZeroDivisionError`. The fix adds an explicit guard clause at the top:
if `ratings` is empty, return `0.0` immediately, matching the spec's
documented default.

## Solution

```python
def average_rating(ratings):
    """Return the average of the ratings, or 0.0 if there are none."""
    if not ratings:
        return 0.0
    return sum(ratings) / len(ratings)
```

## Why this works

`not ratings` is `True` for an empty list, so that branch short-circuits
before the division ever happens. For any non-empty list, execution falls
through to the normal average calculation, unchanged.
