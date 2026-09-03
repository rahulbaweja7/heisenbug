def remove_extension(filename):
    """Strip only the final extension from a filename."""
    if "." not in filename:
        return filename
    return filename.rsplit(".", 1)[0]
