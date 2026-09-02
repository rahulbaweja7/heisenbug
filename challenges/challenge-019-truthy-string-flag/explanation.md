# Feature Flag Is On Even When Set to "false"

## The bug

```python
return bool(flag_value)
```

In Python, `bool()` on a string is `True` for **any non-empty string** —
including the string `"false"`. `bool("false")` is `True`, because it's
just checking "is this string empty or not," not "does this string say
false." Any non-empty flag value reads as enabled, no matter what it
actually says.

## The fix

```python
return flag_value.lower() == "true"
```

Compare the actual (lowercased) text against `"true"` explicitly, instead
of relying on Python's generic truthiness rules for strings.

## How to spot this pattern faster

- `bool(some_string)` is a classic trap when the string is meant to encode
  a real true/false value (like an env var or config flag) rather than
  "presence vs. absence." `bool()` only ever asks "is this empty?" — it
  has no idea what the string's *content* means.
- Config/env values are almost always strings, even when they're
  conceptually booleans. Any time you see a flag-like value flow straight
  into `bool(...)` without a content comparison, that's worth a second
  look.
- Test the literal string `"false"` explicitly — a test suite that only
  tries `"true"` and `""` would completely miss this bug, since both of
  those happen to work correctly even with `bool()`.
