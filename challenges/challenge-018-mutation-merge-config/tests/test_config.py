from src.config import merge_config


def test_override_values_win():
    result = merge_config({"timeout": 30, "retries": 3}, {"timeout": 60})
    assert result == {"timeout": 60, "retries": 3}


def test_base_is_not_mutated():
    base = {"timeout": 30, "retries": 3}
    merge_config(base, {"timeout": 60})
    assert base == {"timeout": 30, "retries": 3}


def test_override_is_not_mutated():
    override = {"timeout": 60}
    merge_config({"timeout": 30}, override)
    assert override == {"timeout": 60}
