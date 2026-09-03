class Policy:
    def __init__(self, policy_id, coverage_limit, coverage_window_days, claims_filed_count=0):
        self.id = policy_id
        self.coverage_limit = coverage_limit
        self.coverage_window_days = coverage_window_days
        self.claims_filed_count = claims_filed_count


class Claim:
    def __init__(self, claim_id, policy_id, amount, days_since_incident):
        self.id = claim_id
        self.policy_id = policy_id
        self.amount = amount
        self.days_since_incident = days_since_incident
