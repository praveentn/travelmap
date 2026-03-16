import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Star, MapPin, Search, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { MapPin as MapPinType } from '../types';
import PlaceForm from '../components/places/PlaceForm';
import DistanceTool from '../components/map/DistanceTool';
import type { Place } from '../types';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Orange search result marker
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    country?: string;
  };
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 12, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    client.get<MapPinType[]>('/map/pins').then((r) => setPins(r.data));
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setNewCoords({ lat, lng });
  };

  const handleSaved = (place: Place) => {
    setPins((prev) => [
      ...prev,
      {
        id: place.id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        visit_start: place.visit_start,
        rating: place.rating,
        country_name: null,
      },
    ]);
    setNewCoords(null);
    setSearchMarker(null);
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value.trim()) { setResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    // Short display name (first segment)
    const label = result.display_name.split(',')[0];
    setSearchMarker({ lat, lng, label: result.display_name });
    setFlyTarget({ lat, lng });
    setResults([]);
    setQuery(label);
  };

  const handleAddFromSearch = () => {
    if (searchMarker) {
      setNewCoords({ lat: searchMarker.lat, lng: searchMarker.lng });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearchMarker(null);
    setFlyTarget(null);
  };

  return (
    <div className="relative h-[calc(100vh-9rem)] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        minZoom={2}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onClick={handleMapClick} />
        <FlyToLocation coords={flyTarget} />

        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="font-semibold text-slate-800 leading-tight">{pin.name}</p>
                </div>
                {pin.country_name && <p className="text-xs text-slate-500 mb-1">{pin.country_name}</p>}
                {pin.visit_start && <p className="text-xs text-slate-500 mb-1">{pin.visit_start}</p>}
                {pin.rating != null && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={12} fill="#f59e0b" className="text-amber-500" />
                    <span className="text-xs font-medium">{pin.rating}/5</span>
                  </div>
                )}
                <Link to={`/places/${pin.id}`} className="text-xs text-blue-600 hover:underline">
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {searchMarker && (
          <Marker position={[searchMarker.lat, searchMarker.lng]} icon={searchIcon}>
            <Popup>
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold text-slate-800 mb-2 leading-tight">{searchMarker.label.split(',').slice(0, 2).join(',')}</p>
                <button
                  onClick={handleAddFromSearch}
                  className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add this place
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Search bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] w-full max-w-md px-4">
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="pl-4 text-slate-400">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search any place in the world…"
              className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
            />
            {query && (
              <button onClick={clearSearch} className="pr-3 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {r.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {r.display_name.split(',').slice(1, 3).join(',')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint below search */}
        {!query && (
          <p className="text-center text-xs text-white/80 mt-2 drop-shadow pointer-events-none">
            Search or click anywhere on the map to add a place
          </p>
        )}

        {searchMarker && !results.length && (
          <div className="mt-2 bg-white/95 backdrop-blur rounded-2xl shadow border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600 truncate flex-1">
              <span className="font-medium text-slate-800">{searchMarker.label.split(',')[0]}</span>
              {' · '}
              {parseFloat(searchMarker.lat.toFixed ? searchMarker.lat.toFixed(4) : String(searchMarker.lat))},
              {' '}
              {parseFloat(searchMarker.lng.toFixed ? searchMarker.lng.toFixed(4) : String(searchMarker.lng))}
            </p>
            <button
              onClick={handleAddFromSearch}
              className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add place
            </button>
          </div>
        )}
      </div>

      {/* Distance tool overlay */}
      <DistanceTool pins={pins} />

      {newCoords && (
        <PlaceForm
          initial={{ latitude: parseFloat(newCoords.lat.toFixed(6)), longitude: parseFloat(newCoords.lng.toFixed(6)) }}
          onClose={() => setNewCoords(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
