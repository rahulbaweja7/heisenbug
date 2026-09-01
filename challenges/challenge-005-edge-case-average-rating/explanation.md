# Average Rating Crashes on Empty Input

## The bug

```python
return sum(ratings) / len(ratings)
```

Works fine for any non-empty list, but when `ratings` is empty, `len(ratings)`
is `0` and this raises `ZeroDivisionError`. A brand-new product with no
reviews yet is a completely normal state, not an exceptional one — the
function should handle it gracefully.

## The fix

```python
if not ratings:
    return 0.0
return sum(ratings) / len(ratings)
```

## How to spot this pattern faster

- Any time you see a division, ask "can the denominator ever be zero?" —
  `len()` of a list is the single most common source of a zero denominator.
- Empty input is the classic edge case interviewers (and real bug reports)
  reach for first. Before trusting a function, mentally run it on `[]`,
  `None`, and a single-element list.
- A function whose docstring or spec explicitly calls out a default value
  for a special case (here, "0.0 if there are none") is telling you exactly
  where to look for a missing guard clause.
