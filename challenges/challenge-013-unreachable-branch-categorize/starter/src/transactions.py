def categorize_transaction(amount):
    """Categorize a transaction as "refund", "purchase", or "zero"."""
    if amount != 0:  # BUG: catches negatives too, so "refund" is never reached
        return "purchase"
    elif amount < 0:
        return "refund"
    else:
        return "zero"
