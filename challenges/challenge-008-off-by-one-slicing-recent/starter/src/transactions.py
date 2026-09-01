def recent_transactions(transactions, n):
    """Return the last n transactions, in original order."""
    return transactions[-n - 1:-1]  # BUG: off-by-one, drops the latest transaction
