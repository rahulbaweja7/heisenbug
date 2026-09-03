# Solution

## Approach

`upgrade_rules.py` needs the no-show comparison flipped to `== 0`, and
`upgrade_service.py` needs the seat/usage mutations moved after the
eligibility check.

## Solution

```python
# upgrade_rules.py
def is_upgrade_eligible(passenger, flight):
    good_tier = passenger.loyalty_tier in ELIGIBLE_TIERS
    no_show_ok = passenger.no_show_count == 0
    seat_available = flight.upgrade_seats_available > 0
    return good_tier and no_show_ok and seat_available
```

```python
# upgrade_service.py
def request_upgrade(passenger_id, flight_id, repository):
    passenger = repository.passengers[passenger_id]
    flight = repository.flights[flight_id]

    if not is_upgrade_eligible(passenger, flight):
        raise UpgradeDeniedError(f"Passenger {passenger_id} is not eligible for upgrade")

    flight.upgrade_seats_available -= 1
    passenger.upgrades_used += 1

    return True
```

## Why this works

`== 0` correctly requires a clean no-show record. Checking eligibility
before touching `flight.upgrade_seats_available` or
`passenger.upgrades_used` means a denied request leaves both counters
untouched.
