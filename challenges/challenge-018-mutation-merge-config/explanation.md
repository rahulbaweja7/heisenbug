# Merging Configs Corrupts the Base Config

## The bug

```python
base.update(override)
return base
```

`dict.update()` modifies the dict in place and returns `None` — the value
being returned here is the *same* `base` object the caller passed in, now
mutated with `override`'s values baked into it. Anything else holding a
reference to that same `base` dict (the caller, another part of the
system) sees its config silently change too.

## The fix

```python
merged = dict(base)
merged.update(override)
return merged
```

Copy `base` into a brand-new dict first, then update the *copy* — the
original `base` object is never touched.

## How to spot this pattern faster

- `dict.update()`, like `list.append()`/`list.sort()`, is an in-place
  mutating method. Any time a function is supposed to return a "merged" or
  "combined" version of its inputs without touching them, check whether
  it's calling a mutating method directly on one of those inputs instead
  of a copy.
- The bug is invisible if a test only checks the *return value* — it has
  to check the *original input* afterward to catch it. When a function's
  contract explicitly promises "doesn't mutate the input," always write a
  test for exactly that promise, not just the happy-path output.
