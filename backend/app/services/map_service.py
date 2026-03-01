from sqlalchemy.orm import Session

from app.repositories.place_repository import place_repo
from app.schemas.place import MapPin
from app.schemas.stats import DistanceResponse
from app.services.stats_service import haversine


def get_pins(db: Session, user_id: str) -> list[MapPin]:
    places = place_repo.get_map_pins(db, user_id)
    return [
        MapPin(
            id=p.id,
            name=p.name,
            latitude=p.latitude,
            longitude=p.longitude,
            visit_start=p.visit_start,
            rating=p.rating,
            country_name=p.country.name if p.country else None,
        )
        for p in places
    ]


def compute_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> DistanceResponse:
    km = haversine(lat1, lon1, lat2, lon2)
    return DistanceResponse(distance_km=round(km, 2), distance_miles=round(km * 0.621371, 2))
