from pydantic import BaseModel, ConfigDict


class ResumeSchemaModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class ContactInformation(ResumeSchemaModel):
    name: str
    email: str
    phone: str
    location: str
    links: list[str]


class WorkExperience(ResumeSchemaModel):
    title: str
    company: str
    start: str
    end: str
    bullets: list[str]


class Education(ResumeSchemaModel):
    degree: str
    institution: str
    start: str
    end: str


class Project(ResumeSchemaModel):
    name: str
    description: str
    tech: list[str]


class ResumeDocument(ResumeSchemaModel):
    contact: ContactInformation
    summary: str
    skills: list[str]
    experience: list[WorkExperience]
    education: list[Education]
    projects: list[Project]
    certifications: list[str]
