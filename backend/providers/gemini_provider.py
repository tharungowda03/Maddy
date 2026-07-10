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

        contents = []

        for message in messages:
            contents.append(message["content"])

        response = self.client.models.generate_content(
            model=model,
            contents="\n".join(contents)
        )

        return response.text