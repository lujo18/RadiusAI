from app.features.generate import router as generate_router


def test_resolve_credit_check_fail_open_on_exception():
    def checker(_user_id: str, _slides: int):
        raise RuntimeError("checker unavailable")

    result = generate_router._resolve_credit_check(checker, "user-1", 3)

    assert result["allowed"] is True
    assert result["credits_to_consume"] == 3
    assert result["projected_credits"] == 3


def test_resolve_credit_check_preserves_block_payload():
    def checker(_user_id: str, _slides: int):
        return {
            "allowed": False,
            "message": "blocked",
            "current_credits": "5",
            "credits_to_consume": "2",
            "projected_credits": "7",
            "credit_limit": "6",
            "will_exceed": True,
        }

    result = generate_router._resolve_credit_check(checker, "user-1", 2)

    assert result["allowed"] is False
    assert result["message"] == "blocked"
    assert result["current_credits"] == 5
    assert result["credits_to_consume"] == 2
    assert result["projected_credits"] == 7
    assert result["credit_limit"] == 6
    assert result["will_exceed"] is True


def test_track_usage_best_effort_never_raises():
    def tracker(_user_id: str, _slide_count: int):
        raise ValueError("tracking failed")

    generate_router._track_usage_best_effort(tracker, "user-1", 1)
