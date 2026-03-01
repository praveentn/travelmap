from pydantic import BaseModel


class CountryOut(BaseModel):
    id: int
    name: str
    iso_code: str
    latitude: float
    longitude: float

    model_config = {"from_attributes": True}
