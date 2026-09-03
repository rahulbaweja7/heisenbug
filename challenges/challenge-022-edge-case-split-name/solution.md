# Solution

## Approach

`parts[1]` assumes a name always has at least two words, which crashes on
single-word names and silently drops any words past the second one. The
fix slices `parts[1:]` (safe even on a short list) and joins whatever
remains into `last_name`, falling back to an empty string when there's
nothing after the first word.

## Solution

```python
def split_full_name(full_name):
    """Split a full name into (first_name, last_name)."""
    parts = full_name.split()
    first = parts[0]
    last = " ".join(parts[1:]) if len(parts) > 1 else ""
    return first, last
```

## Why this works

`parts[1:]` never raises `IndexError` regardless of how many words are in
`parts` — it just returns whatever elements exist past index 0 (possibly
none). Joining that slice with spaces reconstructs multi-word last names
correctly, and the `len(parts) > 1` check makes the single-word case
explicit rather than relying on `" ".join([])` happening to return `""`.
