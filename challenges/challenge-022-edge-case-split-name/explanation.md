# Full Name Splitter Crashes on Single Names

## The bug

```python
last = parts[1]
```

This assumes every name has at least two words. For a single-word name
like `"Madonna"`, `parts` only has one element, so `parts[1]` raises
`IndexError`. And for a name with three or more words, it silently drops
everything after the second word instead of keeping it as part of the
last name.

## The fix

```python
last = " ".join(parts[1:]) if len(parts) > 1 else ""
```

## How to spot this pattern faster

- Indexing directly into a list built from user input (`parts[1]`,
  `parts[2]`, etc.) without checking the list's length first is a common
  source of `IndexError` — always ask "what's the minimum number of
  elements this could have?"
- "First and last name" as a data model quietly assumes exactly two
  words. Real names don't follow that pattern — test with a single-word
  name and a name with a middle name to catch assumptions like this.
- `parts[1:]` (a slice) never raises `IndexError` even if the list is
  too short — it just returns an empty list. Prefer slicing over direct
  indexing when you're not certain the index exists.
