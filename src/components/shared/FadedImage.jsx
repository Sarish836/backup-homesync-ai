import React from 'react';

export default function FadedImage({ src, alt = 'uploaded image', height = 140 }) {
  if (!src) return null;
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl mb-3"
      style={{ height: `${height}px` }}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover object-top"
        onError={e => e.target.style.display = 'none'}
      />
      {/* Fade edges: top, bottom, left, right */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          linear-gradient(to bottom, hsl(var(--card)) 0%, transparent 30%, transparent 70%, hsl(var(--card)) 100%),
          linear-gradient(to right, hsl(var(--card)) 0%, transparent 20%, transparent 80%, hsl(var(--card)) 100%)
        `
      }} />
    </div>
  );
}