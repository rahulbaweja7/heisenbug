from src.models import Order
from src.repository import OrderRepository
from src.routes import handle_refund_request


def make_repo(**kwargs):
    defaults = dict(
        order_id="o1",
        amount=50,
        days_since_purchase=10,
        item_condition="unopened",
        customer_prior_refunds=0,
    )
    defaults.update(kwargs)
    repo = OrderRepository()
    repo.add_order(Order(**defaults))
    return repo


def test_eligible_order_is_approved():
    repo = make_repo()
    result = handle_refund_request("o1", repo)
    assert result["approved"] is True


def test_order_at_exact_window_boundary_is_approved():
    repo = make_repo(days_since_purchase=30)
    result = handle_refund_request("o1", repo)
    assert result["approved"] is True


def test_order_past_window_is_denied():
    repo = make_repo(days_since_purchase=31)
    result = handle_refund_request("o1", repo)
    assert result["approved"] is False


def test_bad_condition_denied_even_with_no_prior_refunds():
    repo = make_repo(item_condition="used", customer_prior_refunds=0)
    result = handle_refund_request("o1", repo)
    assert result["approved"] is False


def test_denied_order_is_not_marked_refunded_in_repository():
    repo = make_repo(days_since_purchase=31)
    handle_refund_request("o1", repo)
    assert repo.get_order("o1").refunded is False


def test_approved_order_is_marked_refunded_in_repository():
    repo = make_repo()
    handle_refund_request("o1", repo)
    assert repo.get_order("o1").refunded is True
