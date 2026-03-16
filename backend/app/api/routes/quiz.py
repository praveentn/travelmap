import random
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.image import Image
from app.models.place import Place
from app.models.country import Country
from app.models.user import User

router = APIRouter(prefix="/quiz", tags=["quiz"])


class QuizPhoto(BaseModel):
    image_url: str
    image_id: str
    place_id: str
    place_name: str
    country_name: Optional[str]
    country_id: Optional[int]
    total_photos: int


@router.get("/random-photo", response_model=QuizPhoto)
def get_random_photo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Image, Place, Country)
        .join(Place, Image.place_id == Place.id)
        .outerjoin(Country, Place.country_id == Country.id)
        .filter(Place.user_id == current_user.id)
        .all()
    )

    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No photos found")

    img, place, country = random.choice(rows)

    return QuizPhoto(
        image_url=img.file_path,
        image_id=img.id,
        place_id=place.id,
        place_name=place.name,
        country_name=country.name if country else None,
        country_id=country.id if country else None,
        total_photos=len(rows),
    )
