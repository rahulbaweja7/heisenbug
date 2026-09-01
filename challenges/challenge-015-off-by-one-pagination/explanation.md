# Pagination Returns the Wrong Page

## The bug

```python
start = page * page_size
```

`page` is documented as 1-indexed (page 1 is the first page), but this
formula treats it as 0-indexed. For `page=1, page_size=2`, it computes
`start = 2`, skipping the first two items entirely and returning page 2's
items instead of page 1's.

## The fix

```python
start = (page - 1) * page_size
```

Subtracting 1 converts the 1-indexed page number into the correct
0-indexed starting offset before multiplying.

## How to spot this pattern faster

- Whenever a function's parameter is documented as 1-indexed (page
  numbers, "the Nth item," row numbers in a spreadsheet), and that
  parameter feeds directly into array/list indexing, check for a missing
  `- 1` conversion — Python lists are always 0-indexed internally.
- Test `page=1` explicitly and check it returns the *first* items in the
  list, not the second batch. Off-by-one bugs like this are invisible if
  you only test `page=2` or higher, since the shift just looks like "the
  wrong window" rather than an obviously broken result.
