def is_feature_enabled(flag_value):
    """Return True only if flag_value is the string "true" (any case)."""
    return bool(flag_value)  # BUG: any non-empty string is truthy, including "false"
