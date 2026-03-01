from sqlalchemy.orm import Session, joinedload

from app.models.place import Place
from app.repositories.base import BaseRepository


class PlaceRepository(BaseRepository[Place]):
    def get_by_user(self, db: Session, user_id: str) -> list[Place]:
        return (
            db.query(Place)
            .options(joinedload(Place.country), joinedload(Place.images))
            .filter(Place.user_id == user_id)
            .order_by(Place.created_at.desc())
            .all()
        )

    def get_with_images(self, db: Session, place_id: str, user_id: str) -> Place | None:
        return (
            db.query(Place)
            .options(joinedload(Place.country), joinedload(Place.images))
            .filter(Place.id == place_id, Place.user_id == user_id)
            .first()
        )

    def get_map_pins(self, db: Session, user_id: str) -> list[Place]:
        return (
            db.query(Place)
            .options(joinedload(Place.country))
            .filter(Place.user_id == user_id)
            .all()
        )


place_repo = PlaceRepository(Place)
