# Solution

## Approach

`<` excluded items exactly at their reorder threshold, but "at or below"
is an inclusive boundary. Switching to `<=` in `notifier.py` fixes it;
`inventory.py`'s `Item` class needed no changes.

## Solution

```python
def items_needing_restock(items):
    """Return items whose quantity is at or below their reorder_threshold."""
    return [item for item in items if item.quantity <= item.reorder_threshold]
```

## Why this works

`<=` includes the boundary case where `quantity` exactly equals
`reorder_threshold`, matching "at or below" precisely, while items with
quantity still above the threshold correctly stay excluded.
