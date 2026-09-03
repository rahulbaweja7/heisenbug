# Solution

## Approach

`def __init__(self, items=[])` evaluates `[]` once at class-definition
time, so every `ShoppingCart()` created without an explicit `items`
argument shares the same underlying list object — `.add()` on one
instance leaks into every other instance created the same way. The fix
uses the standard `None` sentinel pattern and builds a fresh list per
instance.

## Solution

```python
class ShoppingCart:
    def __init__(self, items=None):
        self.items = list(items) if items is not None else []

    def add(self, item):
        self.items.append(item)
```

## Why this works

`None` is immutable, so it's safe to reuse as a default value across
every call. Inside `__init__`, each instance either gets a fresh empty
list or a *copy* of whatever list was passed in (`list(items)`) — never
the exact same shared object across instances, and never the caller's
original list either.
