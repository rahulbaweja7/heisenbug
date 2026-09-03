from src.models import Applicant
from src.repository import LoanRepository
from src.routes import handle_loan_request


def make_repo(credit_score=700, annual_income=60000, existing_debt=15000, employment_verified=True):
    repo = LoanRepository()
    repo.add_applicant(Applicant("a1", credit_score, annual_income, existing_debt, employment_verified))
    return repo


def test_qualified_applicant_is_approved():
    repo = make_repo()
    result = handle_loan_request("a1", "app1", 20000, repo)
    assert result["status"] == "approved"


def test_high_dti_applicant_is_denied():
    repo = make_repo(existing_debt=50000)
    result = handle_loan_request("a1", "app1", 20000, repo)
    assert result["status"] == "denied"


def test_low_credit_score_applicant_is_denied():
    repo = make_repo(credit_score=500)
    result = handle_loan_request("a1", "app1", 20000, repo)
    assert result["status"] == "denied"


def test_unverified_employment_applicant_is_denied():
    repo = make_repo(employment_verified=False)
    result = handle_loan_request("a1", "app1", 20000, repo)
    assert result["status"] == "denied"


def test_denied_applicant_does_not_increment_active_loans():
    repo = make_repo(credit_score=500)
    handle_loan_request("a1", "app1", 20000, repo)
    assert repo.applicants["a1"].active_loans_count == 0


def test_approved_applicant_increments_active_loans_exactly_once():
    repo = make_repo()
    handle_loan_request("a1", "app1", 20000, repo)
    assert repo.applicants["a1"].active_loans_count == 1
