MODEL_REGISTRY = {
    "gemini": {
        "name": "Google Gemini",
        "models": [
            "gemini-2.5-flash",
            "gemini-2.5-pro"
        ]
    },

    "openai": {
        "name": "OpenAI",
        "models": [
            "gpt-4.1",
            "gpt-4o"
        ]
    },

    "groq": {
        "name": "Groq",
        "models": [
            "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it"
        ]
    },

    "openrouter": {
        "name": "OpenRouter",
        "models": [
            "deepseek/deepseek-chat",
        "anthropic/claude-3.7-sonnet",
        "google/gemma-3-27b-it",
        "qwen/qwen3-32b"
        ]
    }
}


def get_provider_by_model(model: str):

    for provider, details in MODEL_REGISTRY.items():

        if model in details["models"]:
            return provider

    return None