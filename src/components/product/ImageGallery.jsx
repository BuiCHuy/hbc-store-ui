import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images?.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-sm font-medium text-gray-500">
        Chua co anh san pham
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
        <img src={images[selectedImage]} alt="Product" className="h-full w-full object-contain" />
        <button
          onClick={handlePrevious}
          className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4 text-gray-800" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4 text-gray-800" />
        </button>

        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
          {selectedImage + 1} / {images.length}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`aspect-square overflow-hidden rounded-md border bg-gray-100 transition-all ${
              selectedImage === index ? "border-purple-600 ring-1 ring-purple-200" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}
