from collections.abc import Callable
from unittest.mock import Mock

import pytest
from application.exceptions import AIConfigurationError
from application.interfaces.services.structured_generation_service import (
    StructuredGenerationService,
)
from application.services import (
    StructuredATSAnalysisService,
    StructuredCoverLetterGenerationService,
    StructuredJobParsingService,
    StructuredResumeOptimizationService,
    StructuredResumeParsingService,
)
from config import AIProvider, Settings
from infrastructure.ai import (
    GeminiStructuredService,
    OpenAIStructuredService,
)
from infrastructure.ai.provider import AIProviderConfig
from interfaces.api.deps import (
    get_ai_provider_config,
    get_ats_analysis_service,
    get_cover_letter_generation_service,
    get_job_parsing_service,
    get_resume_optimization_service,
    get_resume_parsing_service,
    get_structured_generation_service,
)


def make_settings(**values: object) -> Settings:
    return Settings(_env_file=None, **values)


def test_server_credentials_prefer_gemini() -> None:
    settings = make_settings(
        openai_api_key=" openai-key ",
        openai_model=" openai-model ",
        gemini_api_key=" gemini-key ",
        gemini_model=" gemini-model ",
    )

    config = get_ai_provider_config(settings)

    assert config.provider is AIProvider.GEMINI
    assert config.api_key == "gemini-key"
    assert config.model == "gemini-model"


def test_server_credentials_fall_back_to_openai() -> None:
    settings = make_settings(
        openai_api_key=" openai-key ",
        openai_model=" openai-model ",
        gemini_api_key="",
    )

    config = get_ai_provider_config(settings)

    assert config.provider is AIProvider.OPENAI
    assert config.api_key == "openai-key"
    assert config.model == "openai-model"


def test_no_server_credentials_returns_configuration_error() -> None:
    settings = make_settings(
        openai_api_key="",
        gemini_api_key="",
    )

    with pytest.raises(AIConfigurationError, match="No AI provider"):
        get_ai_provider_config(settings)


@pytest.mark.parametrize(
    "placeholder",
    [
        "your_gemini_api_key_here",
        "your_openai_api_key_here",
        " YOUR_OPENAI_API_KEY_HERE ",
    ],
)
def test_placeholder_credentials_are_not_treated_as_keys(
    placeholder: str,
) -> None:
    settings = make_settings(
        openai_api_key=placeholder,
        gemini_api_key="",
    )

    with pytest.raises(AIConfigurationError, match="No AI provider"):
        get_ai_provider_config(settings)


def test_request_key_defaults_to_gemini() -> None:
    settings = make_settings(openai_api_key="", gemini_api_key="")

    config = get_ai_provider_config(
        settings,
        request_provider=None,
        request_api_key=" personal-key ",
    )

    assert config.provider is AIProvider.GEMINI
    assert config.api_key == "personal-key"
    assert config.model == settings.gemini_model


def test_request_key_can_select_openai() -> None:
    settings = make_settings(
        openai_api_key="server-openai",
        gemini_api_key="server-gemini",
    )

    config = get_ai_provider_config(
        settings,
        request_provider=AIProvider.OPENAI,
        request_api_key="personal-openai",
    )

    assert config.provider is AIProvider.OPENAI
    assert config.api_key == "personal-openai"


def test_request_provider_without_key_is_rejected() -> None:
    settings = make_settings(gemini_api_key="server-gemini")

    with pytest.raises(AIConfigurationError, match="requires X-AI-API-Key"):
        get_ai_provider_config(
            settings,
            request_provider=AIProvider.OPENAI,
            request_api_key=None,
        )


@pytest.mark.parametrize(
    ("provider", "service_type"),
    [
        (AIProvider.OPENAI, OpenAIStructuredService),
        (AIProvider.GEMINI, GeminiStructuredService),
    ],
)
def test_structured_generator_uses_selected_provider(
    provider: AIProvider,
    service_type: type,
) -> None:
    config = AIProviderConfig(
        provider=provider,
        api_key="test-key",
        model="test-model",
        max_output_tokens=1000,
        timeout_seconds=10,
    )

    service = get_structured_generation_service(config)

    assert isinstance(service, service_type)


@pytest.mark.parametrize(
    ("dependency", "service_type"),
    [
        (get_resume_parsing_service, StructuredResumeParsingService),
        (get_job_parsing_service, StructuredJobParsingService),
        (get_ats_analysis_service, StructuredATSAnalysisService),
        (
            get_resume_optimization_service,
            StructuredResumeOptimizationService,
        ),
        (
            get_cover_letter_generation_service,
            StructuredCoverLetterGenerationService,
        ),
    ],
)
def test_feature_dependencies_return_application_services(
    dependency: Callable[[StructuredGenerationService], object],
    service_type: type,
) -> None:
    generator = Mock(spec=StructuredGenerationService)

    service = dependency(generator)

    assert isinstance(service, service_type)
