from src.loan import Loan
from src.fees import calculate_late_fee


def test_due_today_has_no_fee():
    loan = Loan("Dune", due_day=10)
    assert calculate_late_fee(loan, today=10) == 0.00


def test_two_days_overdue():
    loan = Loan("Dune", due_day=10)
    assert calculate_late_fee(loan, today=12) == 1.00


def test_not_yet_due():
    loan = Loan("Dune", due_day=10)
    assert calculate_late_fee(loan, today=5) == 0.00
