from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from supabase import Client


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, supabase: Client):
        super().__init__(app)
        self._supabase = supabase

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/v1") and request.url.path not in (
            "/api/v1/health",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
        ):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Missing or invalid Authorization header",
                )
            token = auth_header.split(" ")[1]
            try:
                user = self._supabase.auth.get_user(token)
                request.state.user = user.user
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )
        response = await call_next(request)
        return response
