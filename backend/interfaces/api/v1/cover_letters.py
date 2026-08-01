from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from application.dto.career_dto import (
    CoverLetterCreateRequest,
    CoverLetterResponse,
    CoverLetterUpdateRequest,
)
from application.use_cases.cover_letters import (
    CreateCoverLetterUseCase,
    DeleteCoverLetterUseCase,
    GetCoverLetterUseCase,
    ListCoverLettersUseCase,
    UpdateCoverLetterUseCase,
)
from domain.interfaces.services.auth_service import AuthenticatedUser
from interfaces.api.deps import (
    get_cover_letter_use_case,
    get_create_cover_letter_use_case,
    get_current_user,
    get_delete_cover_letter_use_case,
    get_list_cover_letters_use_case,
    get_update_cover_letter_use_case,
)
from interfaces.api.presenters import to_cover_letter

router = APIRouter(prefix="/api/v1/cover-letters", tags=["cover-letters"])


@router.post(
    "",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a cover letter",
    responses={
        404: {"description": "Resume or job not found"},
        409: {"description": "Resume or job has not been parsed"},
        429: {"description": "LLM rate limit exceeded"},
        502: {"description": "LLM provider failed"},
        503: {"description": "No OpenAI key is configured"},
    },
)
async def create_cover_letter(
    payload: CoverLetterCreateRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        CreateCoverLetterUseCase,
        Depends(get_create_cover_letter_use_case),
    ],
) -> CoverLetterResponse:
    letter = await use_case.execute(
        str(payload.resume_id),
        str(payload.job_id),
        current_user.id,
    )
    return to_cover_letter(letter)


@router.get(
    "",
    response_model=list[CoverLetterResponse],
    summary="List cover letters",
)
async def list_cover_letters(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ListCoverLettersUseCase,
        Depends(get_list_cover_letters_use_case),
    ],
    resume_id: Annotated[UUID | None, Query()] = None,
    job_id: Annotated[UUID | None, Query()] = None,
) -> list[CoverLetterResponse]:
    letters = await use_case.execute(
        current_user.id,
        str(resume_id) if resume_id else None,
        str(job_id) if job_id else None,
    )
    return [to_cover_letter(letter) for letter in letters]


@router.get(
    "/{cover_letter_id}",
    response_model=CoverLetterResponse,
    summary="Get a cover letter",
    responses={404: {"description": "Cover letter not found"}},
)
async def get_cover_letter(
    cover_letter_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        GetCoverLetterUseCase,
        Depends(get_cover_letter_use_case),
    ],
) -> CoverLetterResponse:
    return to_cover_letter(
        await use_case.execute(str(cover_letter_id), current_user.id)
    )


@router.patch(
    "/{cover_letter_id}",
    response_model=CoverLetterResponse,
    summary="Edit a cover letter",
    responses={404: {"description": "Cover letter not found"}},
)
async def update_cover_letter(
    cover_letter_id: UUID,
    payload: CoverLetterUpdateRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        UpdateCoverLetterUseCase,
        Depends(get_update_cover_letter_use_case),
    ],
) -> CoverLetterResponse:
    return to_cover_letter(
        await use_case.execute(
            str(cover_letter_id),
            current_user.id,
            payload.content,
        )
    )


@router.delete(
    "/{cover_letter_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a cover letter",
    responses={404: {"description": "Cover letter not found"}},
)
async def delete_cover_letter(
    cover_letter_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        DeleteCoverLetterUseCase,
        Depends(get_delete_cover_letter_use_case),
    ],
) -> Response:
    await use_case.execute(str(cover_letter_id), current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
