from src.moderation_rules import should_flag


def review_post(post_id, repository):
    post = repository.posts[post_id]

    flagged = should_flag(post)
    post.flagged = flagged

    if flagged:
        repository.stats.total_flags += 1

    return flagged
