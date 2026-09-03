def split_full_name(full_name):
    """Split a full name into (first_name, last_name)."""
    parts = full_name.split()
    first = parts[0]
    last = parts[1]  # BUG: crashes on single-word names, drops words beyond index 1
    return first, last
