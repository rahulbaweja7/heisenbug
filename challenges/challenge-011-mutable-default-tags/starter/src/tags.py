def add_unique_tag(tag, existing=[]):  # BUG: mutable default argument
    """Return a new list of existing tags plus tag, without duplicates."""
    if tag not in existing:
        existing.append(tag)
    return existing
