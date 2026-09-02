# Solution

## Approach

`base.update(override)` mutates `base` in place and returns `None` — the
value being returned was the caller's original `base` object, now
permanently altered with `override`'s values baked in. The fix copies
`base` into a brand-new dict first, then updates that copy, leaving the
original `base` untouched.

## Solution

```python
def merge_config(base, override):
    """Return a new dict merging override into base, without mutating either."""
    merged = dict(base)
    merged.update(override)
    return merged
```

## Why this works

`dict(base)` creates a new dict with a copy of `base`'s key-value pairs.
`.update(override)` then mutates that new copy, not the original `base`
object — so the caller's `base` dict is exactly as it was before the call,
and `merged` reflects `override`'s values taking priority.
