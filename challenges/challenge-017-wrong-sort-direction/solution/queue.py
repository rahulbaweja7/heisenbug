def sort_oldest_first(tickets):
    """Return tickets sorted with the oldest (lowest created_at) first."""
    return sorted(tickets, key=lambda t: t["created_at"])
