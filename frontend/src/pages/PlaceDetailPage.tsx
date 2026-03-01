import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Star, Calendar, DollarSign, MapPin, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import client from '../api/client';
import type { PlaceDetail, Image } from '../types';
import PlaceForm from '../components/places/PlaceForm';
import ImageGallery from '../components/places/ImageGallery';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    client.get<PlaceDetail>(`/places/${id}`)
      .then((r) => setPlace(r.data))
      .catch(() => navigate('/places'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!place || !confirm('Delete this place?')) return;
    await client.delete(`/places/${place.id}`);
    navigate('/places');
  };

  const handleImagesUpdate = (images: Image[]) => {
    if (place) setPlace({ ...place, images });
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading…</div>;
  if (!place) return null;

  return (
    <div className="max-w-4xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/places" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Back to Places
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{place.name}</h2>
                {place.country && (
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} />
                    {place.country.name}
                  </p>
                )}
              </div>
              {place.rating != null && (
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <Star size={16} fill="#f59e0b" className="text-amber-500" />
                  <span className="text-lg font-bold text-amber-600">{place.rating}</span>
                  <span className="text-xs text-amber-500">/5</span>
                </div>
              )}
            </div>

            {/* KPIs table */}
            <div className="grid grid-cols-2 gap-3">
              {place.visit_start && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Calendar size={13} />
                    <span className="text-xs">Visit dates</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {place.visit_start}{place.visit_end ? ` → ${place.visit_end}` : ''}
                  </p>
                </div>
              )}
              {place.budget != null && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <DollarSign size={13} />
                    <span className="text-xs">Budget</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">${place.budget.toLocaleString()}</p>
                </div>
              )}
              {place.travel_purpose && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Purpose</div>
                  <p className="text-sm font-medium text-slate-700">{place.travel_purpose}</p>
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Coordinates</div>
                <p className="text-sm font-medium text-slate-700">
                  {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            {place.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-600 mb-2">Notes</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{place.notes}</p>
              </div>
            )}
          </div>

          {/* Image gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <ImageGallery
              placeId={place.id}
              images={place.images}
              onUpdate={handleImagesUpdate}
            />
          </div>
        </div>

        {/* Map sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Location</h3>
            </div>
            <div className="h-64">
              <MapContainer
                center={[place.latitude, place.longitude]}
                zoom={10}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={[place.latitude, place.longitude]}>
                  <Popup>{place.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <PlaceForm
          editPlace={place}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setPlace({ ...place, ...updated }); setEditing(false); }}
        />
      )}
    </div>
  );
}
