from openai import OpenAI

from config import OPENROUTER_API_KEY
from providers.base_provider import BaseProvider


class OpenRouterProvider(BaseProvider):

    def __init__(self):
        self.client = OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )

    def generate_response(
        self,
        messages: list,
        model: str
    ):

        try:

            response = self.client.chat.completions.create(
                model=model,
                messages=messages
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"OpenRouter Error: {str(e)}")