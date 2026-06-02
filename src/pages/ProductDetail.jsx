import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { ImageGallery } from "../components/product/ImageGallery";
import { ProductInfo } from "../components/product/ProductInfo";
import { ProductTabs } from "../components/product/ProductTabs";
import { getBrands, getProductById, getProductReviews } from "../hooks/useCatalog";

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, brands, reviews] = await Promise.all([
          getProductById(id),
          getBrands(),
          getProductReviews(id),
        ]);
        const matchedBrand = brands.find(
          (brand) => String(brand.id) === String(data.brand_id ?? data.brandId)
        );
        const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
        const averageRating =
          totalReviews > 0
            ? Number(
                (
                  reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
                  totalReviews
                ).toFixed(1)
              )
            : 0;
        if (isMounted) {
          setProduct({
            ...data,
            title: data.title || data.name,
            rating: averageRating,
            reviewCount: totalReviews,
            brandCountry: data.brandCountry || matchedBrand?.country || "",
          });
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết sản phẩm:", err);
        if (isMounted) {
          setProduct(null);
          setError(err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => {
    const thumbnail = String(product?.image || "").trim();
    const extras = Array.isArray(product?.images)
      ? product.images.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const merged = thumbnail ? [thumbnail, ...extras] : extras;
    return Array.from(new Set(merged));
  }, [product?.images, product?.image]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="user-container py-6">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600"
            >
              <Home className="h-3.5 w-3.5" />
              Trang chủ
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">Sản phẩm</span>
          </nav>

          <div className="rounded-lg border border-red-200 bg-red-50 p-10 text-center">
            <h1 className="text-base font-bold text-red-700">Không thể tải thông tin sản phẩm</h1>
            <p className="mt-1 text-sm text-red-600">
              Kiểm tra backend đang chạy và sản phẩm có tồn tại trong cơ sở dữ liệu.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="user-container py-6">
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm font-medium text-gray-600">
            Đang tải thông tin sản phẩm...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="user-container py-6">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <Link
            to="/"
            className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-purple-600"
          >
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="font-medium text-gray-600">{product.category}</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="font-medium text-gray-600">{product.brand}</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate font-semibold text-gray-900">{product.title}</span>
        </nav>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <ImageGallery images={galleryImages} />
          <ProductInfo
            id={product.id}
            image={product.image}
            brand={product.brand}
            category={product.category}
            title={product.title}
            price={product.price}
            originalPrice={product.originalPrice}
            rating={product.rating}
            reviewCount={product.reviewCount}
            description={product.description}
            inStock={product.inStock}
          />
        </div>

        <div className="mb-8">
          <ProductTabs product={product} />
        </div>
      </main>
    </div>
  );
}
