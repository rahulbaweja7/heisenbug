# Solution

## Approach

`not prefs.is_enabled(channel)` inverted the result, so notifications
sent exactly on the channels the user had disabled and stayed silent on
the ones they wanted. Removing the `not` fixes it. `preferences.py`
needed no changes.

## Solution

```python
def should_send(prefs, channel):
    """Return True only if the channel is enabled in the user's preferences."""
    return prefs.is_enabled(channel)
```

## Why this works

`should_send` now directly mirrors `is_enabled`'s result instead of
flipping it, so a channel the user opted into returns `True` and a
channel they didn't returns `False`, matching the intended behavior.
