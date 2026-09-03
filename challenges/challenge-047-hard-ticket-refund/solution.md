# Solution

## Approach

`refund_rules.py` needs the window check compared against
`REFUND_WINDOW_DAYS` instead of `event.days_until_event`, and
`refund_service.py` needs the `refunded`/`refunds_issued_count`
mutations moved after the eligibility check.

## Solution

```python
# refund_rules.py
def is_refundable(ticket, event):
    not_used = not ticket.used
    event_not_started = event.days_until_event > 0
    within_window = ticket.purchase_days_ago <= REFUND_WINDOW_DAYS
    return not_used and event_not_started and within_window
```

```python
# refund_service.py
def refund_ticket(ticket_id, repository):
    ticket = repository.tickets[ticket_id]
    event = repository.events[ticket.event_id]

    if not is_refundable(ticket, event):
        raise RefundDeniedError(f"Ticket {ticket_id} is not refundable")

    ticket.refunded = True
    event.refunds_issued_count += 1

    return True
```

## Why this works

Comparing `purchase_days_ago` against the fixed `REFUND_WINDOW_DAYS`
constant correctly enforces a 14-day policy regardless of how soon the
event is. Checking eligibility before mutating `ticket.refunded` and
`event.refunds_issued_count` means a denied refund leaves both
untouched.
