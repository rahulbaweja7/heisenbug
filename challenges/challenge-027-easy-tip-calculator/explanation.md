# Tip Calculator Adds 100x Too Much

## The bug

```python
return bill + (bill * tip_percent)
```

`tip_percent` is meant to be a percentage like `20` (for 20%), not a
fraction like `0.2`. Multiplying the bill directly by `20` adds 20 *times*
the bill instead of 20 *percent* of it — the code never divides by 100 to
convert the percentage into a fraction first.

## The fix

```python
return bill + (bill * tip_percent / 100)
```

## How to spot this pattern faster

- Any time a variable is named `..._percent`, check whether it's being
  used as a raw percentage (20) or expected to already be a fraction
  (0.2) — mixing the two up is one of the most common numeric bugs.
- Sanity-check with an easy example by hand: 20% of $100 should be $20,
  for a $120 total — not $2000.
- Test with a whole, easy-to-verify percentage like 20% first before
  trusting the formula on anything more complex.
