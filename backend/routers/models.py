from fastapi import APIRouter

from utils.model_registry import MODEL_REGISTRY

router = APIRouter(
    prefix="/models",
    tags=["Models"]
)

@router.get("/")
def get_models():
    return MODEL_REGISTRY