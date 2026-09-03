class AttemptTracker:
    def __init__(self, failures=None):
        self.failures = dict(failures) if failures is not None else {}

    def record_failure(self, username):
        self.failures[username] = self.failures.get(username, 0) + 1

    def get_failures(self, username):
        return self.failures.get(username, 0)
