# Solution

## Approach

`page` is documented as 1-indexed, but `start = page * page_size` treated
it as 0-indexed — for `page=1, page_size=2` it computed `start = 2`,
skipping the actual first page and returning page 2's items instead. The
fix subtracts 1 from `page` before multiplying, converting the 1-indexed
page number into the correct 0-indexed starting offset.

## Solution

```python
def get_page_items(items, page, page_size):
    """Return the items for the given 1-indexed page."""
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]
```

## Why this works

For `page=1`, `(page - 1) * page_size` is `0`, so the slice correctly
starts at the very beginning of the list. Each subsequent page shifts the
window forward by exactly `page_size` items, aligned with how humans count
pages starting from 1.
