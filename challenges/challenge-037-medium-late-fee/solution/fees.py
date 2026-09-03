FEE_PER_DAY = 0.50


def calculate_late_fee(loan, today):
    """Charge FEE_PER_DAY for each day strictly after due_day."""
    days_overdue = max(0, today - loan.due_day)
    return days_overdue * FEE_PER_DAY
