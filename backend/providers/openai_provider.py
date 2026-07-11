from openai import OpenAI

from config import OPENAI_API_KEY
from providers.base_provider import BaseProvider


class OpenAIProvider(BaseProvider):

    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

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
            raise Exception(f"OpenAI Error: {str(e)}")