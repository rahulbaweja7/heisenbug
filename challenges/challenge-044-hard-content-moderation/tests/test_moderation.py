from src.models import Post
from src.repository import ModerationRepository
from src.routes import handle_moderation_request


def make_repo(report_count=0, author_trust_score=80, text="a perfectly normal post"):
    repo = ModerationRepository()
    repo.add_post(Post("post1", text, report_count, author_trust_score))
    return repo


def test_high_reports_alone_flags_post():
    repo = make_repo(report_count=5)
    result = handle_moderation_request("post1", repo)
    assert result["status"] == "flagged"


def test_low_trust_alone_flags_post():
    repo = make_repo(author_trust_score=5)
    result = handle_moderation_request("post1", repo)
    assert result["status"] == "flagged"


def test_blocked_word_alone_flags_post():
    repo = make_repo(text="click this spamword deal now")
    result = handle_moderation_request("post1", repo)
    assert result["status"] == "flagged"


def test_all_clear_post_is_not_flagged():
    repo = make_repo()
    result = handle_moderation_request("post1", repo)
    assert result["status"] == "clean"


def test_flag_count_only_increments_for_flagged_posts():
    repo = make_repo()
    handle_moderation_request("post1", repo)
    assert repo.stats.total_flags == 0


def test_flagged_post_sets_flag_and_increments_count():
    repo = make_repo(report_count=5)
    handle_moderation_request("post1", repo)
    assert repo.posts["post1"].flagged is True
    assert repo.stats.total_flags == 1
