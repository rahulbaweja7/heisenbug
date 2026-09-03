# Solution

## Approach

`today - loan.due_day + 1` added an extra day to the count, so a book
returned exactly on its due day was charged for one day overdue instead
of zero. Removing the `+ 1` fixes the arithmetic. `loan.py` needed no
changes.

## Solution

```python
FEE_PER_DAY = 0.50


def calculate_late_fee(loan, today):
    """Charge FEE_PER_DAY for each day strictly after due_day."""
    days_overdue = max(0, today - loan.due_day)
    return days_overdue * FEE_PER_DAY
```

## Why this works

`today - loan.due_day` is exactly the number of days strictly after the
due date (zero when `today` equals `due_day`), and `max(0, ...)` prevents
a negative count for books returned before they're even due.
