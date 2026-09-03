from src.models import CheckoutRecord


class LibraryRepository:
    def __init__(self, patrons=None, books=None, checkouts=None):
        self.patrons = patrons or {}
        self.books = books or {}
        self.checkouts = checkouts or []

    def add_patron(self, patron):
        self.patrons[patron.id] = patron

    def add_book(self, book):
        self.books[book.id] = book

    def has_overdue_books(self, patron_id):
        return any(c.patron_id == patron_id and c.overdue for c in self.checkouts)

    def record_checkout(self, patron_id, book_id):
        self.checkouts.append(CheckoutRecord(patron_id, book_id))
