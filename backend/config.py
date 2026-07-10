from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Application Settings
APP_NAME = os.getenv("APP_NAME", "OmniChat AI")
SECRET_KEY = os.getenv("SECRET_KEY")

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")