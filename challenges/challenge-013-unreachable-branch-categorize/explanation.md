# Refunds Get Categorized as Purchases

## The bug

```python
if amount != 0:
    return "purchase"
elif amount < 0:
    return "refund"
```

The first condition, `amount != 0`, is true for *both* positive and
negative amounts — it only excludes zero. That means the function returns
`"purchase"` for every non-zero transaction, and the `elif amount < 0`
branch can never execute. It's not wrong syntax, just dead code: a
perfectly valid `elif` that no input can ever reach.

## The fix

```python
if amount > 0:
    return "purchase"
elif amount < 0:
    return "refund"
else:
    return "zero"
```

Each branch's condition needs to describe exactly the case it's meant to
handle, not a broader condition that happens to include it.

## How to spot this pattern faster

- When reading an `if`/`elif` chain, check whether each condition is
  *mutually exclusive* with the ones before it. If an earlier `if` is
  broader than intended, every branch after it becomes partially or fully
  unreachable — and there's no error, no warning, just silently wrong
  behavior.
- `!= 0` disguised as a "positive check" is an easy typo to make when you
  meant `> 0` — they agree on every positive input, which is exactly why a
  test suite that only tries positive numbers wouldn't catch it.
- Test every logical branch explicitly: here that means at least one
  positive, one negative, and the zero edge case — three inputs, three
  different expected outputs.
