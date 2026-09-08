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
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "gemma2-9b-it"
        ]
    },

    "openrouter": {
        "name": "OpenRouter",
        "models": [
            "deepseek/deepseek-chat",
            "meta-llama/llama-3.3-70b-instruct",
            "anthropic/claude-3.7-sonnet",
            "google/gemma-3-27b-it",
            "qwen/qwen3-32b"
        ]
    }
}


def get_provider_by_model(model: str):
    if not model:
        return None

    for provider, details in MODEL_REGISTRY.items():
        if model in details["models"]:
            return provider

    model_lower = model.lower()
    if "gemini" in model_lower:
        return "gemini"
    if "/" in model:
        for m in MODEL_REGISTRY["groq"]["models"]:
            if model_lower == m.lower():
                return "groq"
        return "openrouter"
    if "gpt" in model_lower or "o1" in model_lower or "o3" in model_lower:
        return "openai"

    return None