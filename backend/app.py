import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from config import APP_NAME
from database import Base, engine

from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.conversation import router as conversation_router
from routers.models import router as models_router

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

mimetypes.add_type("text/javascript", ".js", strict=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    version="1.0.0",
    description="Multi Provider AI Chatbot API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(conversation_router)
app.include_router(chat_router)
app.include_router(models_router)

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse(FRONTEND_DIR / "index.html")
