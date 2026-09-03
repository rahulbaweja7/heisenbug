# Solution

## Approach

`sorted()` without `reverse=True` sorts ascending, so the lowest-priority
task came first. Adding `reverse=True` sorts by priority descending,
matching "highest priority first." `task.py` needed no changes.

## Solution

```python
def order_tasks(tasks):
    """Return tasks sorted with the highest priority first."""
    return sorted(tasks, key=lambda t: t.priority, reverse=True)
```

## Why this works

`reverse=True` flips the sort order so the task with the highest
`priority` value comes first, descending down to the lowest — exactly
matching "most urgent runs first."
