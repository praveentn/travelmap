from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.country import CountryOut
from app.schemas.image import ImageOut


class PlaceCreate(BaseModel):
    name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    country_id: int | None = None
    visit_start: date | None = None
    visit_end: date | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None
    budget: float | None = Field(default=None, ge=0)
    travel_purpose: str | None = None


class PlaceUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    country_id: int | None = None
    visit_start: date | None = None
    visit_end: date | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None
    budget: float | None = Field(default=None, ge=0)
    travel_purpose: str | None = None


class PlaceOut(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    country_id: int | None
    visit_start: date | None
    visit_end: date | None
    rating: int | None
    notes: str | None
    budget: float | None
    travel_purpose: str | None
    created_at: datetime
    country: CountryOut | None = None

    model_config = {"from_attributes": True}


class PlaceDetail(PlaceOut):
    images: list[ImageOut] = []

    model_config = {"from_attributes": True}


class MapPin(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    visit_start: date | None
    rating: int | None
    country_name: str | None
