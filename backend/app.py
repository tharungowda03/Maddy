from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import APP_NAME
from database import Base, engine

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    version="1.0.0",
    description="Multi Provider AI Chatbot API"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "success",
        "message": f"Welcome to {APP_NAME}",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }