class Patron:
    def __init__(self, patron_id, name, books_checked_out=0):
        self.id = patron_id
        self.name = name
        self.books_checked_out = books_checked_out


class Book:
    def __init__(self, book_id, title, copies_available):
        self.id = book_id
        self.title = title
        self.copies_available = copies_available


class CheckoutRecord:
    def __init__(self, patron_id, book_id, overdue=False):
        self.patron_id = patron_id
        self.book_id = book_id
        self.overdue = overdue
