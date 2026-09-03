def is_locked_out(tracker, username):
    """Return True if username has 3 or more recorded failures."""
    return tracker.get_failures(username) >= 3
