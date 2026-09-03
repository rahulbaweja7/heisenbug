# New Shopping Carts Start With Someone Else's Items

## The bug

```python
def __init__(self, items=[]):
```

Just like function default arguments, a class's `__init__` default
argument is evaluated **once**, when the class is defined — not once per
instance. Every `ShoppingCart()` created without an explicit `items`
argument shares the exact same list object. Calling `.add()` on one cart
mutates that shared list, so every other cart created the same way sees
the change too.

## The fix

```python
def __init__(self, items=None):
    self.items = list(items) if items is not None else []
```

## How to spot this pattern faster

- This is the exact same mutable-default-argument trap as with regular
  functions — it doesn't matter that it's a class constructor instead of
  a plain `def`. Any `def __init__(self, arg=[])` (or `={}`, `=set()`)
  should be treated as an instant bug.
- The symptom only shows up once you create a *second* instance without
  arguments — a test that only ever creates one `ShoppingCart` in
  isolation will never catch it. Always test creating multiple instances
  and check they don't share state.
- `list(items)` (rather than just `items`) also protects against a
  second, subtler bug: if someone *does* pass in an existing list
  explicitly, `.add()` would otherwise mutate their original list too.
  Copying it decouples the cart's internal state from whatever the caller
  passed in.
