# Checkout Accepts Coupons That Already Expired

## The bug

```python
return today >= coupon.expires_on
```

This is backwards. A coupon should be valid when `today` is on or
**before** the expiration date — but `>=` returns `True` only when
`today` is on or **after** it, which is exactly the expired case. A
coupon expiring in 50 days gets rejected today, while a coupon that
expired last month is happily accepted.

## The fix

```python
return today <= coupon.expires_on
```

## How to spot this pattern faster

- `coupons.py`'s `Coupon` class was fine — the entire bug was a single
  flipped comparison operator in `checkout.py`. Always check the simplest
  possible cause (one operator) before assuming a multi-file bug needs a
  multi-file fix.
- Read comparisons as plain English and check them against the spec
  sentence by sentence: `today >= expires_on` reads as "today is on or
  after expiration" — the opposite of "on or before."
- Test both directions explicitly: a coupon that's clearly still valid
  *and* one that's clearly expired. Testing only one side can't catch a
  fully-reversed comparison, since a reversed check still "works" for
  roughly half of all possible inputs by coincidence.
