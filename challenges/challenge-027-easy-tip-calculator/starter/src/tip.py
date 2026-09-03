def calculate_total_with_tip(bill, tip_percent):
    """Return the bill plus a tip of tip_percent percent."""
    return bill + (bill * tip_percent)  # BUG: treats tip_percent as a fraction, not a percentage
