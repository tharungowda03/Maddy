from providers.base_provider import BaseProvider


class OpenRouterProvider(BaseProvider):

    def generate_response(self, messages, model):
        raise NotImplementedError("OpenRouter Provider Coming Soon")