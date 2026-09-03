# Refund Review System Approves Ineligible Orders

This challenge has **three bugs across two files**, all feeding into the
same end-to-end flow: `routes.py` → `refund_service.py` →
`eligibility_rules.py` → `repository.py`.

## Bug 1: wrong comparison on the return window (`eligibility_rules.py`)

```python
within_window = order.days_since_purchase < MAX_RETURN_WINDOW_DAYS
```

The spec says "within a 30-day window," which is inclusive — day 30
itself should still qualify. `<` excludes exactly `30`.

**Fix:** `order.days_since_purchase <= MAX_RETURN_WINDOW_DAYS`

## Bug 2: wrong boolean grouping (`eligibility_rules.py`)

```python
return within_window and good_condition or under_refund_limit
```

Python evaluates `and` before `or`, so this is actually
`(within_window and good_condition) or under_refund_limit`. Since most
customers are under their refund limit, `under_refund_limit` is `True`
far more often than not — and because it's `or`'d in, it single-handedly
overrides the window and condition checks. An order with a bad item
condition and 0 prior refunds gets approved, which directly contradicts
"all of" in the spec.

**Fix:** `return within_window and good_condition and under_refund_limit`
— every condition must hold, no shortcuts.

## Bug 3: marks the order refunded before checking eligibility (`refund_service.py`)

```python
repository.mark_refunded(order_id)

if is_eligible(order):
    return RefundDecision(True, "approved")
return RefundDecision(False, "not eligible")
```

`mark_refunded` runs *unconditionally*, before the eligibility check even
happens. Even a correctly-denied order gets flagged as refunded in the
repository — a real data-integrity bug that has nothing to do with the
eligibility rules themselves.

**Fix:** move the `mark_refunded` call inside the `if is_eligible(order):`
branch, so it only ever runs when the refund is actually approved.

## How to spot this pattern faster

- **Trace the whole flow before editing anything.** With multiple files,
  a bug in one layer can be masked or amplified by another — Bug 2 alone
  can make an out-of-window order look approved even after you fix Bug 1,
  because `or under_refund_limit` overrides everything upstream of it.
- **Side effects (like `mark_refunded`) should happen after a decision is
  finalized, not before.** Any time you see a mutating call sitting above
  a conditional that determines whether that mutation *should* have
  happened, that ordering is worth double-checking.
- `and`/`or` operator precedence bugs are invisible in a quick read —
  `a and b or c` looks like it might mean "all three," but it doesn't.
  When combining more than two boolean conditions, use explicit
  parentheses even when Python's precedence would technically get it
  right, so the *next* reader doesn't have to recall precedence rules.
