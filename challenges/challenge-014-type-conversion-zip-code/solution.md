# Solution

## Approach

Routing the zip code through `int()` treats it as a number, and numbers
don't have leading zeros — `int("02139")` becomes `2139`, silently
dropping the leading digit when converted back to a string. A zip code is
an identifier made of digits, not a quantity, so it should never be
converted to a numeric type. The fix just strips whitespace and returns
the string as-is.

## Solution

```python
def normalize_zip_code(zip_str):
    """Return the zip code as a clean 5-digit string."""
    return zip_str.strip()
```

## Why this works

No numeric conversion happens, so there's nothing to strip the leading
zero. `.strip()` removes surrounding whitespace without touching the
digits themselves, preserving the zip code exactly as entered.
