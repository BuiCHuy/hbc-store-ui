import React from "react";

export function ImagePreview({ src, alt, className = "" }) {
  if (!src) return null;

  return (
    <div className={`overflow-hidden rounded-md border border-gray-200 bg-gray-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        onError={(event) => {
          event.currentTarget.parentElement.style.display = "none";
        }}
      />
    </div>
  );
}

export default ImagePreview;
