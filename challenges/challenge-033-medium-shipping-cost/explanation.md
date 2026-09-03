# Heavy Packages Get the Wrong Shipping Rate

## The bug

```python
if weight_kg < max_weight:
```

Tiers are documented as inclusive of their upper bound (e.g. "up to and
including 1kg" gets the first tier's rate), but `<` excludes a package
weighing exactly `max_weight`. A 1kg package falls through to the next,
more expensive tier instead of getting the first tier's rate.

## The fix

```python
if weight_kg <= max_weight:
```

## How to spot this pattern faster

- Tier/bracket systems (shipping rates, tax brackets, pricing plans)
  almost always define their boundaries as inclusive on one side — read
  the spec carefully to see which side, and match the comparison operator
  to it exactly.
- `rates.py`'s `RATE_TIERS` data itself was fine — the bug was purely in
  how `shipping.py` compared against it. Don't assume a "wrong pricing"
  bug lives in the price table; it might be in the lookup logic instead.
- Test at least one weight that lands exactly on a tier boundary — a test
  suite using only weights strictly inside or between boundaries can't
  catch an off-by-one comparison bug like this.
