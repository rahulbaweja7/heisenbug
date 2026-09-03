class Post:
    def __init__(self, post_id, text, report_count, author_trust_score, flagged=False):
        self.id = post_id
        self.text = text
        self.report_count = report_count
        self.author_trust_score = author_trust_score
        self.flagged = flagged


class ModerationStats:
    def __init__(self, total_flags=0):
        self.total_flags = total_flags
