# Discount Eligibility Off By a Sign

## The bug

```python
if quantity <= 10:
    return quantity * unit_price
```

The spec says "10 or more units" get the discount, so quantity `10` should
fall into the discount branch. `<=` routes it into the no-discount branch
instead — the boundary value is on the wrong side of the comparison.

## The fix

```python
if quantity < 10:
    return quantity * unit_price
```

## How to spot this pattern faster

- Any time a spec uses "or more" / "or fewer" / "at least" / "up to", write
  out the boundary value by hand and check which branch it lands in before
  trusting the comparison operator.
- `<` vs `<=` (and `>` vs `>=`) bugs are invisible unless a test exercises the
  exact boundary — always write a test for the boundary value itself, not
  just "clearly above" and "clearly below" cases.
- Read comparisons as English sentences: `quantity <= 10` reads as "quantity
  is 10 or less" — say it out loud and compare it to what the spec actually
  says.
