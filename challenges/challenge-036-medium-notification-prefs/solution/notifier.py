def should_send(prefs, channel):
    """Return True only if the channel is enabled in the user's preferences."""
    return prefs.is_enabled(channel)
