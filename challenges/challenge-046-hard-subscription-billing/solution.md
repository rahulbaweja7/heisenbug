# Solution

## Approach

`renewal_rules.py` needs the stray `not` removed from the payment
check, and `renewal_service.py` needs the `renewal_count` increment
moved after the renewability check.

## Solution

```python
# renewal_rules.py
def is_renewable(subscription):
    not_cancelled = not subscription.cancelled
    payment_ok = subscription.payment_method_valid
    within_grace = subscription.days_since_due <= GRACE_PERIOD_DAYS
    return not_cancelled and payment_ok and within_grace
```

```python
# renewal_service.py
def renew_subscription(sub_id, repository):
    subscription = repository.subscriptions[sub_id]

    if not is_renewable(subscription):
        raise RenewalDeniedError(f"Subscription {sub_id} cannot be renewed")

    subscription.renewal_count += 1

    return True
```

## Why this works

Removing the stray `not` makes `payment_ok` track the payment
method's actual validity. Checking `is_renewable` before incrementing
`renewal_count` means a denied renewal leaves the count untouched.
