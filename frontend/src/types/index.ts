export interface User {
  id: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Country {
  id: number;
  name: string;
  iso_code: string;
  latitude: number;
  longitude: number;
}

export interface Image {
  id: string;
  place_id: string;
  file_path: string;
  uploaded_at: string;
}

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country_id: number | null;
  country: Country | null;
  visit_start: string | null;
  visit_end: string | null;
  rating: number | null;
  notes: string | null;
  budget: number | null;
  travel_purpose: string | null;
  created_at: string;
}

export interface PlaceDetail extends Place {
  images: Image[];
}

export interface MapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  visit_start: string | null;
  rating: number | null;
  country_name: string | null;
}

export interface OverviewStats {
  total_countries: number;
  total_places: number;
  total_distance_km: number;
  most_visited_country: string | null;
  travel_frequency: Record<number, number>;
  country_coverage_pct: number;
}

export interface ExtremePoints {
  northernmost: string | null;
  southernmost: string | null;
  easternmost: string | null;
  westernmost: string | null;
}

export interface DistanceStats {
  total_distance_km: number;
  total_distance_miles: number;
  longest_single_trip_km: number;
  extremes: ExtremePoints;
}

export interface PlaceFormData {
  name: string;
  latitude: number;
  longitude: number;
  country_id: number | null;
  visit_start: string;
  visit_end: string;
  rating: number | null;
  notes: string;
  budget: number | null;
  travel_purpose: string;
}
