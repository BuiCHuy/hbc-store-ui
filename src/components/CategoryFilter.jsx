import React from "react";
import { Gift, Package, Sparkles, Users, Wrench } from "lucide-react";

const categoryIcons = {
  1: Users,
  2: Package,
  3: Gift,
  4: Wrench,
};

export function CategoryFilter({ categories = [], selectedCategoryId, onCategoryChange }) {
  const filterItems = [
    { id: "all", name: "Tất cả", icon: Sparkles },
    ...categories.map((category) => ({
      ...category,
      id: String(category.id),
      icon: categoryIcons[category.id] || Package,
    })),
  ];

  return (
    <section id="category-filter" className="border-y border-slate-200 bg-white">
      <div className="user-container py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterItems.map(({ id, name, icon, iconUrl }) => (
            <button
              key={id}
              type="button"
              onClick={() => onCategoryChange?.(id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                selectedCategoryId === id
                  ? "border-purple-600 bg-purple-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-700"
              }`}
            >
              {iconUrl ? (
                <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded bg-slate-100">
                  <img
                    src={iconUrl}
                    alt={name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </span>
              ) : (
                React.createElement(icon, { className: "h-4 w-4" })
              )}
              {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
