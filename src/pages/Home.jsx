import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { HeroBanner } from "../components/HeroBanner";
import { TrustBadges } from "../components/TrustBadges";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { CategoryFilter } from "../components/CategoryFilter";
import { BrandStrip } from "../components/BrandStrip";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { getBrands, getProducts, getSubcategories, useCatalog } from "../hooks/useCatalog";

export function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("all");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [brands, setBrands] = useState([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [featuredSource, setFeaturedSource] = useState([]);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";

  const {
    categories,
    products,
    brandFacets,
    attributeFacets,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreProducts,
    loadAllProducts,
    error,
  } = useCatalog(searchTerm, {
    categoryId: selectedCategoryId,
    subcategoryId: selectedSubcategoryId,
    attributes: selectedAttributes,
  });

  useEffect(() => {
    if (!selectedCategoryId || selectedCategoryId === "all") {
      setSubcategories([]);
      setSelectedSubcategoryId("all");
      return;
    }

    let active = true;
    getSubcategories(selectedCategoryId)
      .then((items) => {
        if (!active) return;
        const activeItems = (items || []).filter((item) => item.status !== "INACTIVE");
        setSubcategories(activeItems);
        setSelectedSubcategoryId((prev) =>
          prev === "all" || activeItems.some((it) => String(it.id) === String(prev)) ? prev : "all"
        );
      })
      .catch(() => {
        if (!active) return;
        setSubcategories([]);
        setSelectedSubcategoryId("all");
      });

    return () => {
      active = false;
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    let active = true;
    getBrands()
      .then((items) => {
        if (!active) return;
        setBrands((items || []).filter((item) => item.status !== "INACTIVE"));
      })
      .catch(() => {
        if (!active) return;
        setBrands([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((allProducts) => {
        if (!active) return;
        setFeaturedSource(Array.isArray(allProducts) ? allProducts : []);
      })
      .catch(() => {
        if (!active) return;
        setFeaturedSource([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = useMemo(
    () =>
      [...featuredSource]
        .sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.reviews || 0) - (a.reviews || 0);
        })
        .slice(0, 4),
    [featuredSource]
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50">
      <main className="flex-grow">
        <HeroBanner categories={categories} onQuickCategory={setSelectedCategoryId} />
        <TrustBadges />

        <CategoryShowcase
          categories={categories}
          onPickCategory={(next) => {
            setSelectedCategoryId(next);
            setSelectedSubcategoryId("all");
            setSelectedAttributes({});
            document.getElementById("category-filter")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <BrandStrip
          brands={brands}
          selectedBrandName={selectedBrandFilter}
          onPickBrand={(name) => {
            setSelectedBrandFilter(name || "all");
            document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {featuredProducts.length > 0 && (
          <section className="bg-gray-50">
            <div className="user-container py-6 md:py-8">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                <h3 className="text-base font-semibold text-slate-900">Gợi ý nổi bật hôm nay</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-md border border-slate-100 bg-slate-100">
                      <img
                        src={item.image || ""}
                        alt={item.name}
                        className="h-full w-full object-contain object-center"
                        loading="lazy"
                      />
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.brand || "Thương hiệu"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-purple-700">
                        {new Intl.NumberFormat("vi-VN").format(item.price || 0)} đ
                      </span>
                      <Link to={`/product/${item.id}`} className="text-xs font-medium text-purple-700 hover:text-purple-800">
                        Xem
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={(next) => {
            setSelectedCategoryId(next);
            setSelectedSubcategoryId("all");
            setSelectedAttributes({});
          }}
        />

        {selectedCategoryId !== "all" && subcategories.length > 0 && (
          <section className="border-b border-slate-200 bg-white">
            <div className="user-container py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubcategoryId("all");
                    setSelectedAttributes({});
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedSubcategoryId === "all"
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-700"
                  }`}
                >
                  Tất cả nhóm con
                </button>
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubcategoryId(String(sub.id));
                      setSelectedAttributes({});
                    }}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedSubcategoryId === String(sub.id)
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-700"
                    }`}
                  >
                    {sub.iconUrl ? (
                      <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded bg-slate-100">
                        <img
                          src={sub.iconUrl}
                          alt={sub.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </span>
                    ) : null}
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <ProductGrid
          categories={categories}
          products={products}
          brandFacets={brandFacets}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryName={
            selectedSubcategoryId === "all"
              ? ""
              : subcategories.find((it) => String(it.id) === String(selectedSubcategoryId))?.name || ""
          }
          selectedAttributes={selectedAttributes}
          onAttributesChange={setSelectedAttributes}
          attributeFacets={attributeFacets}
          selectedBrandFilter={selectedBrandFilter}
          onBrandFilterChange={setSelectedBrandFilter}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreProducts}
          onLoadAll={loadAllProducts}
          error={error}
        />
      </main>

      <Footer />
    </div>
  );
}
