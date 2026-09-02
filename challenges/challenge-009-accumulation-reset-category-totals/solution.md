# Solution

## Approach

The buggy version accumulated into a single `running_total` variable
shared across every category, so later categories picked up totals left
over from earlier ones. Each category needs its own running sum. Instead
of a separate accumulator variable, accumulate directly into the
`totals` dict per category, using `.get(key, 0)` to read the current
total for that specific category (or `0` if it hasn't been seen yet).

## Solution

```python
def total_per_category(items):
    """Return a dict mapping each category to the sum of its amounts."""
    totals = {}
    for item in items:
        totals[item["category"]] = totals.get(item["category"], 0) + item["amount"]
    return totals
```

## Why this works

Each iteration reads and updates only that item's own category slot in
`totals`, so categories never bleed into each other no matter what order
they appear in the input — an interleaved sequence like `food, gas, food`
still produces correct, independent totals for each.
