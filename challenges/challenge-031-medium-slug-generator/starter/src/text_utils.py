def slugify(text):
    """Turn text into a lowercase, hyphenated URL slug."""
    return text.replace(" ", "-")  # BUG: doesn't lowercase the text first
