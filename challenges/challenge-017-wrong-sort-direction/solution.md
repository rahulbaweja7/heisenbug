# Solution

## Approach

`reverse=True` sorts from highest to lowest `created_at`, putting the
newest ticket first. "Oldest first" means the lowest `created_at` should
come first, which is `sorted()`'s default ascending order — so the fix is
just dropping `reverse=True`.

## Solution

```python
def sort_oldest_first(tickets):
    """Return tickets sorted with the oldest (lowest created_at) first."""
    return sorted(tickets, key=lambda t: t["created_at"])
```

## Why this works

Without `reverse=True`, `sorted()` orders ascending by the key —
smallest `created_at` (the oldest ticket) ends up first, exactly matching
"the one that's been waiting longest."
