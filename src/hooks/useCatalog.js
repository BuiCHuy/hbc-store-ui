import { useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPostFormData, apiPut, apiRequest, toAbsoluteApiUrl } from "../lib/api";

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status,
  };
}

function normalizeBrand(brand) {
  return {
    id: brand.id,
    name: brand.name,
    logoUrl: toAbsoluteApiUrl(brand.logoUrl || brand.logo_url || ""),
    country: brand.country || "",
    description: brand.description || "",
    status: brand.status,
  };
}

function normalizeProduct(product) {
  const rawImages =
    product.images ||
    product.imageUrls ||
    product.image_urls ||
    product.productImages ||
    product.product_images ||
    product.gallery ||
    [];

  const images = Array.isArray(rawImages)
    ? rawImages
        .map((item) => {
          if (typeof item === "string") return item;
          return item?.imageUrl || item?.image_url || item?.url || "";
        })
        .filter(Boolean)
        .map(toAbsoluteApiUrl)
    : [];

  const rawAttributes = product.attributes || product.productAttributes || product.specifications || [];
  const attributes = Array.isArray(rawAttributes)
    ? rawAttributes.map((attr) => ({
        name: attr.attributeName || attr.name || "",
        value: attr.attributeValue || attr.value || "",
      }))
    : [];

  return {
    id: product.id,
    image: toAbsoluteApiUrl(product.thumbnailUrl || product.thumbnail_url || product.image || images[0] || ""),
    images,
    name: product.name,
    title: product.name,
    brand: product.brandName || product.brand,
    brand_id: product.brandId,
    category: product.categoryName || product.category,
    category_id: product.categoryId || product.category_id,
    price: Number(product.price || 0),
    originalPrice: product.originalPrice,
    description: product.description,
    stockQuantity: product.stockQuantity,
    attributes,
    brandCountry: product.brandCountry || product.brand_country || "",
    inStock: product.inStock ?? (product.status ? product.status === "ACTIVE" : product.stockQuantity > 0),
    status: product.status,
    rating: Number(product.rating ?? 0),
    reviews: Number(product.reviewCount ?? product.reviews ?? 0),
  };
}

function mapChatSuggestedProduct(item) {
  const imageUrl = item.image || item.thumbnailUrl || item.thumbnail_url || "";
  return {
    id: item.id,
    image: toAbsoluteApiUrl(imageUrl),
    thumbnailUrl: toAbsoluteApiUrl(imageUrl),
    name: item.name || "",
    title: item.name || "",
    brand: item.brand || "",
    category: item.category || "",
    price: Number(item.price || 0),
    originalPrice: null,
    discountPercent: 0,
    promotionId: null,
    inStock: true,
  };
}

