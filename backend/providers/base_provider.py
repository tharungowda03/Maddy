from abc import ABC, abstractmethod


class BaseProvider(ABC):

    @abstractmethod
    def generate_response(
        self,
        messages: list,
        model: str
    ):
        pass