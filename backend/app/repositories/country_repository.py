from sqlalchemy.orm import Session

from app.models.country import Country
from app.repositories.base import BaseRepository


class CountryRepository(BaseRepository[Country]):
    def get_by_iso(self, db: Session, iso_code: str) -> Country | None:
        return db.query(Country).filter(Country.iso_code == iso_code.upper()).first()

    def get_all(self, db: Session) -> list[Country]:
        return db.query(Country).order_by(Country.name).all()


country_repo = CountryRepository(Country)
