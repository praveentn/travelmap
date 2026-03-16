import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { Image } from '../../types';

const API_BASE = 'http://localhost:7768';

interface Props {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (imageId: string) => void;
}

export default function PhotoLightbox({ images, initialIndex, onClose, onDelete }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [visible, setVisible] = useState(true);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Clamp current index if images array shrinks after a deletion
  useEffect(() => {
    if (images.length === 0) { onClose(); return; }
    setCurrent(c => Math.min(c, images.length - 1));
  }, [images.length, onClose]);

  const go = useCallback((dir: 1 | -1) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(c => (c + dir + images.length) % images.length);
      setVisible(true);
    }, 120);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Keep active thumbnail scrolled into view
  useEffect(() => {
    const el = thumbRef.current?.children[current] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current]);

  if (images.length === 0) return null;
  const img = images[current];

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col select-none"
      onClick={onClose}
    >
      {/* Top bar: counter + actions */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/40 text-sm tabular-nums font-medium tracking-wide">
          {current + 1} <span className="text-white/20">/</span> {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(img.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/20 rounded-lg hover:bg-red-500/15 transition-colors"
          >
            <Trash2 size={12} />
            Delete photo
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Main image + navigation arrows */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-16"
        onClick={e => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          key={img.id}
          src={`${API_BASE}${img.file_path}`}
          alt=""
          className={`max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-[120ms] ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ maxHeight: 'calc(100vh - 190px)' }}
          draggable={false}
        />

        {images.length > 1 && (
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail filmstrip */}
      {images.length > 1 && (
        <div className="flex-shrink-0 pt-4 pb-3" onClick={e => e.stopPropagation()}>
          <div
            ref={thumbRef}
            className="flex gap-2 overflow-x-auto px-6 justify-center"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 120); }}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                  i === current
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-black opacity-100 scale-105'
                    : 'opacity-30 hover:opacity-60 hover:scale-105'
                }`}
              >
                <img
                  src={`${API_BASE}${t.file_path}`}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      {images.length > 1 && (
        <p className="flex-shrink-0 text-center text-white/15 text-xs pb-4">
          ← → navigate · Esc close
        </p>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
