import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroBanner } from "../components/HeroBanner";
import { TrustBadges } from "../components/TrustBadges";
import { CategoryFilter } from "../components/CategoryFilter";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { useCatalog } from "../hooks/useCatalog";

export function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const { categories, products, isLoading, isLoadingMore, hasMore, loadMoreProducts, loadAllProducts, error } = useCatalog(searchTerm);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      
      <main className="flex-grow">
        <HeroBanner categories={categories} onQuickCategory={setSelectedCategoryId} />
        <TrustBadges />
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
        />
        <ProductGrid
          categories={categories}
          products={products}
          selectedCategoryId={selectedCategoryId}
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
