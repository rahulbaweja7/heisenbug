from src.queue import sort_oldest_first


def make_tickets(times):
    return [{"id": i, "created_at": t} for i, t in enumerate(times)]


def test_oldest_first_order():
    tickets = make_tickets([3, 1, 2])
    result = sort_oldest_first(tickets)
    assert [t["created_at"] for t in result] == [1, 2, 3]


def test_already_sorted():
    tickets = make_tickets([1, 2, 3])
    result = sort_oldest_first(tickets)
    assert [t["created_at"] for t in result] == [1, 2, 3]


def test_single_ticket():
    tickets = make_tickets([5])
    assert sort_oldest_first(tickets) == tickets
