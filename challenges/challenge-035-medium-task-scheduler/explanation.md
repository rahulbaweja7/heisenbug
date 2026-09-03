# Scheduler Runs Low-Priority Tasks First

## The bug

```python
return sorted(tasks, key=lambda t: t.priority)
```

`sorted()` defaults to ascending order, so the lowest-priority task ends
up first. The spec says higher priority numbers are more urgent and
should run first, which means descending order.

## The fix

```python
return sorted(tasks, key=lambda t: t.priority, reverse=True)
```

## How to spot this pattern faster

- `task.py`'s `Task` class is a plain, correct data holder — the bug is
  entirely in how `scheduler.py` sorts by its `priority` field. Trust
  simple data classes and look at the logic that consumes them first.
- Whenever "higher X first" or "most urgent first" is the spec, check
  for `reverse=True` — its absence is the single most common cause of a
  backwards sort.
- Test with at least three distinct priority values so you can verify the
  *full* order, not just that the extremes ended up on the correct ends
  by coincidence.
