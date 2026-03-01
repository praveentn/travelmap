from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.place import MapPin
from app.schemas.stats import DistanceRequest, DistanceResponse
from app.services import map_service

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/pins", response_model=list[MapPin])
def map_pins(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return map_service.get_pins(db, current_user.id)


@router.post("/distance", response_model=DistanceResponse)
def compute_distance(req: DistanceRequest, current_user: User = Depends(get_current_user)):
    return map_service.compute_distance(req.lat1, req.lon1, req.lat2, req.lon2)
