class InsuranceRepository:
    def __init__(self, policies=None, claims=None):
        self.policies = policies or {}
        self.claims = claims or []

    def add_policy(self, policy):
        self.policies[policy.id] = policy
