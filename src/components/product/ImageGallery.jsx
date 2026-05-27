import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images?.length) {
    return (
      <div className="aspect-[4/3] rounded-lg border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
        Chưa có ảnh sản phẩm
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
      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
        <img
          src={images[selectedImage]}
          alt="Product"
          className="w-full h-full object-cover"
        />
        <button
          onClick={handlePrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-gray-800" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-gray-800" />
        </button>

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {selectedImage + 1} / {images.length}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`aspect-square rounded-md overflow-hidden border transition-all ${
              selectedImage === index
                ? "border-purple-600 ring-1 ring-purple-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
