def categorize_transaction(amount):
    """Categorize a transaction as "refund", "purchase", or "zero"."""
    if amount > 0:
        return "purchase"
    elif amount < 0:
        return "refund"
    else:
        return "zero"
