from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from application.dto.auth_dto import (
    AuthResponse,
    CurrentUserResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
)
from application.use_cases.auth.login_user import LoginUserUseCase
from application.use_cases.auth.refresh_session import RefreshSessionUseCase
from application.use_cases.auth.register_user import RegisterUserUseCase
from domain.exceptions import AuthenticationError, RegistrationError
from domain.interfaces.services.auth_service import (
    AuthenticatedUser,
    AuthenticationResult,
    AuthService,
)
from interfaces.api.deps import get_auth_service, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _to_auth_response(result: AuthenticationResult) -> AuthResponse:
    tokens = result.tokens
    return AuthResponse(
        access_token=tokens.access_token if tokens else None,
        refresh_token=tokens.refresh_token if tokens else None,
        expires_in=tokens.expires_in if tokens else None,
        token_type=tokens.token_type if tokens else "bearer",
        user_id=result.user.id,
        email=result.user.email,
        name=result.user.name,
        requires_email_confirmation=tokens is None,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    summary="Register a user",
    response_description="Supabase user and session details",
    responses={
        400: {"description": "Supabase rejected the registration request"},
        422: {"description": "Email, password, or name validation failed"},
    },
)
async def register(
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    try:
        result = await RegisterUserUseCase(auth_service).execute(
            email=str(payload.email),
            password=payload.password,
            name=payload.name,
        )
    except RegistrationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return _to_auth_response(result)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in with email and password",
    response_description="Authenticated Supabase session",
    responses={
        401: {"description": "Invalid email or password"},
        422: {"description": "Request validation failed"},
    },
)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    try:
        result = await LoginUserUseCase(auth_service).execute(
            email=str(payload.email),
            password=payload.password,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return _to_auth_response(result)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh an authentication session",
    response_description="Rotated access and refresh tokens",
    responses={
        401: {"description": "Refresh token is invalid or expired"},
        422: {"description": "Request validation failed"},
    },
)
async def refresh(
    payload: RefreshRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    try:
        result = await RefreshSessionUseCase(auth_service).execute(
            payload.refresh_token
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return _to_auth_response(result)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Get the current user",
    response_description="User represented by the supplied bearer token",
    responses={401: {"description": "Access token is missing, invalid, or expired"}},
)
async def me(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at,
    )
