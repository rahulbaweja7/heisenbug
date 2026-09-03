from src.batching import chunk_list


def test_even_split():
    assert chunk_list([1, 2, 3, 4], 2) == [[1, 2], [3, 4]]


def test_uneven_split_last_chunk_smaller():
    assert chunk_list([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]


def test_no_items_repeated_across_chunks():
    chunks = chunk_list([1, 2, 3, 4, 5, 6], 3)
    flattened = [item for chunk in chunks for item in chunk]
    assert flattened == [1, 2, 3, 4, 5, 6]
