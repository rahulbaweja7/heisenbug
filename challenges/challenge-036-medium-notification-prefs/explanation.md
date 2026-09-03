# Notifications Send Even When the User Opted Out

## The bug

```python
return not prefs.is_enabled(channel)
```

The `not` inverts the result entirely — `should_send` returns `True`
exactly when the channel is **disabled**, and `False` when it's enabled.
This is the exact opposite of what "should only send if enabled" means.

## The fix

```python
return prefs.is_enabled(channel)
```

## How to spot this pattern faster

- `preferences.py`'s `is_enabled` check is straightforward and correct —
  the entire bug is a single stray `not` in `notifier.py`. Isolated
  inverted conditions like this are easy to introduce (often from
  copy-pasting a "should NOT send" check from somewhere else) and easy to
  miss on a quick read since the code still "looks" like it's checking
  the right thing.
- Read the function name against its behavior: `should_send` returning
  `True` for a *disabled* channel is a direct contradiction — when a
  function's name and its logic disagree, that's a strong signal
  something's inverted.
- Test both an enabled and a disabled channel explicitly. A test that
  only checks one state can't distinguish "correctly checks enabled" from
  "checks the opposite."
