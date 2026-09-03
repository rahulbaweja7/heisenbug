BLOCKED_WORDS = {"spamword", "scamlink"}
REPORT_THRESHOLD = 3
TRUST_THRESHOLD = 20


def should_flag(post):
    too_many_reports = post.report_count >= REPORT_THRESHOLD
    has_blocked_word = any(word in post.text.lower().split() for word in BLOCKED_WORDS)
    low_trust = post.author_trust_score < TRUST_THRESHOLD
    return too_many_reports or has_blocked_word or low_trust
