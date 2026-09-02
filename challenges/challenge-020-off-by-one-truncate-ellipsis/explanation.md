# Truncated Text Overshoots the Max Length

## The bug

```python
return text[:max_len] + "..."
```

This takes the first `max_len` characters of `text`, then tacks on three
more characters for `"..."` — the result ends up `max_len + 3` characters
long, not `max_len`. The "..." was never accounted for in the budget; it's
pure overflow on top of the limit.

## The fix

```python
return text[: max_len - 3] + "..."
```

Reserve 3 characters up front for the ellipsis by slicing to
`max_len - 3` first, so the final string (truncated text + "...") lands
exactly at `max_len`.

## How to spot this pattern faster

- Any time you're building a fixed-length result out of multiple pieces
  (truncated content + a suffix, a prefix + a value + a suffix), the
  budget for each piece needs to add up to the *total* target length —
  don't size just the first piece to the full limit and then append more
  on top.
- Count it out on a small concrete example by hand: `"hello world"` cut to
  8 chars should produce exactly 8 characters, not 11. If your traced-through
  result is longer than the limit, the arithmetic is wrong, not just the
  code style.
- Test by checking `len(result) == max_len` explicitly whenever truncation
  happens, not just that the string "looks about right."
