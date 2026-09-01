def find_missing_fields(form, required_fields):
    """Return a list of all required fields that are missing or empty
    from the submitted form."""
    missing = []
    for field in required_fields:
        if field not in form or not form[field]:
            missing.append(field)
    return missing
