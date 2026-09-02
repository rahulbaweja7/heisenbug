def merge_config(base, override):
    """Return a new dict merging override into base, without mutating either."""
    merged = dict(base)
    merged.update(override)
    return merged
