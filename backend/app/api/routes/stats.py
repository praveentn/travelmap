from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.stats import DistanceStats, OverviewStats
from app.services import stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
def overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return stats_service.get_overview(db, current_user.id)


@router.get("/distances", response_model=DistanceStats)
def distances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return stats_service.get_distance_stats(db, current_user.id)
