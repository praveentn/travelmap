import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Star, MapPin } from 'lucide-react';
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

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPage() {
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      </MapContainer>

      {/* Distance tool overlay */}
      <DistanceTool pins={pins} />

      {/* Click hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-xs text-slate-600 pointer-events-none">
        Click anywhere on the map to add a new place
      </div>

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
