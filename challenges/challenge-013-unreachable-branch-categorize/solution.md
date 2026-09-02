# Solution

## Approach

The first condition, `amount != 0`, matched both positive and negative
amounts — it only excluded zero — so every non-zero transaction was
categorized as `"purchase"`, and the `elif amount < 0` branch was
permanently unreachable dead code. Each branch's condition needs to
describe exactly the case it's meant to handle: `amount > 0` for
purchases, `amount < 0` for refunds, and zero falls through to the
`else`.

## Solution

```python
def categorize_transaction(amount):
    """Categorize a transaction as "refund", "purchase", or "zero"."""
    if amount > 0:
        return "purchase"
    elif amount < 0:
        return "refund"
    else:
        return "zero"
```

## Why this works

The three conditions are now mutually exclusive and together cover every
possible value: positive, negative, or exactly zero — each transaction
lands in exactly one correct branch.
