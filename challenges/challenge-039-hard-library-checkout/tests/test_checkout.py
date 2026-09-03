from src.models import Patron, Book, CheckoutRecord
from src.repository import LibraryRepository
from src.routes import handle_checkout_request


def make_repo():
    repo = LibraryRepository()
    repo.add_patron(Patron("p1", "Alice", books_checked_out=0))
    repo.add_book(Book("b1", "Dune", copies_available=2))
    return repo


def test_eligible_patron_can_checkout():
    repo = make_repo()
    result = handle_checkout_request("p1", "b1", repo)
    assert result["status"] == "success"
    assert repo.books["b1"].copies_available == 1
    assert repo.patrons["p1"].books_checked_out == 1


def test_patron_at_book_limit_is_denied():
    repo = make_repo()
    repo.patrons["p1"].books_checked_out = 5
    result = handle_checkout_request("p1", "b1", repo)
    assert result["status"] == "denied"
    assert repo.books["b1"].copies_available == 2
    assert repo.patrons["p1"].books_checked_out == 5


def test_patron_with_overdue_books_is_denied():
    repo = make_repo()
    repo.checkouts.append(CheckoutRecord("p1", "old-book", overdue=True))
    result = handle_checkout_request("p1", "b1", repo)
    assert result["status"] == "denied"
    assert repo.books["b1"].copies_available == 2


def test_no_copies_available_is_denied():
    repo = make_repo()
    repo.books["b1"].copies_available = 0
    result = handle_checkout_request("p1", "b1", repo)
    assert result["status"] == "denied"


def test_denied_checkout_does_not_mutate_state():
    repo = make_repo()
    repo.patrons["p1"].books_checked_out = 5
    repo.books["b1"].copies_available = 0
    handle_checkout_request("p1", "b1", repo)
    assert len(repo.checkouts) == 0
    assert repo.books["b1"].copies_available == 0
    assert repo.patrons["p1"].books_checked_out == 5
