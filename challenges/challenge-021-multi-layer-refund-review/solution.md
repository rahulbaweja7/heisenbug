# Solution

## Approach

Three independent bugs, spread across two files:

1. **`eligibility_rules.py` — wrong comparison.** `days_since_purchase <
   MAX_RETURN_WINDOW_DAYS` excludes day 30 itself, even though the window
   is meant to be inclusive.
2. **`eligibility_rules.py` — wrong boolean grouping.**
   `within_window and good_condition or under_refund_limit` relies on
   `and` binding tighter than `or`, so a customer under their refund
   limit gets approved regardless of window or item condition. All three
   checks need to be joined with `and`.
3. **`refund_service.py` — side effect in the wrong place.**
   `repository.mark_refunded(order_id)` ran before the eligibility check,
   so denied orders were incorrectly flagged as refunded. Moving it inside
   the `if is_eligible(order):` branch fixes it.

## Solution

`src/eligibility_rules.py`:

```python
MAX_RETURN_WINDOW_DAYS = 30
MAX_PRIOR_REFUNDS = 3
ACCEPTABLE_CONDITIONS = {"unopened", "defective"}


def is_eligible(order):
    """An order is eligible for refund only if it's within the return
    window, the item is in acceptable condition, AND the customer hasn't
    exceeded their prior-refund limit."""
    within_window = order.days_since_purchase <= MAX_RETURN_WINDOW_DAYS
    good_condition = order.item_condition in ACCEPTABLE_CONDITIONS
    under_refund_limit = order.customer_prior_refunds < MAX_PRIOR_REFUNDS
    return within_window and good_condition and under_refund_limit
```

`src/refund_service.py`:

```python
from src.eligibility_rules import is_eligible
from src.models import RefundDecision


def process_refund(order_id, repository):
    """Look up the order, decide eligibility, and mark it refunded in the
    repository only if the refund is approved."""
    order = repository.get_order(order_id)
    if order is None:
        return RefundDecision(False, "order not found")

    if is_eligible(order):
        repository.mark_refunded(order_id)
        return RefundDecision(True, "approved")
    return RefundDecision(False, "not eligible")
```

`src/models.py`, `src/repository.py`, and `src/routes.py` didn't need any
changes — the bugs were isolated to the rules and service layers.

## Why this works

`<=` makes the window boundary inclusive, matching "within 30 days."
Joining all three checks with `and` means every single condition has to
hold for a refund to be approved — no one condition can override the
others. And moving the mutating `mark_refunded` call inside the
`is_eligible` branch means the repository's state only ever changes as a
direct consequence of an approved decision, never before that decision is
made.
