from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_countries: int
    total_places: int
    total_distance_km: float
    most_visited_country: str | None
    travel_frequency: dict[int, int]  # year -> count
    country_coverage_pct: float


class ExtremePoints(BaseModel):
    northernmost: str | None
    southernmost: str | None
    easternmost: str | None
    westernmost: str | None


class DistanceStats(BaseModel):
    total_distance_km: float
    total_distance_miles: float
    longest_single_trip_km: float
    extremes: ExtremePoints


class DistanceRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float


class DistanceResponse(BaseModel):
    distance_km: float
    distance_miles: float
