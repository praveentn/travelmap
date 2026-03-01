from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.place import PlaceCreate, PlaceDetail, PlaceOut, PlaceUpdate
from app.services import place_service

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceOut])
def list_places(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return place_service.get_places(db, current_user.id)


@router.post("", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def create_place(
    data: PlaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return place_service.create_place(db, current_user.id, data)


@router.get("/{place_id}", response_model=PlaceDetail)
def get_place(
    place_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return place_service.get_place(db, place_id, current_user.id)


@router.put("/{place_id}", response_model=PlaceOut)
def update_place(
    place_id: str,
    data: PlaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return place_service.update_place(db, place_id, current_user.id, data)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(
    place_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    place_service.delete_place(db, place_id, current_user.id)
