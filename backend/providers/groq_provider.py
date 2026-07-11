from groq import Groq

from config import GROQ_API_KEY
from providers.base_provider import BaseProvider


class GroqProvider(BaseProvider):

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)

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
            raise Exception(f"Groq Error: {str(e)}")