# Batch Chunker Produces Overlapping Batches

## The bug

```python
for i in range(0, len(items), size - 1):
```

The loop steps forward by `size - 1` each time, but each chunk grabs
`size` items (`items[i : i + size]`). Since the step is one smaller than
the chunk width, each new chunk starts one position before the previous
chunk actually ended — so the last item of one chunk reappears as the
first item of the next.

## The fix

```python
for i in range(0, len(items), size):
```

## How to spot this pattern faster

- Whenever a loop's step size and the slice width taken inside the loop
  are two separate numbers, they need to match exactly for non-overlapping
  windows — if the step is smaller than the width, chunks overlap; if
  it's larger, items get skipped entirely.
- A quick way to catch this: flatten the output back into one list and
  compare it to the original input. If overlapping happened, the
  flattened list will be longer than the input and contain duplicates.
- Trace it by hand with a tiny example (`size=2`, 4 items) — the bug
  becomes obvious immediately: chunk 1 is `items[0:2]`, chunk 2 starts at
  `i=1` and is `items[1:3]`, so item at index 1 appears in both.
