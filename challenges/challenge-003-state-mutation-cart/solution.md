# Solution

## Approach

`snapshot = self.items` doesn't create a copy — it just gives `snapshot`
another name for the exact same list, and the dicts inside it are shared
too. Mutating `item["discount_applied"]` in the loop mutates the live
cart's data.

A shallow copy (`list(self.items)` or `self.items[:]`) isn't enough
either, since the mutation reaches into the nested item dicts, not just
the outer list. This needs a real deep copy: `copy.deepcopy(self.items)`.

## Solution

```python
import copy


class Cart:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def checkout_snapshot(self):
        """Return a snapshot of the cart to send to checkout, and clear
        applied one-time discounts from the live cart items."""
        snapshot = copy.deepcopy(self.items)
        for item in snapshot:
            item["discount_applied"] = False
        return snapshot
```

## Why this works

`copy.deepcopy` recursively copies both the outer list and every dict
inside it, so `snapshot` is a fully independent structure. Mutating it in
the loop has zero effect on `self.items` — the live cart stays exactly as
it was.
