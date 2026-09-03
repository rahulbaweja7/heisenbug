# Solution

## Approach

`slugify()` replaced spaces with hyphens but never lowercased the text,
so capitalized titles produced mixed-case slugs. Adding `.lower()` before
the replace fixes it; `article.py` was already using `slugify()`
correctly and needed no changes.

## Solution

```python
def slugify(text):
    """Turn text into a lowercase, hyphenated URL slug."""
    return text.lower().replace(" ", "-")
```

## Why this works

`.lower()` normalizes the entire string to lowercase first, so
`"Hello World"` becomes `"hello world"` before the space-to-hyphen
replacement runs, producing the consistent `"hello-world"` slug regardless
of how the original title was capitalized.
