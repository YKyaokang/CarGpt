"use client";

import type { PostImageData } from '@/types/community';
import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  images: PostImageData[];
}

export default function PostImageGrid({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const count = images.length;

  const gridClass =
    count === 1
      ? 'grid-cols-1 max-w-sm'
      : count === 2
        ? 'grid-cols-2'
        : count === 4
          ? 'grid-cols-2'
          : 'grid-cols-3';

  const aspectClass = count === 1 ? 'aspect-video' : 'aspect-square';

  return (
    <>
      <div className={`grid gap-1 ${gridClass} mt-3 rounded-xl overflow-hidden`}>
        {images.slice(0, 9).map((img, i) => (
          <div
            key={img.id}
            className={`relative ${aspectClass} overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 group`}
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={img.url}
              alt={img.fileName ?? `图片 ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {count > 9 && i === 8 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                +{count - 9}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 灯箱 */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => Math.max(0, (p ?? 0) - 1)); }}
            >
              ‹
            </button>
          )}
          <img
            src={images[lightboxIndex]?.url}
            alt={images[lightboxIndex]?.fileName ?? '图片'}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex < images.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => Math.min(images.length - 1, (p ?? 0) + 1)); }}
            >
              ›
            </button>
          )}
          <div className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
