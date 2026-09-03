def order_tasks(tasks):
    """Return tasks sorted with the highest priority first."""
    return sorted(tasks, key=lambda t: t.priority, reverse=True)
