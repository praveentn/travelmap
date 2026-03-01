import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.image import Image
from app.repositories.place_repository import place_repo

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def upload_image(db: Session, place_id: str, user_id: str, file: UploadFile) -> Image:
    place = place_repo.get(db, place_id)
    if not place or place.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    dest_dir = Path(settings.UPLOAD_DIR) / place_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    dest_path = dest_dir / filename

    with open(dest_path, "wb") as f:
        f.write(content)

    relative_path = f"/{settings.UPLOAD_DIR}/{place_id}/{filename}"
    img = Image(place_id=place_id, file_path=relative_path)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


def delete_image(db: Session, place_id: str, image_id: str, user_id: str) -> None:
    place = place_repo.get(db, place_id)
    if not place or place.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    img = db.query(Image).filter(Image.id == image_id, Image.place_id == place_id).first()
    if not img:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    file_path = Path(img.file_path.lstrip("/"))
    if file_path.exists():
        os.remove(file_path)

    db.delete(img)
    db.commit()
