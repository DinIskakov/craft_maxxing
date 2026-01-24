# AGENTS

## Backend (FastAPI + SQLAlchemy)

- **Config**: Use `core/config.py` (`pydantic-settings`) as the single source of truth. Add new env vars as typed fields; keep `.env` loading there (avoid scattered `os.getenv`).
- **DB sessions**: Use `Depends(get_db)` for request-scoped sessions in routers. For background tasks or threads, create a fresh `SessionLocal()` inside the task (sessions aren’t thread-safe and request sessions close after the response).
- **Models**: Define SQLAlchemy models under `backend/models/` inheriting the shared `Base` (`db/database.py`). Ensure models are imported before `Base.metadata.create_all()` so tables are registered.
- **Responses**: Always return Pydantic schemas (`response_model=...`) and convert ORM objects to response DTOs (e.g., `build_complete_story_tree` uses `CompleteStoryNodeResponse`). Avoid returning raw ORM instances.
- **Background work**: Use `BackgroundTasks` to offload long-running jobs (`generate_story_task`) to avoid blocking HTTP responses. Handle errors and set job status fields (`status`, `completed_at`, `error`).
- **Sessions/cookies**: Derive `session_id` from cookies with a dependency; set it HTTP-only in the response for request correlation.
- **Class methods**: Use `@classmethod` on stateless helpers like `StoryGenerator` so they can be called without instantiation and are override-friendly.
- **Validation**: Use Pydantic schemas for inputs (`CreateStoryRequest`) and outputs (`StoryJobResponse`, `CompleteStoryResponse`). Catch and raise HTTP errors when resources are missing.
- **Defaults & timestamps**: Let the DB set timestamps via `server_default=func.now()`; don’t override unless needed. Primary keys auto-increment.
- **Env keys**: Prefer reading keys from `settings` instead of direct `os.getenv`; only load `.env` separately if a library must read from `os.environ`.

## API patterns

- Mount routers with prefixes (`app.include_router(..., prefix=settings.API_PREFIX)`) to keep versioning/namespacing consistent.
- Keep routes fast; enqueue heavy work to background tasks and update jobs by ID for polling.
- Use consistent status lifecycle for jobs (`pending` → `processing` → `completed`/`failed`).

## Testing/commits

- Keep commits small and logical (new route, bug fix, refactor). Ensure the app runs before committing.
- Don’t mix unrelated changes in one commit.
