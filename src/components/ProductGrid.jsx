import React, { useMemo, useState } from "react";
import { ArrowRight, Grid2x2, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const ATTRIBUTE_LABELS = {
  grade: "Grade",
  series: "Series",
  scale: "Tỷ lệ",
  dong: "Dòng",
  chieu_cao: "Chiều cao",
  loai: "Loại",
  muc_dich: "Mục đích",
  theme: "Theme",
  pieces: "Số mảnh",
};

function normalizeKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatAttributeLabel(key) {
  const normalized = normalizeKey(key);
  if (ATTRIBUTE_LABELS[normalized]) return ATTRIBUTE_LABELS[normalized];
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ProductGrid({
  selectedCategoryId = "all",
  selectedSubcategoryName = "",
  selectedAttributes = {},
  onAttributesChange = () => {},
  attributeFacets = {},
  categories = [],
  products = [],
  brandFacets = [],
  selectedBrandFilter = "all",
  onBrandFilterChange = null,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore = () => {},
  onLoadAll = () => {},
  error = null,
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [brandFilter, setBrandFilter] = useState("all");

  React.useEffect(() => {
    if (typeof onBrandFilterChange !== "function") return;
    setBrandFilter(selectedBrandFilter || "all");
  }, [selectedBrandFilter, onBrandFilterChange]);

  const handleBrandFilterChange = (value) => {
    setBrandFilter(value);
    if (typeof onBrandFilterChange === "function") {
      onBrandFilterChange(value);
    }
  };

  React.useEffect(() => {
    if ((brandFilter !== "all" || sortBy !== "featured") && hasMore) {
      void onLoadAll();
    }
  }, [brandFilter, sortBy, hasMore, onLoadAll]);

  const selectedCategory = categories.find((category) => String(category.id) === selectedCategoryId);

  const brandOptions = useMemo(() => {
    if (Array.isArray(brandFacets) && brandFacets.length > 0) {
      return [...brandFacets].sort((a, b) => a.localeCompare(b, "vi"));
    }
    return Array.from(new Set(products.map((product) => (product.brand || "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "vi")
    );
  }, [brandFacets, products]);

  const availableAttributeEntries = useMemo(() => {
    const entries = Object.entries(attributeFacets || {}).filter(
      ([key, values]) => key && Array.isArray(values) && values.length > 0
    );
    const subName = String(selectedSubcategoryName || "").trim().toUpperCase();
    const gradeKeywords = ["HG", "RG", "MG", "PG", "SD", "MGEX", "RE/100", "FM"];
    const hideGrade = gradeKeywords.some(
      (keyword) => subName === keyword || subName.startsWith(`${keyword} `) || subName.includes(` ${keyword} `)
    );
    const filteredEntries = hideGrade
      ? entries.filter(([key]) => normalizeKey(key) !== "grade")
      : entries;
    return filteredEntries.sort(([a], [b]) => {
      if (normalizeKey(a) === "grade") return -1;
      if (normalizeKey(b) === "grade") return 1;
      return a.localeCompare(b, "vi");
    });
  }, [attributeFacets, selectedSubcategoryName]);

  const shouldShowAttributeFilters = selectedCategoryId !== "all" && availableAttributeEntries.length > 0;

  const filteredProducts =
    brandFilter === "all"
      ? products
      : products.filter((product) => product.brand === brandFilter);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "featured") {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reviews || 0) - (a.reviews || 0);
    }
    if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "newest") return Number(b.id || 0) - Number(a.id || 0);
    return 0;
  });

  const handleAttributeChange = (key, value) => {
    const next = { ...selectedAttributes };
    if (!value || value === "all") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onAttributesChange(next);
  };

  return (
    <section id="product-grid" className="bg-gray-50 py-10">
      <div className="user-container">
        <div className="mb-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">
                {selectedCategory?.name || "Bộ sưu tập cao cấp"}
              </h2>
              <p className="text-sm text-slate-600">
                {selectedCategory?.description || "Tuyển chọn mô hình chính hãng từ các thương hiệu nổi tiếng"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {shouldShowAttributeFilters &&
                availableAttributeEntries.map(([key, values]) => (
                  <Select
                    key={key}
                    value={selectedAttributes[key] || "all"}
                    onValueChange={(value) => handleAttributeChange(key, value)}
                  >
                    <SelectTrigger className="h-9 w-[165px] border-slate-300 text-xs">
                      <SelectValue placeholder={formatAttributeLabel(key)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả {formatAttributeLabel(key).toLowerCase()}</SelectItem>
                      {values.map((value) => (
                        <SelectItem key={`${key}-${value}`} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}

              <Select value={brandFilter} onValueChange={handleBrandFilterChange}>
                <SelectTrigger className="h-9 w-[170px] border-slate-300 text-xs">
                  <SelectValue placeholder="Lọc theo hãng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hãng</SelectItem>
                  {brandOptions.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-[150px] border-slate-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                    <SelectValue placeholder="Sắp xếp" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Nổi bật</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                  <SelectItem value="rating">Đánh giá cao</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 rounded-md bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === "grid" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Dạng lưới"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("large")}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === "large" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Dạng lớn"
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-slate-200 pb-3 text-xs text-slate-600">
            <span>
              Hiển thị <strong className="text-slate-900">{sortedProducts.length}</strong> sản phẩm
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-10 text-center">
            <h3 className="text-sm font-semibold text-red-700">Không thể tải dữ liệu sản phẩm</h3>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
            <h3 className="text-sm font-semibold text-slate-900">Đang tải sản phẩm...</h3>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-sm font-semibold text-slate-900">Chưa có sản phẩm trong danh mục này</h3>
          </div>
        )}

        {(hasMore || isLoadingMore) && (
          <div className="mt-8 text-center">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasMore || isLoadingMore}
              onClick={onLoadMore}
              className="h-9 border border-slate-300 px-5 text-xs font-semibold hover:border-purple-600 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-60"
            >
              {isLoadingMore ? "Đang tải..." : hasMore ? "Xem thêm 20 sản phẩm" : "Đã hiển thị tất cả"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
