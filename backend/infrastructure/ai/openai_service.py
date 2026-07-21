from openai import OpenAI

from config import Settings
from domain.interfaces.services.ai_service import AIService


class OpenAILLMService(AIService):
    def __init__(self, settings: Settings):
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    async def parse_resume(self, text: str) -> dict:
        # placeholder — will be implemented in Phase 5
        return {"raw_text": text}

    async def parse_job_description(self, text: str) -> dict:
        # placeholder — will be implemented in Phase 6
        return {"raw_text": text}

    async def analyze_ats(self, resume_text: str, job_text: str) -> dict:
        # placeholder — will be implemented in Phase 7
        return {"match_score": 0.0}

    async def optimize_resume(self, resume_json: dict, job_json: dict) -> dict:
        # placeholder — will be implemented in Phase 8
        return resume_json

    async def generate_cover_letter(self, resume_json: dict, job_json: dict) -> str:
        # placeholder — will be implemented in Phase 10
        return ""
