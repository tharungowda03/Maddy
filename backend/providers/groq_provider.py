from providers.base_provider import BaseProvider


class GroqProvider(BaseProvider):

    def generate_response(self, messages, model):
        raise NotImplementedError("Groq Provider Coming Soon")