from src.upgrade_rules import is_upgrade_eligible


class UpgradeDeniedError(Exception):
    pass


def request_upgrade(passenger_id, flight_id, repository):
    passenger = repository.passengers[passenger_id]
    flight = repository.flights[flight_id]

    flight.upgrade_seats_available -= 1
    passenger.upgrades_used += 1

    if not is_upgrade_eligible(passenger, flight):
        raise UpgradeDeniedError(f"Passenger {passenger_id} is not eligible for upgrade")

    return True
