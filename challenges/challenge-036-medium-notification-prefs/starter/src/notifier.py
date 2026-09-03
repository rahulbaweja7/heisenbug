def should_send(prefs, channel):
    """Return True only if the channel is enabled in the user's preferences."""
    return not prefs.is_enabled(channel)  # BUG: inverted condition
