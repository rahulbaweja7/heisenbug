# Solution

## Approach

The spec says "$50 or more" qualifies, which is an inclusive threshold.
`cart_total > 50` excludes exactly `50`, so the fix swaps in `>=`.

## Solution

```python
def qualifies_for_free_shipping(cart_total):
    """Return True if the order qualifies for free shipping (>= $50)."""
    return cart_total >= 50
```

## Why this works

`>=` includes the boundary value itself, so a cart total of exactly `50`
now correctly evaluates to `True`, while anything below `50` still
evaluates to `False`.
