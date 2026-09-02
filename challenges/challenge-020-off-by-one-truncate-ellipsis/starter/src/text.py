def truncate_with_ellipsis(text, max_len):
    """Truncate text to max_len total characters, appending "..." if cut."""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."  # BUG: doesn't leave room for the "...", overshoots max_len
