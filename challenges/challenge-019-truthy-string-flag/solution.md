# Solution

## Approach

`bool(flag_value)` only checks whether the string is empty or not — it
has no idea what the string's content means, so `bool("false")` evaluates
to `True` because `"false"` is a non-empty string. The fix compares the
actual (lowercased) text against `"true"` explicitly, instead of relying
on Python's generic string truthiness.

## Solution

```python
def is_feature_enabled(flag_value):
    """Return True only if flag_value is the string "true" (any case)."""
    return flag_value.lower() == "true"
```

## Why this works

`.lower()` normalizes casing so `"True"`, `"TRUE"`, and `"true"` all
match, and the `== "true"` comparison only returns `True` for that exact
content — `"false"` correctly evaluates to `False`, and so does any other
non-`"true"` string.
