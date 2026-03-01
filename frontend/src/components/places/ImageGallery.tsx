import { useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import client from '../../api/client';
import type { Image } from '../../types';

interface ImageGalleryProps {
  placeId: string;
  images: Image[];
  onUpdate: (images: Image[]) => void;
}

const API_BASE = 'http://localhost:8000';

export default function ImageGallery({ placeId, images, onUpdate }: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await client.post<Image>(`/places/${placeId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdate([...images, res.data]);
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;
    await client.delete(`/places/${placeId}/images/${imageId}`);
    onUpdate(images.filter((i) => i.id !== imageId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">Photos</h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Upload size={13} />
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <ImageIcon size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden bg-slate-100 aspect-square">
              <img
                src={`${API_BASE}${img.file_path}`}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
