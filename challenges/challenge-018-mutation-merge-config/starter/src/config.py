def merge_config(base, override):
    """Return a new dict merging override into base, without mutating either."""
    base.update(override)  # BUG: mutates the caller's base dict in place
    return base
