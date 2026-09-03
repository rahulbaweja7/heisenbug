# Solution

## Approach

`.replace(".", "")` strips every dot in the string, not just the one
separating the extension. The fix uses `.rsplit(".", 1)` to split from
the right side only once, then takes everything before that split point —
naturally handling filenames with multiple dots. A filename with no dot
at all is returned unchanged.

## Solution

```python
def remove_extension(filename):
    """Strip only the final extension from a filename."""
    if "." not in filename:
        return filename
    return filename.rsplit(".", 1)[0]
```

## Why this works

`"report.v2.final.pdf".rsplit(".", 1)` splits from the right and stops
after one split, giving `["report.v2.final", "pdf"]` — taking index `[0]`
keeps everything up to (but not including) the final dot, leaving the
earlier dots in `v2.final` untouched.
