def is_feature_enabled(flag_value):
    """Return True only if flag_value is the string "true" (any case)."""
    return flag_value.lower() == "true"
