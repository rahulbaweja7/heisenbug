# Solution

## Approach

The buggy version put `return missing` inside the loop's `if` block, so
the function bailed out the moment it found the *first* missing field
instead of continuing to check the rest. The fix is just dedenting that
`return` so it runs once, after the loop has checked every field.

## Solution

```python
def find_missing_fields(form, required_fields):
    """Return a list of all required fields that are missing or empty
    from the submitted form."""
    missing = []
    for field in required_fields:
        if field not in form or not form[field]:
            missing.append(field)
    return missing
```

## Why this works

The loop now always runs to completion, appending every missing field it
finds along the way, and `return missing` only executes afterward — so
the result reflects every problem with the form, not just the first one.
