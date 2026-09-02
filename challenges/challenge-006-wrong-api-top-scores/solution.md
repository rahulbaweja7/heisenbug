# Solution

## Approach

`list.sort()` sorts in place and returns `None`, so
`scores.sort(reverse=True)[:n]` was slicing `None`, which crashes — and
even before crashing, it had already mutated the caller's `scores` list as
a side effect. The fix is to use `sorted(scores, reverse=True)` instead,
which returns a **new** sorted list and leaves the original untouched.

## Solution

```python
def top_scores(scores, n):
    """Return the top n scores, descending, without mutating the input."""
    return sorted(scores, reverse=True)[:n]
```

## Why this works

`sorted()` builds and returns a new list without touching its input, so
`scores` stays exactly as the caller passed it in. Slicing `[:n]` off the
front of that new, descending-sorted list gives the top `n` scores.
