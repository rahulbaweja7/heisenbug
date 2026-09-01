# Inventory Count Off-By-One

## The bug

```python
for i in range(len(items) - 1):
```

`range(len(items) - 1)` stops one index short of the end of the list, so the
last item is never checked. With `items = [A, B, C]`, only `A` and `B` get
evaluated — `C` is silently skipped no matter what its quantity is.

## The fix

```python
for i in range(len(items)):
```

## How to spot this pattern faster

- Any time you see `range(len(x) - 1)` or `range(len(x) + 1)`, ask: *does this
  loop actually need to touch every element, or is this an accidental shift?*
- Off-by-one bugs love to hide in loops that were adapted from a *different*
  loop that legitimately needed `-1` (e.g. comparing `items[i]` to
  `items[i + 1]`) — the `-1` gets copy-pasted into a context where it no
  longer belongs.
- Test with a 1-element and 2-element list first. Off-by-one bugs are often
  invisible on larger inputs but jump out immediately on tiny ones.
