def get_page_items(items, page, page_size):
    """Return the items for the given 1-indexed page."""
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]
