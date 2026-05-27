import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BrandStrip({ brands = [] }) {
  const scrollRef = useRef(null);
  const activeBrands = brands.filter((brand) => brand.status !== "INACTIVE");

  if (activeBrands.length === 0) return null;

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction * 280,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="user-container py-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Thương hiệu nổi bật</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:border-purple-300 hover:text-purple-700"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:border-purple-300 hover:text-purple-700"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {activeBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex h-16 w-36 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-h-10 max-w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-medium text-gray-700">{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
