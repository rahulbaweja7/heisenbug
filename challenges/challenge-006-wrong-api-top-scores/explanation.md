# Top Scores Crashes and Mutates the Input

## The bug

```python
return scores.sort(reverse=True)[:n]
```

`list.sort()` sorts **in place** and returns `None` — it does not return the
sorted list. This line does two things wrong at once:

1. `scores.sort(reverse=True)` mutates the caller's original list as a side
   effect (surprising and often unwanted).
2. `None[:n]` immediately raises `TypeError: 'NoneType' object is not
   subscriptable`, since the return value of `.sort()` is being sliced.

## The fix

```python
return sorted(scores, reverse=True)[:n]
```

`sorted()` returns a **new** sorted list and leaves the original untouched —
exactly what's needed here.

## How to spot this pattern faster

- `list.sort()` vs `sorted(list)` is one of the most common Python API
  mix-ups: `.sort()` mutates and returns `None`; `sorted()` returns a new
  list and never mutates. If you see `.sort()` used in an expression
  (chained, returned, or assigned), that's almost always a bug.
- When a function's contract says "without mutating the input" (or a test
  checks the original list afterward), immediately audit for any in-place
  methods: `.sort()`, `.append()`, `.reverse()`, `.pop()`, dict `.update()`.
- A `TypeError: 'NoneType' object is not subscriptable` crash is a strong
  signal that something upstream returned `None` when you expected a
  collection — trace back to find the in-place method masquerading as a
  value-returning one.
