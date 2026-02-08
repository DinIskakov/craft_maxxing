from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import agent, profiles, challenges, friends, notifications

app = FastAPI(
    title="CraftMaxxing API",
    description="Learn any skill in 30 days with multiplayer challenges",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent.router)
app.include_router(profiles.router)
app.include_router(challenges.router)
app.include_router(friends.router)
app.include_router(notifications.router)


@app.get("/")
def read_root() -> dict:
    return {"status": "ok", "message": "CraftMaxxing API is running"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
