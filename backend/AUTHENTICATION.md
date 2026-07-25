# ResumeAI Authentication

## Responsibility split

- Supabase Auth stores password hashes, creates users, confirms email addresses,
  issues access tokens, and rotates refresh tokens.
- FastAPI exposes the application's agreed `/api/v1/auth/*` contract.
- PostgreSQL stores application-facing profile data in `public.profiles`.
- FastAPI dependencies authenticate protected endpoints before a use case runs.

The application never stores plaintext passwords and does not issue custom JWTs.

## Request flow

### Registration

1. The frontend sends `email`, `password`, and `name` to
   `POST /api/v1/auth/register`.
2. `RegisterRequest` validates the fields.
3. `RegisterUserUseCase` calls the `AuthService` interface.
4. `SupabaseAuthService` calls `supabase.auth.sign_up`.
5. Supabase inserts the identity into `auth.users`.
6. The database trigger inserts the corresponding `public.profiles` row.
7. FastAPI returns the user and session tokens.

When Supabase email confirmation is enabled, registration returns:

```json
{
  "access_token": null,
  "refresh_token": null,
  "expires_in": null,
  "token_type": "bearer",
  "user_id": "user-uuid",
  "email": "jane@example.com",
  "name": "Jane Doe",
  "requires_email_confirmation": true
}
```

The frontend should show a "Check your email" screen instead of treating the
user as authenticated.

### Login

1. The frontend sends credentials to `POST /api/v1/auth/login`.
2. Supabase verifies the password.
3. FastAPI returns the access token, refresh token, and expiration period.
4. The frontend sends the access token as
   `Authorization: Bearer <access_token>` on protected requests.

Invalid credentials always produce `401` with a generic message.

### Protected routes

1. `HTTPBearer` extracts the bearer token.
2. `get_current_user` passes the token to `AuthService.get_user`.
3. Supabase validates expiration, signature, and account state.
4. The dependency returns `AuthenticatedUser`.
5. The endpoint uses `current_user.id` for ownership checks.

Future endpoints must get the user ID from `get_current_user`. They must never
accept a client-provided `user_id` as proof of ownership.

### Refresh

1. The frontend sends its current refresh token to
   `POST /api/v1/auth/refresh`.
2. Supabase validates and rotates the session.
3. FastAPI returns both the new access token and new refresh token.
4. The frontend must replace both old tokens.

## Database security

The migration at
`supabase/migrations/202607250001_create_profiles.sql` creates:

- A one-to-one profile linked to `auth.users`.
- A signup trigger that copies `email` and `name`.
- Owner-only SELECT and UPDATE RLS policies.
- An `updated_at` trigger.

Every future user-owned table must include a `user_id uuid` column and an RLS
policy comparing it to `auth.uid()`.

## Environment

Create `backend/.env` from `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-backend-secret-key
CORS_ORIGINS=http://localhost:3000
```

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_*` variable.

Apply the migration with the Supabase CLI:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Run the API:

```bash
cd backend
.venv/bin/uvicorn main:app --reload
```

Run tests:

```bash
cd backend
.venv/bin/pytest -q
```

## Frontend session handling

The current frontend API wrapper reads the Supabase browser session. After
login or refresh, pass both returned tokens to the browser client:

```ts
await supabase.auth.setSession({
  access_token: response.access_token,
  refresh_token: response.refresh_token,
})
```

Do not call `setSession` when `requires_email_confirmation` is `true`.

For logout, clear the browser session with `supabase.auth.signOut()`. A backend
logout endpoint can be added later if server-side session revocation becomes a
requirement.
