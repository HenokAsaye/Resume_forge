# Backend Docker and Swagger Guide

## Run the backend

Run these commands from the repository root:

```bash
docker compose up --build
```

The first run builds the image and starts the backend. Later runs can use:

```bash
docker compose up
```

Useful commands:

```bash
docker compose up --build -d
docker compose logs -f backend
docker compose ps
docker compose down
```

- `--build` rebuilds the image before starting it.
- `-d` runs the container in the background.
- `logs -f backend` follows backend logs.
- `ps` displays container and health status.
- `down` stops and removes the Compose containers and network.

## Application URLs

- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`
- Health check: `http://localhost:8000/api/v1/health`

## Dockerfile explained

`FROM python:3.14-slim-bookworm`

Uses the official slim Python 3.14 image based on Debian Bookworm. The slim
variant reduces image size while still supporting required Debian packages.

`ENV PYTHONDONTWRITEBYTECODE=1`

Stops Python from creating `__pycache__` and `.pyc` files in the container.

`ENV PYTHONUNBUFFERED=1`

Sends Python logs directly to Docker without waiting for an output buffer.

`ENV PIP_DISABLE_PIP_VERSION_CHECK=1`

Stops pip from checking for updates during every build.

`ENV PIP_NO_CACHE_DIR=1`

Stops pip from retaining downloaded packages, reducing the final image size.

`WORKDIR /app`

Creates or selects `/app` as the working directory for following instructions
and for the running application.

`RUN apt-get update`

Downloads the current Debian package index.

`apt-get install --yes --no-install-recommends`

Installs required operating-system packages without optional recommendations.

`libharfbuzz-subset0` and `libharfbuzz0b`

Provide text shaping and font subsetting needed by WeasyPrint.

`libpango-1.0-0` and `libpangoft2-1.0-0`

Provide Pango text layout and FreeType font integration for PDF generation.

`groupadd --system app`

Creates a restricted system group named `app`.

`useradd --system --gid app --create-home app`

Creates a non-root application user belonging to the `app` group.

`rm -rf /var/lib/apt/lists/*`

Removes downloaded Debian package indexes after installation to reduce image
size.

`COPY requirements.txt .`

Copies only the dependency manifest first. Docker can reuse the dependency
layer when source code changes but requirements do not.

`RUN python -m pip install --upgrade pip`

Updates pip inside the image.

`python -m pip install --requirement requirements.txt`

Installs all Python dependencies declared by the backend.

`COPY --chown=app:app . .`

Copies backend source files into `/app` and gives ownership to the non-root
application user.

`USER app`

Runs all following commands and the application as the restricted `app` user.

`EXPOSE 8000`

Documents that the image listens on TCP port 8000. Port publication is still
handled by Docker Compose.

`HEALTHCHECK`

Calls `/api/v1/health` from inside the container every 30 seconds. Docker waits
10 seconds before checking, allows five seconds per check, and marks the
container unhealthy after three consecutive failures.

`CMD ["uvicorn", ...]`

Starts FastAPI through Uvicorn, imports `app` from `main.py`, listens on all
container interfaces, and uses port 8000. Reload is intentionally disabled in
the image's default production command.

## Docker Compose explained

`name: resume-forge`

Sets the Compose project name used for generated networks and resources.

`services:`

Starts the collection of containers managed by Compose.

`backend:`

Defines the FastAPI service.

`build.context: ./backend`

Uses the backend directory as the Docker build context.

`build.dockerfile: Dockerfile`

Selects `backend/Dockerfile`.

`command:`

Overrides the Dockerfile production command for local development.

`uvicorn main:app`

Runs the FastAPI object called `app` from `main.py`.

`--host 0.0.0.0`

Makes Uvicorn reachable through Docker's network interface.

`--port 8000`

Runs Uvicorn on container port 8000.

`--reload`

Restarts the development server when mounted Python files change. Do not use
this option in production.

`ports: "8000:8000"`

Maps host port 8000 to container port 8000.

`env_file.path: ./backend/.env`

Loads Supabase, OpenAI, and application settings from `backend/.env`.

`env_file.required: false`

Allows the health endpoint and Swagger UI to start before a local `.env` file
exists. Authentication calls still require valid Supabase settings.

`environment:`

Defines explicit development defaults inside the container.

`APP_NAME: ResumeAI`

Sets the name displayed in Swagger.

`DEBUG: "true"`

Enables the application's development setting.

`CORS_ORIGINS: http://localhost:3000`

Allows the local Next.js frontend to call the API from a browser.

`volumes: ./backend:/app`

Mounts local backend source code into the container so `--reload` sees edits.

`restart: unless-stopped`

Restarts the container after a failure or Docker restart unless it was
explicitly stopped.

## Docker ignore rules

`.dockerignore` keeps local virtual environments, Python caches, test caches,
logs, build output, Git files, and secrets out of the Docker build context.
`.env.example` remains available as documentation, but real `.env` files are
never copied into the image.

## Swagger configuration

FastAPI generates Swagger and OpenAPI directly from route decorators and
Pydantic schemas.

- `docs_url` exposes Swagger UI at `/api/v1/docs`.
- `redoc_url` exposes ReDoc at `/api/v1/redoc`.
- `openapi_url` exposes the machine-readable contract.
- `openapi_tags` describes the endpoint groups.
- `displayRequestDuration` displays API timing in Swagger.
- `filter` adds endpoint searching.
- `persistAuthorization` keeps the bearer token while navigating Swagger.

To call `GET /api/v1/auth/me`:

1. Call the login or registration endpoint.
2. Copy the returned `access_token`.
3. Select **Authorize** in Swagger.
4. Enter the token.
5. Execute `GET /api/v1/auth/me`.
