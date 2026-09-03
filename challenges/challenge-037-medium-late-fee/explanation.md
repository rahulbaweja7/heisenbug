# Late Fees Charge for a Day That Isn't Overdue

## The bug

```python
days_overdue = max(0, today - loan.due_day + 1)
```

The `+ 1` inflates the day count by one — a book due on day 10 returned
exactly on day 10 (`today - due_day == 0`) still computes
`0 + 1 = 1` day overdue, charging a fee on the very day it was due. The
"strictly after" rule means the due day itself should never count.

## The fix

```python
days_overdue = max(0, today - loan.due_day)
```

## How to spot this pattern faster

- `loan.py`'s `Loan` class is a plain data holder — the entire bug lives
  in the day-count arithmetic inside `fees.py`. When a symptom is "off by
  exactly one day/unit," the extra `+ 1` (or missing `- 1`) is usually
  sitting right next to the subtraction that computes the difference.
- Trace the exact due-day case by hand: `today == due_day` should always
  produce `0` overdue days for a "strictly after" rule. If your formula
  gives anything else on that exact input, the arithmetic is wrong.
- Test the due day itself explicitly, not just a day clearly before or
  clearly after it — the due-day boundary is the only input that exposes
  this specific off-by-one.
