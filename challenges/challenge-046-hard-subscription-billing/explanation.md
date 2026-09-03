# Two Bugs, Two Layers

## Bug 1: an extra `not` inverts the payment-method check

```python
payment_ok = not subscription.payment_method_valid
```

`payment_method_valid` is already a boolean that reads correctly on
its own — negating it flips the meaning. A subscription with a valid
payment method (`payment_method_valid = True`) ends up with
`payment_ok = False` and gets denied, while an invalid payment method
reads as `payment_ok = True` and sails through.

**Fix:**

```python
payment_ok = subscription.payment_method_valid
```

## Bug 2: `renewal_count` increments before the decision is known

```python
subscription.renewal_count += 1

if not is_renewable(subscription):
    raise RenewalDeniedError(...)
```

The renewal count is bumped unconditionally before checking whether
the subscription is actually renewable. A denied renewal still
increments the count as if it succeeded.

**Fix:** check `is_renewable` first, and only increment
`renewal_count` once the renewal is confirmed to go through.

## How to spot this pattern faster

- When a field is already a clean boolean (`payment_method_valid`),
  be suspicious of any `not` applied to it before assigning it to
  another boolean — check whether the negation is actually warranted.
- Same signature as other challenges in this set: a counter meant to
  track a successful outcome should be updated after the outcome is
  known, not before.
