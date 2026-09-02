# Solution

## Approach

`text[:max_len] + "..."` took the first `max_len` characters and then
added three more on top, so the result was always `max_len + 3`
characters long — the "..." was never budgeted for. The fix reserves 3
characters up front by slicing to `max_len - 3` before appending the
ellipsis, so the final length lands exactly on `max_len`.

## Solution

```python
def truncate_with_ellipsis(text, max_len):
    """Truncate text to max_len total characters, appending "..." if cut."""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."
```

## Why this works

`text[: max_len - 3]` is `max_len - 3` characters long, and appending the
3-character `"..."` brings the total back up to exactly `max_len` — no
overshoot, no undershoot.
