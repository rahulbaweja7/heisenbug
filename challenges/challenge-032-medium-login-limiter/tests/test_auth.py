from src.attempts import AttemptTracker
from src.auth import is_locked_out


def test_locks_out_after_three_failures():
    tracker = AttemptTracker()
    for _ in range(3):
        tracker.record_failure("alice")
    assert is_locked_out(tracker, "alice") is True


def test_second_tracker_does_not_see_first_trackers_failures():
    tracker1 = AttemptTracker()
    tracker1.record_failure("alice")
    tracker1.record_failure("alice")
    tracker1.record_failure("alice")

    tracker2 = AttemptTracker()
    assert is_locked_out(tracker2, "alice") is False


def test_different_users_are_independent():
    tracker = AttemptTracker()
    tracker.record_failure("alice")
    tracker.record_failure("alice")
    tracker.record_failure("alice")
    assert is_locked_out(tracker, "bob") is False
