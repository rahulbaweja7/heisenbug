class NotificationPreferences:
    def __init__(self, enabled_channels):
        self.enabled_channels = set(enabled_channels)

    def is_enabled(self, channel):
        return channel in self.enabled_channels