function buildSearchSession(prefix, keyword) {
  const normalized = String(keyword || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${prefix}:${normalized || "empty"}`;
}

function normalizePromotion(promotion) {
  return {
    id: promotion.id,
    discountType: promotion.discountType || promotion.discount_type,
    discountValue: Number(promotion.discountValue ?? promotion.discount_value ?? 0),
    startDate: promotion.startDate || promotion.start_date,
    endDate: promotion.endDate || promotion.end_date,
    status: promotion.status || "INACTIVE",
    priority: Number(promotion.priority || 0),
    targetType: promotion.targetType || promotion.target_type || "ALL",
    targetIds: Array.isArray(promotion.targetIds || promotion.target_ids)
      ? (promotion.targetIds || promotion.target_ids).map((id) => Number(id))
      : [],
  };
}

function isPromotionActive(promotion) {
  const now = new Date();
  const startOk = !promotion.startDate || new Date(promotion.startDate) <= now;
  const endOk = !promotion.endDate || new Date(promotion.endDate) >= now;
  return String(promotion.status).toUpperCase() === "ACTIVE" && startOk && endOk;
}

function promotionAppliesToProduct(promotion, product) {
  const type = String(promotion.targetType || "ALL").toUpperCase();
  const targetIds = promotion.targetIds || [];
  if (type === "ALL") return true;
  if (type === "PRODUCT") return targetIds.includes(Number(product.id));
  if (type === "CATEGORY") return targetIds.includes(Number(product.category_id));
  if (type === "BRAND") return targetIds.includes(Number(product.brand_id));
  return false;
}

function computeDiscountedPrice(product, promotion) {
  const basePrice = Number(product.price || 0);
  if (!promotion || basePrice <= 0) return null;

  let discounted = basePrice;
  const discountType = String(promotion.discountType || "").toUpperCase();
  const discountValue = Number(promotion.discountValue || 0);

  if (discountType === "PERCENTAGE") {
    discounted = basePrice - (basePrice * discountValue) / 100;
  } else if (discountType === "FIXED_AMOUNT") {
    discounted = basePrice - discountValue;
  }

  discounted = Math.max(Math.floor(discounted), 0);
  if (discounted >= basePrice) return null;

  return {
    originalPrice: basePrice,
    price: discounted,
    discountPercent: Math.round(((basePrice - discounted) / basePrice) * 100),
    promotionId: promotion.id,
  };
}

function applyPromotionsToProducts(products, promotions) {
  const activePromotions = promotions.filter(isPromotionActive).sort((a, b) => b.priority - a.priority);
  if (activePromotions.length === 0) return products;

  return products.map((product) => {
    const candidates = activePromotions
      .filter((promotion) => promotionAppliesToProduct(promotion, product))
      .map((promotion) => computeDiscountedPrice(product, promotion))
      .filter(Boolean);

    if (!candidates.length) {
      return {
        ...product,
        originalPrice: null,
        discountPercent: 0,
        promotionId: null,
      };
    }

    const best = candidates.sort((a, b) => a.price - b.price)[0];
    return {
      ...product,
      price: best.price,
      originalPrice: best.originalPrice,
      discountPercent: best.discountPercent,
      promotionId: best.promotionId,
    };
  });
}

export function useCatalog(searchTerm = "") {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingAllRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setIsLoading(true);
      setError(null);
      try {
        const query = String(searchTerm || "").trim();
        const categoryPromise = apiGet("/categories", { skipAuth: true });
        const promotionPromise = apiGet("/promotions", { skipAuth: true });
        const productPromise = query
          ? apiPost(
              "/chat",
              { message: query, sessionId: buildSearchSession("catalog-search", query) },
              { skipAuth: true }
            )
          : apiGet("/products?page=0&size=20", { skipAuth: true });

        const [categoryData, productData, promotionData] = await Promise.all([
          categoryPromise,
          productPromise,
          promotionPromise,
        ]);

        if (!isMounted) return;

        const activeCategories = toArray(categoryData)
          .filter((category) => category.status !== "INACTIVE")
          .map(normalizeCategory);

        const baseProducts = query
          ? (Array.isArray(productData?.suggestedProducts) ? productData.suggestedProducts : []).map(
              mapChatSuggestedProduct
            )
          : toArray(productData)
              .filter((product) => product.status !== "INACTIVE")
              .map(normalizeProduct);

        const promotions = toArray(promotionData).map(normalizePromotion);
        const pricedProducts = applyPromotionsToProducts(baseProducts, promotions);

        setCategories(activeCategories);
        setProducts(pricedProducts);
        if (!query) {
          const totalPages = Number(productData?.totalPages ?? 1);
          setPage(0);
          setHasMore(totalPages > 1);
          pageRef.current = 0;
          hasMoreRef.current = totalPages > 1;
        } else {
          setPage(0);
          setHasMore(false);
          pageRef.current = 0;
          hasMoreRef.current = false;
        }
        setSearchMeta(null);
      } catch (loadError) {
        console.error("Lỗi tải dữ liệu catalog:", loadError);
        if (!isMounted) return;
        setCategories([]);
        setProducts([]);
        setPage(0);
        setHasMore(false);
        pageRef.current = 0;
        hasMoreRef.current = false;
        setError(loadError);
        setSearchMeta(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  const loadMoreProducts = async () => {
    const query = String(searchTerm || "").trim();
    if (query || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const [productData, promotionData] = await Promise.all([
        apiGet(`/products?page=${nextPage}&size=20`, { skipAuth: true }),
        apiGet("/promotions", { skipAuth: true }),
      ]);
      const promotions = toArray(promotionData).map(normalizePromotion);
      const incoming = toArray(productData)
        .filter((product) => product.status !== "INACTIVE")
        .map(normalizeProduct);
      const pricedIncoming = applyPromotionsToProducts(incoming, promotions);
      setProducts((prev) => [...prev, ...pricedIncoming]);
      setPage(nextPage);
      pageRef.current = nextPage;
      const totalPages = Number(productData?.totalPages ?? nextPage + 1);
      const more = nextPage + 1 < totalPages;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (loadError) {
      setError(loadError);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadAllProducts = async () => {
    const query = String(searchTerm || "").trim();
    if (query || loadingAllRef.current) return;
    loadingAllRef.current = true;
    try {
      while (hasMoreRef.current) {
        const nextPage = pageRef.current + 1;
        const [productData, promotionData] = await Promise.all([
          apiGet(`/products?page=${nextPage}&size=20`, { skipAuth: true }),
          apiGet("/promotions", { skipAuth: true }),
        ]);
        const promotions = toArray(promotionData).map(normalizePromotion);
        const incoming = toArray(productData)
          .filter((product) => product.status !== "INACTIVE")
          .map(normalizeProduct);
        const pricedIncoming = applyPromotionsToProducts(incoming, promotions);
        setProducts((prev) => [...prev, ...pricedIncoming]);
        pageRef.current = nextPage;
        setPage(nextPage);
        const totalPages = Number(productData?.totalPages ?? nextPage + 1);
        const more = nextPage + 1 < totalPages;
        hasMoreRef.current = more;
        setHasMore(more);
      }
    } catch (loadError) {
      setError(loadError);
    } finally {
      loadingAllRef.current = false;
    }
  };

  return useMemo(
    () => ({ categories, products, isLoading, isLoadingMore, hasMore, loadMoreProducts, loadAllProducts, error, searchMeta }),
    [categories, products, isLoading, isLoadingMore, hasMore, error, searchMeta]
  );
}

export async function getProductById(id) {
  const [productData, promotionData] = await Promise.all([
    apiGet(`/products/${id}`, { skipAuth: true }),
    apiGet("/promotions", { skipAuth: true }),
  ]);
  const product = normalizeProduct(productData);
  const promotions = toArray(promotionData).map(normalizePromotion);
  return applyPromotionsToProducts([product], promotions)[0];
}

export async function getCategories() {
  const data = await apiGet("/categories", { skipAuth: true });
  return toArray(data).map(normalizeCategory);
}

export async function createCategory(category) {
  const data = await apiPost("/categories", {
    name: category.name,
    description: category.description,
    status: category.status || "ACTIVE",
  });
  return normalizeCategory(data);
}

export async function deleteCategory(id) {
  return apiDelete(`/categories/${id}`);
}

export async function updateCategory(id, category) {
  const data = await apiPut(`/categories/${id}`, {
    name: category.name,
    description: category.description,
    status: category.status || "ACTIVE",
  });
  return normalizeCategory(data);
}

export async function getBrands() {
  const data = await apiGet("/brands", { skipAuth: true });
  return toArray(data).map(normalizeBrand);
}

export async function createBrand(brand) {
  const data = await apiPost("/brands", {
    name: brand.name,
    logoUrl: brand.logoUrl || "",
    country: brand.country || "",
    description: brand.description || "",
    status: brand.status || "ACTIVE",
  });
  return normalizeBrand(data);
}

export async function updateBrand(id, brand) {
  const data = await apiPut(`/brands/${id}`, {
    name: brand.name,
    logoUrl: brand.logoUrl || "",
    country: brand.country || "",
    description: brand.description || "",
    status: brand.status || "ACTIVE",
  });
  return normalizeBrand(data);
}

export async function deleteBrand(id) {
  return apiDelete(`/brands/${id}`);
}

export async function getProducts() {
  const [productData, promotionData] = await Promise.all([
    apiGet("/products", { skipAuth: true }),
    apiGet("/promotions", { skipAuth: true }),
  ]);
  const products = toArray(productData).map(normalizeProduct);
  const promotions = toArray(promotionData).map(normalizePromotion);
  return applyPromotionsToProducts(products, promotions);
}

export async function searchProducts(searchTerm, limit = 6) {
  const keyword = String(searchTerm || "").trim();
  if (!keyword) return [];

  const chat = await apiPost(
    "/chat",
    { message: keyword, sessionId: buildSearchSession("header-search", keyword) },
    { skipAuth: true }
  );
  const suggested = Array.isArray(chat?.suggestedProducts) ? chat.suggestedProducts : [];
  return suggested.slice(0, limit).map(mapChatSuggestedProduct);
}

export async function searchProductsViaChat(searchTerm, limit = 60) {
  const keyword = String(searchTerm || "").trim();
  if (!keyword) return [];

  const chat = await apiPost(
    "/chat",
    { message: keyword, sessionId: buildSearchSession("search-page", keyword) },
    { skipAuth: true }
  );
  const suggested = Array.isArray(chat?.suggestedProducts) ? chat.suggestedProducts : [];
  return suggested.slice(0, limit).map(mapChatSuggestedProduct);
}

export async function createProduct(product) {
  const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const attributes = Array.isArray(product.attributes)
    ? product.attributes
        .map((item) => ({
          name: (item?.name || "").trim(),
          value: (item?.value || "").trim(),
        }))
        .filter((item) => item.name && item.value)
    : [];
  const payload = {
    name: product.name,
    price: Number(product.price),
    stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
    stock_quantity: Number(product.stockQuantity ?? product.stock ?? 0),
    thumbnailUrl: product.thumbnailUrl || product.imageUrl || "",
    thumbnail_url: product.thumbnailUrl || product.imageUrl || "",
    imageUrls,
    image_urls: imageUrls,
    images: imageUrls,
    attributes,
    product_attributes: attributes,
    description: product.description || "",
    categoryId: Number(product.categoryId),
    category_id: Number(product.categoryId),
    brandId: Number(product.brandId),
    brand_id: Number(product.brandId),
    status: product.status || "ACTIVE",
  };
  const data = await apiPost("/products", payload);
  return normalizeProduct(data);
}

export async function deleteProduct(id) {
  return apiDelete(`/products/${id}`);
}

export async function updateProduct(id, product) {
  const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const attributes = Array.isArray(product.attributes)
    ? product.attributes
        .map((item) => ({
          name: (item?.name || "").trim(),
          value: (item?.value || "").trim(),
        }))
        .filter((item) => item.name && item.value)
    : [];
  const payload = {
    name: product.name,
    price: Number(product.price),
    stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
    stock_quantity: Number(product.stockQuantity ?? product.stock ?? 0),
    thumbnailUrl: product.thumbnailUrl || product.imageUrl || "",
    thumbnail_url: product.thumbnailUrl || product.imageUrl || "",
    imageUrls,
    image_urls: imageUrls,
    images: imageUrls,
    attributes,
    product_attributes: attributes,
    description: product.description || "",
    categoryId: Number(product.categoryId),
    category_id: Number(product.categoryId),
    brandId: Number(product.brandId),
    brand_id: Number(product.brandId),
    status: product.status || "ACTIVE",
  };
  const data = await apiPut(`/products/${id}`, payload);
  return normalizeProduct(data);
}

export async function uploadProductImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const data = await apiPostFormData("/uploads/images", formData);
  return toArray(data).map(toAbsoluteApiUrl);
}

export async function getProductReviews(productId) {
  const data = await apiGet(`/products/${productId}/reviews`, { skipAuth: true });
  return toArray(data).map((review) => ({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    author: review.authorName || "Khách hàng",
    rating: Number(review.rating || 0),
    comment: review.content || "",
    adminReply: review.adminReply || "",
    repliedAt: review.repliedAt || null,
    status: review.status,
    createdAt: review.createdAt,
  }));
}

export async function createProductReview(productId, payload) {
  const data = await apiPost(`/reviews/products/${productId}`, {
    rating: Number(payload.rating),
    content: payload.content,
  });
  return {
    id: data.id,
    productId: data.productId,
    userId: data.userId,
    author: data.authorName || "Khách hàng",
    rating: Number(data.rating || 0),
    comment: data.content || "",
    adminReply: data.adminReply || "",
    repliedAt: data.repliedAt || null,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export async function replyProductReview(reviewId, reply) {
  const data = await apiRequest(`/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply }),
  });
  return {
    id: data.id,
    productId: data.productId,
    userId: data.userId,
    author: data.authorName || "Khách hàng",
    rating: Number(data.rating || 0),
    comment: data.content || "",
    adminReply: data.adminReply || "",
    repliedAt: data.repliedAt || null,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export async function getMyProductReview(productId) {
  try {
    const data = await apiGet(`/reviews/my/products/${productId}`);
    return {
      id: data.id,
      productId: data.productId,
      userId: data.userId,
      author: data.authorName || "Khách hàng",
      rating: Number(data.rating || 0),
      comment: data.content || "",
      adminReply: data.adminReply || "",
      repliedAt: data.repliedAt || null,
      status: data.status,
      createdAt: data.createdAt,
    };
  } catch (error) {
    const message = (error?.message || "").toLowerCase();
    if (message.includes("review not found")) {
      return null;
    }
    throw error;
  }
}

export { normalizeProduct, normalizeCategory };
