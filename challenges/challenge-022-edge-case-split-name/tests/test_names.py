from src.names import split_full_name


def test_two_word_name():
    assert split_full_name("Ada Lovelace") == ("Ada", "Lovelace")


def test_single_word_name():
    assert split_full_name("Madonna") == ("Madonna", "")


def test_three_word_name_joins_the_rest():
    assert split_full_name("Mary Jane Watson") == ("Mary", "Jane Watson")
