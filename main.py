"""
MediScribe — FastAPI entry point.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
import uvicorn
from api import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
