from src.moderation_rules import should_flag


def review_post(post_id, repository):
    post = repository.posts[post_id]

    repository.stats.total_flags += 1

    flagged = should_flag(post)
    post.flagged = flagged
    return flagged
