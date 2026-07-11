from google import genai

from config import GEMINI_API_KEY
from providers.base_provider import BaseProvider


class GeminiProvider(BaseProvider):

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def generate_response(
        self,
        messages: list,
        model: str
    ):

        try:
            prompt = "\n".join(
                message["content"]
                for message in messages
            )

            response = self.client.models.generate_content(
                model=model,
                contents=prompt
            )

            return response.text

        except Exception as e:
            raise Exception(f"Gemini Error: {str(e)}")