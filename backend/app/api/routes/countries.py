from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.country_repository import country_repo
from app.schemas.country import CountryOut

router = APIRouter(prefix="/countries", tags=["countries"])


@router.get("", response_model=list[CountryOut])
def list_countries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return country_repo.get_all(db)
