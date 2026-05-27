import React from "react";
import { Gift, Package, Sparkles, Users, Wrench } from "lucide-react";

const categoryIcons = {
  1: Users,
  2: Package,
  3: Gift,
  4: Wrench,
};

export function CategoryFilter({
  categories = [],
  selectedCategoryId,
  onCategoryChange,
}) {
  const filterItems = [
    { id: "all", name: "Tất cả", icon: Sparkles },
    ...categories.map((category) => ({
      ...category,
      id: String(category.id),
      icon: categoryIcons[category.id] || Package,
    })),
  ];

  return (
    <section id="category-filter" className="bg-white border-y border-gray-100">
      <div className="user-container py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterItems.map(({ id, name, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onCategoryChange?.(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategoryId === id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
              }`}
            >
              {React.createElement(icon, { className: "w-3.5 h-3.5" })}
              {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
