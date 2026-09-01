# Recent Transactions List Drops the Latest One

## The bug

```python
return transactions[-n - 1:-1]
```

For `["a", "b", "c", "d"]` with `n = 2`, this slices `[-3:-1]`, which is
indices `1` and `2` — `["b", "c"]`. It grabs the wrong window entirely: the
`-1` end bound excludes the very last element (`"d"`, the most recent
transaction), and the `-n - 1` start bound shifts everything one position
too early to compensate, so the result is off by one in both directions.

## The fix

```python
return transactions[-n:]
```

Slicing from `-n` to the end (implicit) grabs exactly the last `n` elements,
including the final one.

## How to spot this pattern faster

- Negative slice indices are a common source of off-by-one bugs because
  `-1` means "the last element," not "one past the end" — it's easy to
  reach for `-1` as an end bound out of habit (like `range(...)`  patterns)
  and accidentally exclude the very last item.
- When a slice is meant to include "up through the end of the list," the
  end bound should almost always be omitted (`[start:]`) rather than
  written as `-1`.
- Test the boundary explicitly: ask for `n = 1` and check that the single
  item returned really is the *last* one, not the second-to-last.
