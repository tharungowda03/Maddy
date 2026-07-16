# Maddy Chat

Maddy Chat is a full-stack AI chat application that lets users continue their
conversations across sessions. It includes a responsive browser interface,
conversation history stored by user, and support for Gemini, Groq, OpenAI, and
OpenRouter models.

## Features

- Email-based user continuation and user-specific conversation history
- Saved conversations with rename and delete controls
- Multi-provider model selection
- Persistent messages and automatically generated conversation titles
- Responsive frontend served directly by FastAPI
- Ready-to-use health endpoint for deployments

## Technology

- **Backend:** Python, FastAPI, SQLAlchemy
- **Frontend:** HTML, CSS, and vanilla JavaScript
- **Database:** SQLite for local development; PostgreSQL is recommended for production
- **AI providers:** Google Gemini, Groq, OpenAI, and OpenRouter

## Local setup

1. Create and activate a virtual environment.

   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```

2. Install dependencies.

   ```powershell
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `backend/.env` and add at least one AI provider API key.

4. Start the app.

   ```powershell
   cd backend
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

5. Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

The FastAPI server serves both the frontend and API, so a separate Live Server
on port 5500 is not required.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `APP_NAME` | Application name shown by the API |
| `DATABASE_URL` | Database connection URL |
| `GEMINI_API_KEY` | Enables Gemini models |
| `GROQ_API_KEY` | Enables Groq models |
| `OPENAI_API_KEY` | Enables OpenAI models |
| `OPENROUTER_API_KEY` | Enables OpenRouter models |

For local development, `DATABASE_URL` is optional and defaults to a SQLite
database in `backend/database/`. In production, configure a managed PostgreSQL
database so conversation history survives restarts and redeployments.

## Deployment on Render

This repository includes `render.yaml`. Push the project to GitHub and create
a Render Web Service from the repository. Render uses the supplied build and
start commands automatically.

Set these values in the Render environment-variable dashboard:

- `DATABASE_URL` - managed PostgreSQL connection URL
- At least one of the supported provider API keys

Render checks `GET /health` to confirm the service is running.

## Security

Never commit `.env`, API keys, local databases, or uploaded user data. If an
API key has been exposed, revoke it with its provider and create a new key
before deployment.
