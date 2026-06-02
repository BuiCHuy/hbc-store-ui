import React from "react";
import { ArrowRight } from "lucide-react";

function getCategoryPriority(category) {
  const name = String(category?.name || "").toLowerCase();
  if (name.includes("lắp ráp") || name.includes("gunpla") || name.includes("gundam")) return 0;
  if (name.includes("mô hình")) return 1;
  if (name.includes("lego")) return 2;
  if (name.includes("ngẫu nhiên") || name.includes("blind")) return 3;
  return 4;
}

export function CategoryShowcase({ categories = [], onPickCategory }) {
  if (categories.length === 0) return null;

  const featuredCategories = [...categories].sort((a, b) => {
    const priorityDiff = getCategoryPriority(a) - getCategoryPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "vi");
  });

  const primaryCategory = featuredCategories[0];
  const secondaryCategories = featuredCategories.slice(1, 5);

  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="user-container py-6 md:py-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Mua Theo Nhóm Sản Phẩm</h2>
          <p className="mt-1 text-sm text-slate-500">Bắt đầu từ nhóm chính, sau đó đi sâu vào danh mục con phù hợp.</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onPickCategory?.(String(category.id))}
              className="group w-[220px] min-w-[220px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt={category.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <p className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-purple-700">{category.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{category.description || "Xem sản phẩm theo nhóm này"}</p>
            </button>
          ))}
        </div>

        <div className="hidden grid-cols-12 gap-4 md:grid">
          {primaryCategory ? (
            <button
              type="button"
              onClick={() => onPickCategory?.(String(primaryCategory.id))}
              className="group col-span-12 grid min-h-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-purple-300 hover:shadow-md lg:col-span-6"
            >
              <div className="grid h-full grid-rows-[minmax(0,1fr)_auto]">
                <div className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),_transparent_42%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] p-6">
                  <div className="flex h-full items-center justify-center rounded-2xl bg-white/75 p-6 backdrop-blur-sm">
                    {primaryCategory.iconUrl ? (
                      <img
                        src={primaryCategory.iconUrl}
                        alt={primaryCategory.name}
                        className="h-full max-h-[300px] w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-100 p-6 text-left">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">Nhóm nổi bật</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{primaryCategory.name}</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      {primaryCategory.description || "Khám phá nhóm sản phẩm đang được ưu tiên hiển thị."}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </button>
          ) : null}

          <div className="col-span-12 grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {secondaryCategories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onPickCategory?.(String(category.id))}
                className={`group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-purple-300 hover:shadow-md ${
                  index === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                    {category.iconUrl ? (
                      <img
                        src={category.iconUrl}
                        alt={category.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-purple-700">{category.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {category.description || "Xem sản phẩm theo nhóm này"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
