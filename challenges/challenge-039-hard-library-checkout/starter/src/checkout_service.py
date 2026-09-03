from src.eligibility_rules import is_eligible


class CheckoutDeniedError(Exception):
    pass


def checkout_book(patron_id, book_id, repository):
    patron = repository.patrons[patron_id]
    book = repository.books[book_id]

    book.copies_available -= 1
    repository.record_checkout(patron_id, book_id)
    patron.books_checked_out += 1

    if not is_eligible(patron, book, repository):
        raise CheckoutDeniedError(f"Patron {patron_id} is not eligible to check out {book_id}")

    return True
