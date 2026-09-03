REGULAR_HOURS_CAP = 40
OVERTIME_MULTIPLIER = 1.5


def calculate_weekly_pay(timesheet, hourly_rate):
    """Pay the regular rate for the first 40 hours, 1.5x for hours beyond."""
    hours = timesheet.hours_worked
    if hours > REGULAR_HOURS_CAP:
        overtime_hours = hours - REGULAR_HOURS_CAP
        return (REGULAR_HOURS_CAP * hourly_rate) + (overtime_hours * hourly_rate * OVERTIME_MULTIPLIER)
    return hours * hourly_rate
