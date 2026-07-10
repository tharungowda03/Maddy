from providers.base_provider import BaseProvider


class OpenAIProvider(BaseProvider):

    def generate_response(self, messages, model):
        raise NotImplementedError("OpenAI Provider Coming Soon")