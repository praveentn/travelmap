import math
from collections import Counter
from datetime import date

from sqlalchemy.orm import Session

from app.models.place import Place
from app.repositories.place_repository import place_repo
from app.schemas.stats import DistanceStats, ExtremePoints, OverviewStats

TOTAL_COUNTRIES = 195  # approximate world count


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _total_distance(places: list[Place]) -> float:
    sorted_places = sorted(
        [p for p in places if p.visit_start],
        key=lambda p: p.visit_start,  # type: ignore[arg-type]
    )
    total = 0.0
    for i in range(1, len(sorted_places)):
        a, b = sorted_places[i - 1], sorted_places[i]
        total += haversine(a.latitude, a.longitude, b.latitude, b.longitude)
    return round(total, 2)


def _longest_trip(places: list[Place]) -> float:
    sorted_places = sorted(
        [p for p in places if p.visit_start],
        key=lambda p: p.visit_start,  # type: ignore[arg-type]
    )
    best = 0.0
    for i in range(1, len(sorted_places)):
        a, b = sorted_places[i - 1], sorted_places[i]
        d = haversine(a.latitude, a.longitude, b.latitude, b.longitude)
        if d > best:
            best = d
    return round(best, 2)


def get_overview(db: Session, user_id: str) -> OverviewStats:
    places = place_repo.get_by_user(db, user_id)
    unique_countries = {p.country_id for p in places if p.country_id}
    country_counter = Counter(p.country_id for p in places if p.country_id)
    most_visited_id = country_counter.most_common(1)[0][0] if country_counter else None
    most_visited_name = None
    if most_visited_id:
        for p in places:
            if p.country_id == most_visited_id and p.country:
                most_visited_name = p.country.name
                break

    freq: dict[int, int] = {}
    for p in places:
        if p.visit_start:
            yr = p.visit_start.year
            freq[yr] = freq.get(yr, 0) + 1

    coverage = round(len(unique_countries) / TOTAL_COUNTRIES * 100, 2)

    return OverviewStats(
        total_countries=len(unique_countries),
        total_places=len(places),
        total_distance_km=_total_distance(places),
        most_visited_country=most_visited_name,
        travel_frequency=freq,
        country_coverage_pct=coverage,
    )


def get_distance_stats(db: Session, user_id: str) -> DistanceStats:
    places = place_repo.get_by_user(db, user_id)
    total_km = _total_distance(places)
    total_miles = round(total_km * 0.621371, 2)
    longest = _longest_trip(places)

    north = south = east = west = None
    if places:
        n = max(places, key=lambda p: p.latitude)
        s = min(places, key=lambda p: p.latitude)
        e = max(places, key=lambda p: p.longitude)
        w = min(places, key=lambda p: p.longitude)
        north, south, east, west = n.name, s.name, e.name, w.name

    return DistanceStats(
        total_distance_km=total_km,
        total_distance_miles=total_miles,
        longest_single_trip_km=longest,
        extremes=ExtremePoints(northernmost=north, southernmost=south, easternmost=east, westernmost=west),
    )
