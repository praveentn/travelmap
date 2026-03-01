import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import client from '../api/client';
import type { Place } from '../types';
import PlaceCard from '../components/places/PlaceCard';
import PlaceForm from '../components/places/PlaceForm';

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filtered, setFiltered] = useState<Place[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    client.get<Place[]>('/places')
      .then((r) => { setPlaces(r.data); setFiltered(r.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(places.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.country?.name.toLowerCase().includes(q) ||
      p.travel_purpose?.toLowerCase().includes(q)
    ));
  }, [search, places]);

  const handleDelete = async (id: string) => {
    await client.delete(`/places/${id}`);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaved = (place: Place) => {
    setPlaces((prev) => [place, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search places, countries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Place
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading places…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <p className="text-sm">{places.length === 0 ? 'No places yet.' : 'No results found.'}</p>
          {places.length === 0 && (
            <button onClick={() => setShowForm(true)} className="mt-2 text-blue-600 text-sm hover:underline">
              Add your first place →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <PlaceForm onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
