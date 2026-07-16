from providers.gemini_provider import GeminiProvider
from providers.openai_provider import OpenAIProvider
from providers.groq_provider import GroqProvider
from providers.openrouter_provider import OpenRouterProvider

from utils.model_registry import get_provider_by_model
from config import GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY


class ProviderManager:

    def __init__(self):

        # Only initialise providers that have credentials. This lets a
        # deployment run with one provider configured instead of crashing at
        # startup because another provider's API key is absent.
        self.providers = {}
        if GEMINI_API_KEY:
            self.providers["gemini"] = GeminiProvider()
        if OPENAI_API_KEY:
            self.providers["openai"] = OpenAIProvider()
        if GROQ_API_KEY:
            self.providers["groq"] = GroqProvider()
        if OPENROUTER_API_KEY:
            self.providers["openrouter"] = OpenRouterProvider()

    def get_provider(self, model: str):

        provider_name = get_provider_by_model(model)

        if provider_name is None:
            raise ValueError(
                f"No provider found for model '{model}'"
            )

        provider = self.providers.get(provider_name)
        if provider is None:
            raise ValueError(
                f"{provider_name.title()} is not configured. Add its API key to the deployment environment."
            )

        return provider
