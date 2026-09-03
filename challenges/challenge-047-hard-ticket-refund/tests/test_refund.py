from src.models import Event, Ticket
from src.repository import TicketRepository
from src.routes import handle_refund_request


def make_repo(used=False, purchase_days_ago=5, days_until_event=30):
    repo = TicketRepository()
    repo.add_event(Event("e1", days_until_event))
    repo.add_ticket(Ticket("t1", "e1", used, purchase_days_ago))
    return repo


def test_old_purchase_with_distant_event_is_denied():
    repo = make_repo(purchase_days_ago=20, days_until_event=30)
    result = handle_refund_request("t1", repo)
    assert result["status"] == "denied"


def test_recent_purchase_with_near_event_is_refundable():
    repo = make_repo(purchase_days_ago=5, days_until_event=2)
    result = handle_refund_request("t1", repo)
    assert result["status"] == "refunded"


def test_used_ticket_is_denied():
    repo = make_repo(used=True)
    result = handle_refund_request("t1", repo)
    assert result["status"] == "denied"


def test_event_already_started_is_denied():
    repo = make_repo(days_until_event=0)
    result = handle_refund_request("t1", repo)
    assert result["status"] == "denied"


def test_denied_refund_does_not_mark_refunded():
    repo = make_repo(used=True)
    handle_refund_request("t1", repo)
    assert repo.tickets["t1"].refunded is False
    assert repo.events["e1"].refunds_issued_count == 0


def test_approved_refund_marks_refunded_and_increments_count():
    repo = make_repo(purchase_days_ago=5, days_until_event=30)
    handle_refund_request("t1", repo)
    assert repo.tickets["t1"].refunded is True
    assert repo.events["e1"].refunds_issued_count == 1
