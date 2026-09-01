def add_unique_tag(tag, existing=None):
    """Return a new list of existing tags plus tag, without duplicates."""
    tags = list(existing) if existing is not None else []
    if tag not in tags:
        tags.append(tag)
    return tags
