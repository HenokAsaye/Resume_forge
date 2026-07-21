from abc import ABC, abstractmethod


class AIService(ABC):
    @abstractmethod
    async def parse_resume(self, text: str) -> dict:
        pass

    @abstractmethod
    async def parse_job_description(self, text: str) -> dict:
        pass

    @abstractmethod
    async def analyze_ats(self, resume_text: str, job_text: str) -> dict:
        pass

    @abstractmethod
    async def optimize_resume(self, resume_json: dict, job_json: dict) -> dict:
        pass

    @abstractmethod
    async def generate_cover_letter(self, resume_json: dict, job_json: dict) -> str:
        pass
