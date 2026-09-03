# Solution

## Approach

Fix each layer independently: `eligibility_rules.py` needs its boolean
expression parenthesized so all three conditions are required, and
`checkout_service.py` needs to check eligibility *before* touching the
repository instead of after.

## Solution

```python
# eligibility_rules.py
def is_eligible(patron, book, repository):
    has_overdue = repository.has_overdue_books(patron.id)
    at_limit = patron.books_checked_out >= MAX_BOOKS_ALLOWED
    book_available = book.copies_available > 0
    return (not has_overdue and not at_limit) and book_available
```

```python
# checkout_service.py
def checkout_book(patron_id, book_id, repository):
    patron = repository.patrons[patron_id]
    book = repository.books[book_id]

    if not is_eligible(patron, book, repository):
        raise CheckoutDeniedError(f"Patron {patron_id} is not eligible to check out {book_id}")

    book.copies_available -= 1
    repository.record_checkout(patron_id, book_id)
    patron.books_checked_out += 1

    return True
```

## Why this works

Parenthesizing the eligibility expression makes all three conditions
mandatory, matching the plain-English rule. Moving the eligibility
check above the mutations means a denied checkout is a true no-op:
inventory, the patron's checked-out count, and the checkout log are
all left untouched.
