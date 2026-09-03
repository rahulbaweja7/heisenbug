from src.timesheet import Timesheet
from src.payroll import calculate_weekly_pay


def test_no_overtime():
    ts = Timesheet("alice", 35)
    assert calculate_weekly_pay(ts, 20) == 700.0


def test_exactly_forty_hours_no_overtime():
    ts = Timesheet("alice", 40)
    assert calculate_weekly_pay(ts, 20) == 800.0


def test_with_overtime():
    ts = Timesheet("alice", 45)
    assert calculate_weekly_pay(ts, 20) == 950.0
