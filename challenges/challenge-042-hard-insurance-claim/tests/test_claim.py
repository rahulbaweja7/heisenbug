from src.models import Policy, Claim
from src.repository import InsuranceRepository
from src.routes import handle_claim_request


def make_repo():
    repo = InsuranceRepository()
    repo.add_policy(Policy("pol1", coverage_limit=5000, coverage_window_days=30))
    return repo


def test_claim_at_exact_limit_is_approved():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=5000, days_since_incident=10)
    result = handle_claim_request("pol1", claim, repo)
    assert result["status"] == "approved"


def test_claim_over_limit_is_denied():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=6000, days_since_incident=10)
    result = handle_claim_request("pol1", claim, repo)
    assert result["status"] == "denied"


def test_claim_outside_window_is_denied():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=1000, days_since_incident=40)
    result = handle_claim_request("pol1", claim, repo)
    assert result["status"] == "denied"


def test_denied_claim_does_not_increment_count():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=6000, days_since_incident=10)
    handle_claim_request("pol1", claim, repo)
    assert repo.policies["pol1"].claims_filed_count == 0


def test_approved_claim_increments_count_once():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=1000, days_since_incident=5)
    handle_claim_request("pol1", claim, repo)
    assert repo.policies["pol1"].claims_filed_count == 1


def test_denied_claim_not_recorded_in_repository():
    repo = make_repo()
    claim = Claim("c1", "pol1", amount=6000, days_since_incident=10)
    handle_claim_request("pol1", claim, repo)
    assert len(repo.claims) == 0
