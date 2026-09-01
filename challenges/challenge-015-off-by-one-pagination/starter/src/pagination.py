def get_page_items(items, page, page_size):
    """Return the items for the given 1-indexed page."""
    start = page * page_size  # BUG: treats page as 0-indexed
    end = start + page_size
    return items[start:end]
