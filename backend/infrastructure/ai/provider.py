from dataclasses import dataclass

from config import AIProvider, Settings

PLACEHOLDER_API_KEYS = {
    "your_gemini_api_key_here",
    "your_openai_api_key_here",
}


def normalize_api_key(value: str) -> str:
    normalized = value.strip()
    if not normalized or normalized.lower() in PLACEHOLDER_API_KEYS:
        return ""
    if normalized.startswith(("sb_", "ysb_", "pk.", "sk_live_")):
        return ""
    return normalized


@dataclass(frozen=True, slots=True)
class AIProviderConfig:
    provider: AIProvider
    api_key: str
    model: str
    max_output_tokens: int
    timeout_seconds: float

    @classmethod
    def from_settings(cls, settings: Settings) -> "AIProviderConfig":
        if normalize_api_key(settings.gemini_api_key):
            return cls.for_provider(settings, AIProvider.GEMINI)
        return cls.for_provider(settings, AIProvider.OPENAI)

    @classmethod
    def for_provider(
        cls,
        settings: Settings,
        provider: AIProvider,
        api_key: str | None = None,
    ) -> "AIProviderConfig":
        configured_key = (
            settings.gemini_api_key
            if provider is AIProvider.GEMINI
            else settings.openai_api_key
        )
        model = (
            settings.gemini_model
            if provider is AIProvider.GEMINI
            else settings.openai_model
        )
        return cls(
            provider=provider,
            api_key=normalize_api_key(
                api_key if api_key is not None else configured_key
            ),
            model=model.strip(),
            max_output_tokens=settings.ai_max_output_tokens,
            timeout_seconds=settings.ai_timeout_seconds,
        )
