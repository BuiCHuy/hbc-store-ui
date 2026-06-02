import React from "react";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Button } from "./ui/button";

export function HeroBanner({ categories = [], onQuickCategory }) {
  const quickCategories = categories.slice(0, 4);

  const jumpToFilter = (categoryId) => {
    onQuickCategory?.(categoryId);
    document.getElementById("category-filter")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[320px] overflow-hidden bg-slate-900 md:h-[380px]">
      <div className="absolute inset-0">
        <img
          src="https://images7.alphacoders.com/139/1395504.jpg"
          alt="Collectible figures"
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-transparent" />
      </div>

      <div className="user-container relative flex h-full items-center">
        <div className="max-w-2xl text-white">
          <h1 className="mb-2 text-3xl font-bold leading-tight md:text-4xl">Mô hình chính hãng cho người sưu tầm</h1>
          <p className="mb-4 max-w-xl text-sm text-slate-200 md:text-base">
            Chọn nhanh theo danh mục, lọc theo hãng và đặt hàng trực tiếp với thông tin rõ ràng.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Chính hãng
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
              <Truck className="h-3.5 w-3.5" />
              Giao hàng toàn quốc
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Đổi trả 7 ngày
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2.5">
            <Button
              size="sm"
              className="h-8 bg-purple-600 px-4 text-xs hover:bg-purple-700"
              onClick={() => document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" })}
            >
              Mua ngay
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/40 bg-white/10 px-4 text-xs text-white hover:bg-white/20"
              onClick={() => document.getElementById("category-filter")?.scrollIntoView({ behavior: "smooth" })}
            >
              Xem danh mục
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
              onClick={() => jumpToFilter("all")}
            >
              Tất cả
            </button>
            {quickCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
                onClick={() => jumpToFilter(String(category.id))}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
