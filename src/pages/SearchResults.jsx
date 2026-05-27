import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { searchProductsViaChat } from "../hooks/useCatalog";

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!query) {
        setProducts([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchProductsViaChat(query, 60);
        if (!active) return;
        setProducts(data);
      } catch (err) {
        if (!active) return;
        setProducts([]);
        setError(err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="bg-gray-50 py-8">
      <div className="user-container">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate font-semibold text-gray-900">Kết quả tìm kiếm</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kết quả tìm kiếm</h1>
          <p className="mt-1 text-sm text-gray-600">
            {query ? (
              <>
                Từ khóa: <span className="font-semibold text-gray-900">{query}</span> ({products.length} sản phẩm)
              </>
            ) : (
              "Vui lòng nhập từ khóa để tìm kiếm sản phẩm."
            )}
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-10 text-center">
            <h3 className="text-sm font-semibold text-red-700">Không thể tải kết quả tìm kiếm</h3>
            <p className="mt-1 text-xs text-red-600">Kiểm tra backend và thử lại.</p>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
            <h3 className="text-sm font-semibold text-gray-900">Đang tìm sản phẩm...</h3>
          </div>
        ) : query && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="text-sm font-semibold text-gray-900">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="mt-1 text-xs text-gray-500">Hãy thử từ khóa khác.</p>
          </div>
        )}
      </div>
    </div>
  );
}
