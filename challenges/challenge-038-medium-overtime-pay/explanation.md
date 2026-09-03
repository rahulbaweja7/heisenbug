# Overtime Rate Applies to the Whole Paycheck

## The bug

```python
if hours > REGULAR_HOURS_CAP:
    return hours * hourly_rate * OVERTIME_MULTIPLIER
```

Once an employee crosses 40 hours, this multiplies *every* hour they
worked by 1.5x — including the first 40, which should still be paid at
the regular rate. Overtime pay is only supposed to apply to the hours
*beyond* the 40-hour cap, not retroactively boost the whole week.

## The fix

```python
if hours > REGULAR_HOURS_CAP:
    overtime_hours = hours - REGULAR_HOURS_CAP
    return (REGULAR_HOURS_CAP * hourly_rate) + (overtime_hours * hourly_rate * OVERTIME_MULTIPLIER)
```

## How to spot this pattern faster

- `timesheet.py`'s `Timesheet` class just holds data — the entire bug is
  in how `payroll.py` applies the overtime multiplier. Split the hours
  into two buckets (regular and overtime) and pay each bucket at its own
  rate, rather than picking one rate and applying it to the whole total.
- "X applies beyond a threshold" almost always means the calculation
  needs to be split at that threshold, not just gated by an `if` that
  changes the rate for everything.
- Test with hours comfortably above 40 (like 45) and check the exact
  total, not just that it's "higher than the no-overtime case" — a wrong
  total that happens to be bigger than the regular-rate total can slip
  past a loose assertion.
