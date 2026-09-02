# Solution

## Approach

`transactions[-n - 1:-1]` was wrong on both ends: the `-1` end bound
excludes the very last (most recent) transaction, and the `-n - 1` start
bound shifts the window one position too early to compensate. The correct
slice is simply `transactions[-n:]` — negative start, implicit end —
which grabs exactly the last `n` elements including the final one.

## Solution

```python
def recent_transactions(transactions, n):
    """Return the last n transactions, in original order."""
    return transactions[-n:]
```

## Why this works

`transactions[-n:]` starts `n` positions from the end and slices all the
way through to the end of the list (the omitted end bound means "go to
the end"), so it always includes the most recent transaction along with
the `n - 1` before it, in their original order.
