# Solution

## Approach

The buggy version multiplied *all* hours by 1.5x once the employee went
over 40, instead of only the hours past the cap. The fix splits the total
into regular hours (paid at the normal rate) and overtime hours (paid at
1.5x), then sums both. `timesheet.py` needed no changes.

## Solution

```python
REGULAR_HOURS_CAP = 40
OVERTIME_MULTIPLIER = 1.5


def calculate_weekly_pay(timesheet, hourly_rate):
    """Pay the regular rate for the first 40 hours, 1.5x for hours beyond."""
    hours = timesheet.hours_worked
    if hours > REGULAR_HOURS_CAP:
        overtime_hours = hours - REGULAR_HOURS_CAP
        return (REGULAR_HOURS_CAP * hourly_rate) + (overtime_hours * hourly_rate * OVERTIME_MULTIPLIER)
    return hours * hourly_rate
```

## Why this works

The first 40 hours are always paid at `hourly_rate`, and only
`hours - REGULAR_HOURS_CAP` (the actual overtime hours) get the 1.5x
multiplier — so a 45-hour week correctly pays `40 * rate + 5 * rate *
1.5`, not `45 * rate * 1.5`.
