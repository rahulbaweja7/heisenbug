# Solution

## Approach

The loop's step size (`size - 1`) didn't match the width of each slice
(`size`), so consecutive chunks overlapped by one element. Stepping by
`size` instead keeps the windows adjacent with no overlap and no gap.

## Solution

```python
def chunk_list(items, size):
    """Split items into consecutive batches of at most `size` elements."""
    chunks = []
    for i in range(0, len(items), size):
        chunks.append(items[i : i + size])
    return chunks
```

## Why this works

Each iteration's starting index `i` now advances by exactly `size`, the
same width as the slice taken from it — so `items[i : i + size]` for
consecutive values of `i` tile the list exactly once each, with the final
(possibly shorter) chunk naturally handled by Python slicing not raising
an error when the end index exceeds the list length.
