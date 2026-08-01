import pytest
from application.dto.career_ai_schema import ATSAnalysis, ResumeChange
from pydantic import ValidationError


def test_ats_score_accepts_zero_to_one_hundred() -> None:
    analysis = ATSAnalysis(
        match_score=78.5,
        missing_keywords=["Kubernetes"],
        suggestions=["Add supported deployment experience"],
        strengths=["Strong Python experience"],
        weaknesses=["Cloud experience is not shown"],
    )

    assert analysis.match_score == 78.5


@pytest.mark.parametrize("score", [-0.1, 100.1])
def test_ats_score_rejects_out_of_range_values(score: float) -> None:
    with pytest.raises(ValidationError):
        ATSAnalysis(
            match_score=score,
            missing_keywords=[],
            suggestions=[],
            strengths=[],
            weaknesses=[],
        )


def test_resume_change_rejects_unknown_operation() -> None:
    with pytest.raises(ValidationError):
        ResumeChange(
            section="skills",
            operation="renamed",
            before="Python",
            after="Python 3",
            reason="Invalid operation",
        )
