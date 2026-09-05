def paginate(items, page):
    try:
        if isinstance(page, bool) or (isinstance(page, float) and (not page.is_integer())):
            raise ValueError
        page = int(page)
    except (TypeError, ValueError):
        page = 1
    total = max(1, (len(items) + 1) // 2)
    if page < 1 or page > total:
        page = 1
    return (items[(page - 1) * 2:page * 2], total, page)
