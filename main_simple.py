"""
Simple FastAPI app - minimal working version.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import sessions_simple

app = FastAPI(title="MediScribe Simple API")

# CORS - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(sessions_simple.router, prefix="/sessions", tags=["Sessions"])


@app.get("/")
async def root():
    return {"message": "MediScribe Simple API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
