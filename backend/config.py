from dotenv import load_dotenv
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

APP_NAME = os.getenv("APP_NAME", "OmniChat AI")
SECRET_KEY = os.getenv("SECRET_KEY")

# This allows a local run without a .env file. For a production deployment,
# set DATABASE_URL to a managed PostgreSQL database so chat history persists.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{(BASE_DIR / 'database' / 'chatbot.db').as_posix()}",
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
