# Restock Alerts Fire One Unit Too Late

## The bug

```python
return [item for item in items if item.quantity < item.reorder_threshold]
```

The spec says "at or below" the threshold, which is an inclusive
boundary — an item with `quantity == reorder_threshold` should still be
flagged. `<` excludes that exact boundary value, so the alert fires one
unit too late (only once stock drops *below* the threshold, not *at* it).

## The fix

```python
return [item for item in items if item.quantity <= item.reorder_threshold]
```

## How to spot this pattern faster

- "At or below," "at least," "no more than" are all inclusive-boundary
  phrases — translate them to `<=` / `>=`, never `<` / `>`.
- The bug lives in `notifier.py`, not `inventory.py` — the `Item` data
  class itself was fine. When a multi-file bug report says "restocking is
  broken," don't assume the data model is at fault; trace to where the
  actual decision logic lives.
- Test with an item whose quantity is set exactly equal to its threshold
  — that's the only input that can distinguish `<` from `<=`.
