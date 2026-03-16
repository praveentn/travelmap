import { useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, Maximize2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import client from '../../api/client';
import type { Image } from '../../types';
import PhotoLightbox from './PhotoLightbox';

interface ImageGalleryProps {
  placeId: string;
  images: Image[];
  onUpdate: (images: Image[]) => void;
}

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const API_BASE = 'http://localhost:7768';

export default function ImageGallery({ placeId, images, onUpdate }: ImageGalleryProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const queue: UploadItem[] = fileArray.map((f) => ({ file: f, status: 'pending' as const }));
    setUploadQueue(queue);

    let currentImages = [...images];

    for (let i = 0; i < queue.length; i++) {
      setUploadQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item))
      );
      const fd = new FormData();
      fd.append('file', queue[i].file);
      try {
        const res = await client.post<Image>(`/places/${placeId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        currentImages = [...currentImages, res.data];
        onUpdate(currentImages);
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item))
        );
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: err.response?.data?.detail ?? 'Upload failed' } : item
          )
        );
      }
    }

    // Clear queue after a short delay
    setTimeout(() => setUploadQueue([]), 2500);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this photo?')) return;
    await client.delete(`/places/${placeId}/images/${imageId}`);
    onUpdate(images.filter((i) => i.id !== imageId));
  };

  const handleLightboxDelete = async (imageId: string) => {
    if (!confirm('Delete this photo?')) return;
    await client.delete(`/places/${placeId}/images/${imageId}`);
    const next = images.filter((i) => i.id !== imageId);
    onUpdate(next);
    if (next.length === 0) {
      setLightboxIndex(null);
    } else {
      setLightboxIndex((prev) => (prev !== null ? Math.min(prev, next.length - 1) : null));
    }
  };

  const isUploading = uploadQueue.some((u) => u.status === 'uploading' || u.status === 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">
          Photos
          {images.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">{images.length}</span>
          )}
        </h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Upload size={13} />
          Upload Photos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload progress queue */}
      {uploadQueue.length > 0 && (
        <div className="mb-4 space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Uploading {uploadQueue.length} photo{uploadQueue.length > 1 ? 's' : ''}…
          </p>
          {uploadQueue.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {item.status === 'uploading' && (
                <Loader2 size={14} className="text-blue-500 animate-spin flex-shrink-0" />
              )}
              {item.status === 'pending' && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
              )}
              {item.status === 'done' && (
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              )}
              {item.status === 'error' && (
                <XCircle size={14} className="text-red-500 flex-shrink-0" />
              )}
              <span className={`text-xs truncate max-w-[220px] ${item.status === 'error' ? 'text-red-500' : 'text-slate-600'}`}>
                {item.file.name}
                {item.status === 'error' && ` — ${item.error}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / gallery */}
      {images.length === 0 && uploadQueue.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Upload size={28} className={`mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-300'}`} />
          <p className="text-sm font-medium text-slate-500">Drop photos here or click to upload</p>
          <p className="text-xs text-slate-400 mt-1">Supports multiple files · JPG, PNG, WebP · up to 10 MB each</p>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`rounded-xl transition-all ${isDragging ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden bg-slate-100 aspect-square cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={`${API_BASE}${img.file_path}`}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <Maximize2
                    size={20}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  aria-label="Delete photo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {/* Add more drop tile */}
            <div
              onClick={() => fileRef.current?.click()}
              className="relative rounded-xl overflow-hidden bg-slate-50 aspect-square cursor-pointer border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <ImageIcon size={22} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">Add more</span>
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleLightboxDelete}
        />
      )}
    </div>
  );
}
