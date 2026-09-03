from src.models import Order, Warehouse
from src.repository import FulfillmentRepository
from src.routes import handle_fulfillment_request


def make_repo(quantity=5, shipping_zone="west", fraud_flagged=False, stock_available=10):
    repo = FulfillmentRepository()
    repo.add_order(Order("o1", quantity, shipping_zone, fraud_flagged))
    repo.add_warehouse(Warehouse("w1", stock_available, ["west", "east"]))
    return repo


def test_valid_order_is_fulfilled():
    repo = make_repo()
    result = handle_fulfillment_request("o1", "w1", repo)
    assert result["status"] == "fulfilled"


def test_fraud_flagged_order_is_denied():
    repo = make_repo(fraud_flagged=True)
    result = handle_fulfillment_request("o1", "w1", repo)
    assert result["status"] == "denied"


def test_unsupported_zone_order_is_denied():
    repo = make_repo(shipping_zone="north")
    result = handle_fulfillment_request("o1", "w1", repo)
    assert result["status"] == "denied"


def test_insufficient_stock_order_is_denied():
    repo = make_repo(quantity=20, stock_available=10)
    result = handle_fulfillment_request("o1", "w1", repo)
    assert result["status"] == "denied"


def test_denied_order_does_not_decrement_stock():
    repo = make_repo(quantity=20, stock_available=10)
    handle_fulfillment_request("o1", "w1", repo)
    assert repo.warehouses["w1"].stock_available == 10
    assert repo.warehouses["w1"].orders_fulfilled_count == 0


def test_fulfilled_order_decrements_stock_and_increments_count():
    repo = make_repo()
    handle_fulfillment_request("o1", "w1", repo)
    assert repo.warehouses["w1"].stock_available == 5
    assert repo.warehouses["w1"].orders_fulfilled_count == 1
