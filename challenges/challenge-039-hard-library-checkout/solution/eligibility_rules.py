MAX_BOOKS_ALLOWED = 5


def is_eligible(patron, book, repository):
    has_overdue = repository.has_overdue_books(patron.id)
    at_limit = patron.books_checked_out >= MAX_BOOKS_ALLOWED
    book_available = book.copies_available > 0
    return (not has_overdue and not at_limit) and book_available
