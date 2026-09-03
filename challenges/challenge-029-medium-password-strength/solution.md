# Solution

## Approach

`validator.py` combined the three rules from `rules.py` with `or` instead
of `and`, so any single passing rule was enough to mark a password
"strong." Switching to `and` requires every rule to pass.

## Solution

```python
from src.rules import has_min_length, has_digit, has_uppercase


def is_strong_password(password):
    """Return True only if the password passes every rule."""
    return has_min_length(password) and has_digit(password) and has_uppercase(password)
```

`rules.py` was already correct and needed no changes.

## Why this works

`and` short-circuits to `False` the moment any one rule fails, so the
final result is `True` only when `has_min_length`, `has_digit`, and
`has_uppercase` all independently return `True`.
