from typing import List

from fastapi import APIRouter, Depends, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.image import ImageOut
from app.services import image_service

router = APIRouter(prefix="/places", tags=["images"])


@router.post("/{place_id}/images", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    place_id: str,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    img = await image_service.upload_image(db, place_id, current_user.id, file)
    return img


@router.post("/{place_id}/images/bulk", response_model=List[ImageOut], status_code=status.HTTP_201_CREATED)
async def upload_images_bulk(
    place_id: str,
    files: List[UploadFile],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = []
    for file in files:
        img = await image_service.upload_image(db, place_id, current_user.id, file)
        results.append(img)
    return results


@router.delete("/{place_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    place_id: str,
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_service.delete_image(db, place_id, image_id, current_user.id)
