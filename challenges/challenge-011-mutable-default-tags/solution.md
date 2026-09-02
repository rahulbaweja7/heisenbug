# Solution

## Approach

`def add_unique_tag(tag, existing=[])` evaluates the default `[]` once,
at function-definition time — every call that omits `existing` shares the
exact same list object, and `.append()` mutates it permanently across
calls. The fix uses the standard Python idiom: default to `None`, then
build a fresh list inside the function body on each call.

## Solution

```python
def add_unique_tag(tag, existing=None):
    """Return a new list of existing tags plus tag, without duplicates."""
    tags = list(existing) if existing is not None else []
    if tag not in tags:
        tags.append(tag)
    return tags
```

## Why this works

`None` is immutable and safe to reuse as a default. Each call now either
copies the caller's `existing` list (`list(existing)`) or starts a brand
new empty list — never the same shared object across calls — so no state
leaks between unrelated invocations.
