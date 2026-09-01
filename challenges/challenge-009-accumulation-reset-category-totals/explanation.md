# Category Totals Leak Into Each Other

## The bug

```python
running_total = 0
for item in items:
    running_total += item["amount"]
    totals[item["category"]] = running_total
```

`running_total` is a single variable shared across every iteration,
regardless of category. For `food, gas, food` with amounts `10, 5, 3`, it
accumulates `10 -> 15 -> 18` in sequence and stores whatever the running
total happens to be at that moment under each category's key — so `gas`
ends up with `15` (food's total plus its own) instead of `5`, and the final
`food` entry gets overwritten with `18` (everything combined) instead of
`13`.

## The fix

```python
totals[item["category"]] = totals.get(item["category"], 0) + item["amount"]
```

Each category accumulates into its *own* slot in the `totals` dict —
`.get(key, 0)` reads the current total for that specific category (or `0`
if it hasn't been seen yet) and adds only this item's amount to it.

## How to spot this pattern faster

- Any accumulator variable declared *outside* a loop that's supposed to
  track something *per group* (per category, per user, per day) is
  suspicious — ask "should this reset when the group changes?"
- A dict being filled from a loop is a strong hint that the accumulation
  should live inside the dict itself (`totals[key] = totals.get(key, 0) +
  x`), not in a separate loop-level variable.
- Test with an interleaved sequence (not all of one category first) —
  `food, gas, food` catches this bug immediately, while `food, food, gas`
  might accidentally look correct for the first category.
