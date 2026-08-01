import pytest
from application.dto.resume_schema import ResumeDocument
from pydantic import ValidationError


def make_resume_data() -> dict[str, object]:
    return {
        "contact": {
            "name": "Henok Asaye",
            "email": "henok@example.com",
            "phone": "+251900000000",
            "location": "Addis Ababa",
            "links": ["https://github.com/henok"],
        },
        "summary": "Backend engineer focused on Python APIs.",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "experience": [
            {
                "title": "Backend Engineer",
                "company": "Acme",
                "start": "2022-01",
                "end": "Present",
                "bullets": ["Built REST APIs using FastAPI."],
            }
        ],
        "education": [
            {
                "degree": "BSc Computer Science",
                "institution": "AAU",
                "start": "2018",
                "end": "2022",
            }
        ],
        "projects": [
            {
                "name": "ResumeAI",
                "description": "AI resume analysis platform.",
                "tech": ["FastAPI", "Next.js"],
            }
        ],
        "certifications": ["AWS Solutions Architect"],
    }


def test_valid_resume_data_is_accepted() -> None:
    resume = ResumeDocument.model_validate(make_resume_data())

    assert resume.contact.name == "Henok Asaye"
    assert resume.skills == ["Python", "FastAPI", "PostgreSQL"]
    assert resume.experience[0].company == "Acme"


def test_unknown_fields_are_rejected() -> None:
    data = make_resume_data()
    data["unexpected_field"] = "not allowed"

    with pytest.raises(ValidationError):
        ResumeDocument.model_validate(data)


def test_missing_required_sections_are_rejected() -> None:
    data = make_resume_data()
    del data["education"]

    with pytest.raises(ValidationError):
        ResumeDocument.model_validate(data)
