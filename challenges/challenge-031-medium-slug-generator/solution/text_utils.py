def slugify(text):
    """Turn text into a lowercase, hyphenated URL slug."""
    return text.lower().replace(" ", "-")
