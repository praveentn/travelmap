import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import client from '../../api/client';
import type { Country, Place, PlaceFormData } from '../../types';

interface PlaceFormProps {
  initial?: Partial<PlaceFormData>;
  editPlace?: Place;
  onClose: () => void;
  onSaved: (place: Place) => void;
}

const PURPOSES = ['Leisure', 'Business', 'Education', 'Adventure', 'Family', 'Other'];

export default function PlaceForm({ initial, editPlace, onClose, onSaved }: PlaceFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState<PlaceFormData>({
    name: editPlace?.name ?? '',
    latitude: editPlace?.latitude ?? initial?.latitude ?? 0,
    longitude: editPlace?.longitude ?? initial?.longitude ?? 0,
    country_id: editPlace?.country_id ?? null,
    visit_start: editPlace?.visit_start ?? '',
    visit_end: editPlace?.visit_end ?? '',
    rating: editPlace?.rating ?? null,
    notes: editPlace?.notes ?? '',
    budget: editPlace?.budget ?? null,
    travel_purpose: editPlace?.travel_purpose ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get<Country[]>('/countries').then((r) => setCountries(r.data));
  }, []);

  const set = (field: keyof PlaceFormData, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...form,
      country_id: form.country_id || null,
      rating: form.rating || null,
      budget: form.budget || null,
      visit_start: form.visit_start || null,
      visit_end: form.visit_end || null,
      notes: form.notes || null,
      travel_purpose: form.travel_purpose || null,
    };
    try {
      let res;
      if (editPlace) {
        res = await client.put<Place>(`/places/${editPlace.id}`, payload);
      } else {
        res = await client.post<Place>('/places', payload);
      }
      onSaved(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Failed to save place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">
            {editPlace ? 'Edit Place' : 'Add New Place'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Place Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Eiffel Tower"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={form.latitude}
                onChange={(e) => set('latitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude *</label>
              <input
                type="number"
                step="any"
                required
                value={form.longitude}
                onChange={(e) => set('longitude', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select
              value={form.country_id ?? ''}
              onChange={(e) => set('country_id', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visit Start</label>
              <input
                type="date"
                value={form.visit_start}
                onChange={(e) => set('visit_start', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visit End</label>
              <input
                type="date"
                value={form.visit_end}
                onChange={(e) => set('visit_end', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1–5)</label>
              <select
                value={form.rating ?? ''}
                onChange={(e) => set('rating', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget ?? ''}
                onChange={(e) => set('budget', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Travel Purpose</label>
            <select
              value={form.travel_purpose}
              onChange={(e) => set('travel_purpose', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select purpose…</option>
              {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Your memories, tips, recommendations…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : editPlace ? 'Update Place' : 'Add Place'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
