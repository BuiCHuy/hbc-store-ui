import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function BrandCard({ active = false, title, subtitle, logoUrl, onClick, all = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative h-32 w-48 shrink-0 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition ${
        active
          ? "border-purple-400 bg-purple-50"
          : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-md"
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-purple-700">{title}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <div
            className={`flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
              active ? "border-purple-200 bg-white" : "border-slate-200 bg-slate-50"
            }`}
          >
            {all ? (
              <span className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">ALL</span>
            ) : logoUrl ? (
              <img src={logoUrl} alt={title} className="h-full w-full object-contain p-2" loading="lazy" />
            ) : (
              <span className="text-[11px] font-medium text-slate-400">N/A</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
              active ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {all ? "Toàn bộ thương hiệu" : "Xem sản phẩm"}
          </span>
          <span className={`text-xs font-medium ${active ? "text-purple-700" : "text-slate-400 group-hover:text-purple-600"}`}>
            Chọn
          </span>
        </div>
      </div>
    </button>
  );
}

export function BrandStrip({ brands = [], selectedBrandName = "all", onPickBrand = () => {} }) {
  const scrollRef = useRef(null);
  const activeBrands = brands.filter((brand) => brand.status !== "INACTIVE");

  if (activeBrands.length === 0) return null;

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="user-container py-6 md:py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Mua theo hãng</h2>
            <p className="mt-1 text-sm text-slate-500">Tập trung vào thương hiệu trước, sau đó lọc tiếp theo dòng sản phẩm phù hợp.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:border-purple-300 hover:text-purple-700"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:border-purple-300 hover:text-purple-700"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BrandCard
            all
            active={selectedBrandName === "all"}
            title="Tất cả hãng"
            subtitle="Xem toàn bộ sản phẩm"
            onClick={() => onPickBrand("all")}
          />
          {activeBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              active={selectedBrandName === brand.name}
              title={brand.name}
              subtitle={brand.country || "Thương hiệu sưu tầm"}
              logoUrl={brand.logoUrl}
              onClick={() => onPickBrand(brand.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
