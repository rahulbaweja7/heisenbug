def remove_extension(filename):
    """Strip only the final extension from a filename."""
    return filename.replace(".", "")  # BUG: removes every dot, not just the extension
