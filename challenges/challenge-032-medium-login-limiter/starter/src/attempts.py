class AttemptTracker:
    def __init__(self, failures={}):  # BUG: mutable default dict shared across instances
        self.failures = failures

    def record_failure(self, username):
        self.failures[username] = self.failures.get(username, 0) + 1

    def get_failures(self, username):
        return self.failures.get(username, 0)
