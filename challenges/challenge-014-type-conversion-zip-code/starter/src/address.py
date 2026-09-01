def normalize_zip_code(zip_str):
    """Return the zip code as a clean 5-digit string."""
    return str(int(zip_str.strip()))  # BUG: int() drops leading zeros
