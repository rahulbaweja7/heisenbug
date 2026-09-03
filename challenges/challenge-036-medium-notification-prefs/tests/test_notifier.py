from src.preferences import NotificationPreferences
from src.notifier import should_send


def test_enabled_channel_sends():
    prefs = NotificationPreferences(["email", "sms"])
    assert should_send(prefs, "email") is True


def test_disabled_channel_does_not_send():
    prefs = NotificationPreferences(["email"])
    assert should_send(prefs, "sms") is False


def test_no_channels_enabled():
    prefs = NotificationPreferences([])
    assert should_send(prefs, "email") is False
