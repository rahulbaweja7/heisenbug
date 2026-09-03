# Solution

## Approach

`moderation_rules.py` needs `or` instead of `and` so any single red
flag is enough, and `moderation_service.py` needs the `total_flags`
increment moved after the flagging decision and gated on it.

## Solution

```python
# moderation_rules.py
def should_flag(post):
    too_many_reports = post.report_count >= REPORT_THRESHOLD
    has_blocked_word = any(word in post.text.lower().split() for word in BLOCKED_WORDS)
    low_trust = post.author_trust_score < TRUST_THRESHOLD
    return too_many_reports or has_blocked_word or low_trust
```

```python
# moderation_service.py
def review_post(post_id, repository):
    post = repository.posts[post_id]

    flagged = should_flag(post)
    post.flagged = flagged

    if flagged:
        repository.stats.total_flags += 1

    return flagged
```

## Why this works

`or` lets any single condition trigger a flag, matching the "flag if
any" rule. Deferring the `total_flags` increment until the flag
decision is known, and gating it on `flagged`, keeps the stat accurate.
