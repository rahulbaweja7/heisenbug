from src.moderation_service import review_post


def handle_moderation_request(post_id, repository):
    if post_id not in repository.posts:
        return {"status": "error", "reason": "post not found"}

    flagged = review_post(post_id, repository)
    return {"status": "flagged" if flagged else "clean", "post_id": post_id}
