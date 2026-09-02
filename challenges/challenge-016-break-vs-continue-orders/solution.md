# Solution

## Approach

`break` exits the loop entirely, so hitting one invalid order stopped the
function from ever looking at anything after it — valid or not. The spec
says invalid orders should be *skipped*, not treated as a stop signal, so
`break` needs to become `continue`.

## Solution

```python
def filter_valid_orders(orders):
    """Return orders whose amount is not None, skipping invalid ones."""
    valid = []
    for order in orders:
        if order["amount"] is None:
            continue
        valid.append(order)
    return valid
```

## Why this works

`continue` skips only the current iteration and moves on to the next
order, so the loop still visits every remaining order in the batch. Valid
orders after an invalid one now get appended just like they should.
