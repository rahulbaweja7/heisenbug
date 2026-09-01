# Checkout Snapshot Leaks Into the Live Cart

## The bug

```python
snapshot = self.items
for item in snapshot:
    item["discount_applied"] = False
```

`snapshot = self.items` doesn't copy the list — it just gives `snapshot`
another name for the *same* list object. Mutating `item["discount_applied"]`
inside the loop mutates the dicts that `self.items` also points to, so the
"snapshot for checkout" silently wipes discount state out of the live cart
too.

## The fix

```python
import copy
snapshot = copy.deepcopy(self.items)
```

A shallow `list(self.items)` or `self.items[:]` isn't enough here either —
that copies the list container but the *dicts inside it* would still be the
same shared objects, so mutating `item["discount_applied"]` would still leak
back into the live cart. This needs a deep copy because the mutation reaches
into nested objects, not just the top-level list.

## How to spot this pattern faster

- `x = some_list` is never a copy in Python — it's an alias. If you see a
  variable assigned directly from another list/dict and then mutated, ask
  "who else holds a reference to this same object?"
- Mutating something inside a loop is a red flag. Ask: is this loop supposed
  to build a *new* result, or intentionally change the original in place?
  If it's supposed to be a snapshot/copy, mutation is almost always a bug.
- When the mutation touches nested objects (dicts inside a list), a shallow
  copy won't save you — you need `copy.deepcopy` or to rebuild each nested
  object explicitly.
