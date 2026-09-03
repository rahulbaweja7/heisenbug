# Solution

## Approach

The comparison checked `day_name` against lowercase literals only, so any
capitalized input (the normal way day names are written) failed to match.
Adding `.lower()` before the comparison normalizes the input's case
first.

## Solution

```python
def is_weekend(day_name):
    """Return True if day_name is Saturday or Sunday, any capitalization."""
    return day_name.lower() in ("saturday", "sunday")
```

## Why this works

`.lower()` converts the input to lowercase before comparing, so
`"Saturday"`, `"SATURDAY"`, and `"saturday"` all normalize to the same
string and match correctly against the lowercase literals.
