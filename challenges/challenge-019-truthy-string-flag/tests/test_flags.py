from src.flags import is_feature_enabled


def test_true_string():
    assert is_feature_enabled("true") is True


def test_false_string_is_not_enabled():
    assert is_feature_enabled("false") is False


def test_case_insensitive_true():
    assert is_feature_enabled("True") is True


def test_empty_string():
    assert is_feature_enabled("") is False
