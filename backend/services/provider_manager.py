from providers.gemini_provider import GeminiProvider
from providers.openai_provider import OpenAIProvider
from providers.groq_provider import GroqProvider
from providers.openrouter_provider import OpenRouterProvider

from utils.model_registry import get_provider_by_model


class ProviderManager:

    def __init__(self):

        self.providers = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
            "groq": GroqProvider(),
            "openrouter": OpenRouterProvider(),
        }

    def get_provider(self, model: str):

        provider_name = get_provider_by_model(model)

        if provider_name is None:
            raise ValueError(
                f"No provider found for model '{model}'"
            )

        return self.providers[provider_name]