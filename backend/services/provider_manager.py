from providers.gemini_provider import GeminiProvider
from providers.openai_provider import OpenAIProvider
from providers.groq_provider import GroqProvider
from providers.openrouter_provider import OpenRouterProvider


class ProviderManager:

    def __init__(self):

        self.providers = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
            "groq": GroqProvider(),
            "openrouter": OpenRouterProvider(),
        }

    def get_provider(self, provider: str):

        provider = self.providers.get(provider.lower())

        if provider is None:
            raise ValueError("Unsupported Provider")

        return provider