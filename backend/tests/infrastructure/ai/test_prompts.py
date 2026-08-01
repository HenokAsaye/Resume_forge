import pytest
from application.services.prompts import get_prompt, load_prompts


def test_prompt_catalog_contains_every_ai_feature() -> None:
    assert set(load_prompts()) == {
        "resume_parsing",
        "job_parsing",
        "ats_analysis",
        "resume_optimization",
        "cover_letter",
    }


def test_prompt_renders_runtime_input() -> None:
    rendered = get_prompt("resume_parsing").render(
        resume_text="Backend engineer with {Python} experience"
    )

    assert "Backend engineer with {Python} experience" in rendered
    assert "{resume_text}" not in rendered


def test_prompt_rejects_missing_template_value() -> None:
    with pytest.raises(ValueError, match="Missing value"):
        get_prompt("job_parsing").render()
