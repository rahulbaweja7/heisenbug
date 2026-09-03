def split_full_name(full_name):
    """Split a full name into (first_name, last_name)."""
    parts = full_name.split()
    first = parts[0]
    last = " ".join(parts[1:]) if len(parts) > 1 else ""
    return first, last
