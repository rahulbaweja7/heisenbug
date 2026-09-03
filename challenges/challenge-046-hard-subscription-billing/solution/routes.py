from src.renewal_service import renew_subscription, RenewalDeniedError


def handle_renewal_request(sub_id, repository):
    try:
        renew_subscription(sub_id, repository)
        return {"status": "renewed", "subscription_id": sub_id}
    except RenewalDeniedError as e:
        return {"status": "denied", "reason": str(e)}
    except KeyError:
        return {"status": "error", "reason": "subscription not found"}
