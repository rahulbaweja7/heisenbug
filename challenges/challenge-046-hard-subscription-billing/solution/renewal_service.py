from src.renewal_rules import is_renewable


class RenewalDeniedError(Exception):
    pass


def renew_subscription(sub_id, repository):
    subscription = repository.subscriptions[sub_id]

    if not is_renewable(subscription):
        raise RenewalDeniedError(f"Subscription {sub_id} cannot be renewed")

    subscription.renewal_count += 1

    return True
