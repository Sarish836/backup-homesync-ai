import React from 'react';

export default function FadedImage({ src, alt = 'uploaded image', height = 140 }) {
  if (!src) return null;
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl mb-3 border border-border/40 bg-muted"
      style={{ height: `${height}px` }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top"
        onError={e => e.target.style.display = 'none'}
      />
    </div>
  );
}