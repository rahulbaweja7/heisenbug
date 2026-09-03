from src.models import Passenger, Flight
from src.repository import FlightRepository
from src.routes import handle_upgrade_request


def make_repo(loyalty_tier="gold", no_show_count=0, upgrade_seats_available=3):
    repo = FlightRepository()
    repo.add_passenger(Passenger("p1", loyalty_tier, no_show_count))
    repo.add_flight(Flight("f1", upgrade_seats_available))
    return repo


def test_eligible_passenger_gets_upgrade():
    repo = make_repo()
    result = handle_upgrade_request("p1", "f1", repo)
    assert result["status"] == "approved"


def test_passenger_with_no_shows_is_denied():
    repo = make_repo(no_show_count=2)
    result = handle_upgrade_request("p1", "f1", repo)
    assert result["status"] == "denied"


def test_silver_tier_passenger_is_denied():
    repo = make_repo(loyalty_tier="silver")
    result = handle_upgrade_request("p1", "f1", repo)
    assert result["status"] == "denied"


def test_no_seats_available_is_denied():
    repo = make_repo(upgrade_seats_available=0)
    result = handle_upgrade_request("p1", "f1", repo)
    assert result["status"] == "denied"


def test_denied_passenger_does_not_decrement_seats():
    repo = make_repo(loyalty_tier="silver")
    handle_upgrade_request("p1", "f1", repo)
    assert repo.flights["f1"].upgrade_seats_available == 3
    assert repo.passengers["p1"].upgrades_used == 0


def test_approved_passenger_increments_upgrades_used_once():
    repo = make_repo()
    handle_upgrade_request("p1", "f1", repo)
    assert repo.passengers["p1"].upgrades_used == 1
    assert repo.flights["f1"].upgrade_seats_available == 2
