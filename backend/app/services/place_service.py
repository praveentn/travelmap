from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.place import Place
from app.repositories.place_repository import place_repo
from app.schemas.place import PlaceCreate, PlaceDetail, PlaceOut, PlaceUpdate


def get_places(db: Session, user_id: str) -> list[PlaceOut]:
    return place_repo.get_by_user(db, user_id)


def get_place(db: Session, place_id: str, user_id: str) -> PlaceDetail:
    place = place_repo.get_with_images(db, place_id, user_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return place


def create_place(db: Session, user_id: str, data: PlaceCreate) -> PlaceOut:
    obj = data.model_dump()
    obj["user_id"] = user_id
    return place_repo.create(db, obj_in=obj)


def update_place(db: Session, place_id: str, user_id: str, data: PlaceUpdate) -> PlaceOut:
    place = place_repo.get(db, place_id)
    if not place or place.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return place_repo.update(db, db_obj=place, obj_in=data.model_dump(exclude_unset=True))


def delete_place(db: Session, place_id: str, user_id: str) -> None:
    place = place_repo.get(db, place_id)
    if not place or place.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    place_repo.delete(db, id=place_id)
