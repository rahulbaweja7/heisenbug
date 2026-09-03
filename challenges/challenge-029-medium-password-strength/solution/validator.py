from src.rules import has_min_length, has_digit, has_uppercase


def is_strong_password(password):
    """Return True only if the password passes every rule."""
    return has_min_length(password) and has_digit(password) and has_uppercase(password)
