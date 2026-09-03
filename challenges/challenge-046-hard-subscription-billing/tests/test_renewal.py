from src.models import Subscription
from src.repository import BillingRepository
from src.routes import handle_renewal_request


def make_repo(cancelled=False, payment_method_valid=True, days_since_due=2):
    repo = BillingRepository()
    repo.add_subscription(Subscription("s1", cancelled, payment_method_valid, days_since_due))
    return repo


def test_valid_subscription_is_renewed():
    repo = make_repo()
    result = handle_renewal_request("s1", repo)
    assert result["status"] == "renewed"


def test_invalid_payment_method_is_denied():
    repo = make_repo(payment_method_valid=False)
    result = handle_renewal_request("s1", repo)
    assert result["status"] == "denied"


def test_cancelled_subscription_is_denied():
    repo = make_repo(cancelled=True)
    result = handle_renewal_request("s1", repo)
    assert result["status"] == "denied"


def test_past_grace_period_is_denied():
    repo = make_repo(days_since_due=10)
    result = handle_renewal_request("s1", repo)
    assert result["status"] == "denied"


def test_denied_renewal_does_not_increment_count():
    repo = make_repo(cancelled=True)
    handle_renewal_request("s1", repo)
    assert repo.subscriptions["s1"].renewal_count == 0


def test_approved_renewal_increments_count_once():
    repo = make_repo()
    handle_renewal_request("s1", repo)
    assert repo.subscriptions["s1"].renewal_count == 1
