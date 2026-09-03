from src.upgrade_service import request_upgrade, UpgradeDeniedError


def handle_upgrade_request(passenger_id, flight_id, repository):
    try:
        request_upgrade(passenger_id, flight_id, repository)
        return {"status": "approved", "passenger_id": passenger_id}
    except UpgradeDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "passenger or flight not found"}
