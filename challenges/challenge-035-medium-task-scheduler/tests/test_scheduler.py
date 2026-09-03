from src.task import Task
from src.scheduler import order_tasks


def test_highest_priority_first():
    tasks = [Task("low", 1), Task("high", 10), Task("mid", 5)]
    ordered = order_tasks(tasks)
    assert [t.name for t in ordered] == ["high", "mid", "low"]


def test_already_ordered():
    tasks = [Task("a", 3), Task("b", 2), Task("c", 1)]
    ordered = order_tasks(tasks)
    assert [t.priority for t in ordered] == [3, 2, 1]


def test_single_task():
    tasks = [Task("only", 5)]
    assert order_tasks(tasks) == tasks
