# Two Bugs, Two Layers

## Bug 1: refund window compared against the wrong field

```python
within_window = ticket.purchase_days_ago <= event.days_until_event
```

The 14-day refund window is a fixed policy (`REFUND_WINDOW_DAYS`), but
this compares `purchase_days_ago` against `event.days_until_event`
instead — two unrelated numbers. A ticket bought 20 days ago for an
event that's 30 days away wrongly passes (`20 <= 30`), while a ticket
bought 5 days ago for an event happening in 2 days wrongly fails
(`5 <= 2`).

**Fix:**

```python
within_window = ticket.purchase_days_ago <= REFUND_WINDOW_DAYS
```

## Bug 2: refund state changes before eligibility is known

```python
ticket.refunded = True
event.refunds_issued_count += 1

if not is_refundable(ticket, event):
    raise RefundDeniedError(...)
```

The ticket is marked refunded and the event's counter bumped *before*
checking whether the refund is actually valid. A denied refund still
leaves the ticket marked as refunded.

**Fix:** check `is_refundable` first, and only mutate `ticket` and
`event` state once the refund is confirmed approved.

## How to spot this pattern faster

- When a comparison involves a named constant like `REFUND_WINDOW_DAYS`,
  make sure the constant is actually used in the comparison — it's easy
  to accidentally reach for a similarly-shaped field on a nearby object
  instead.
- Same signature as other challenges in this set: state that represents
  "this happened" should be set after the validation check, not before.
