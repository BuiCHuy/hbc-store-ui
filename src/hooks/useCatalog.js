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
    iconUrl: toAbsoluteApiUrl(category.iconUrl || category.icon_url || ""),
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
    subcategory: product.subcategoryName || product.subcategory || "",
    subcategory_id: product.subcategoryId || product.subcategory_id || null,
    price: Number(product.price || 0),
    originalPrice: product.originalPrice == null ? null : Number(product.originalPrice),
    discountPercent: Number(product.discountPercent || 0),
    promotionId: product.promotionId ?? null,
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
    originalPrice: item.originalPrice == null ? null : Number(item.originalPrice),
    discountPercent: Number(item.discountPercent || 0),
    promotionId: item.promotionId ?? null,
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

function buildProductQuery({ searchTerm, categoryId, subcategoryId, attributes = {}, page = 0, size = 20 }) {
  const params = new URLSearchParams();
  if (searchTerm) params.set("search", searchTerm);
  if (categoryId && categoryId !== "all") params.set("categoryId", String(categoryId));
  if (subcategoryId && subcategoryId !== "all") params.set("subcategoryId", String(subcategoryId));
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (!key || !value || value === "all") return;
    params.set(`attr.${key}`, value);
  });
  params.set("page", String(page));
  params.set("size", String(size));
  return `/products?${params.toString()}`;
}

export function useCatalog(searchTerm = "", filters = {}) {
  const selectedCategoryId = filters.categoryId || "all";
  const selectedSubcategoryId = filters.subcategoryId || "all";
  const selectedAttributes = filters.attributes || {};
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [brandFacets, setBrandFacets] = useState([]);
  const [attributeFacets, setAttributeFacets] = useState({});
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
        const facetQuery =
          selectedCategoryId && selectedCategoryId !== "all"
            ? `/products/facets?categoryId=${encodeURIComponent(selectedCategoryId)}${
                selectedSubcategoryId && selectedSubcategoryId !== "all"
                  ? `&subcategoryId=${encodeURIComponent(selectedSubcategoryId)}`
                  : ""
              }`
            : "/products/facets";
        const facetPromise = apiGet(facetQuery, { skipAuth: true });
        const productPromise = query
          ? apiPost(
              "/chat",
              { message: query, sessionId: buildSearchSession("catalog-search", query) },
              { skipAuth: true }
            )
          : apiGet(
              buildProductQuery({
                searchTerm: query,
                categoryId: selectedCategoryId,
                subcategoryId: selectedSubcategoryId,
                attributes: selectedAttributes,
                page: 0,
                size: 20,
              }),
              { skipAuth: true }
            );

        const [categoryData, productData, facetData] = await Promise.all([
          categoryPromise,
          productPromise,
          facetPromise,
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

        setCategories(activeCategories);
        setProducts(baseProducts);
        setBrandFacets(Array.isArray(facetData?.brands) ? facetData.brands : []);
        setAttributeFacets(facetData?.attributes && typeof facetData.attributes === "object" ? facetData.attributes : {});
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
        setBrandFacets([]);
        setAttributeFacets({});
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
  }, [searchTerm, selectedCategoryId, selectedSubcategoryId, JSON.stringify(selectedAttributes)]);

  const loadMoreProducts = async () => {
    const query = String(searchTerm || "").trim();
    if (query || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const productData = await apiGet(
        buildProductQuery({
          searchTerm: query,
          categoryId: selectedCategoryId,
          subcategoryId: selectedSubcategoryId,
          attributes: selectedAttributes,
          page: nextPage,
          size: 20,
        }),
        { skipAuth: true }
      );
      const incoming = toArray(productData)
        .filter((product) => product.status !== "INACTIVE")
        .map(normalizeProduct);
      setProducts((prev) => [...prev, ...incoming]);
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
        const productData = await apiGet(
          buildProductQuery({
          searchTerm: query,
          categoryId: selectedCategoryId,
          subcategoryId: selectedSubcategoryId,
          attributes: selectedAttributes,
          page: nextPage,
          size: 20,
          }),
          { skipAuth: true }
        );
        const incoming = toArray(productData)
          .filter((product) => product.status !== "INACTIVE")
          .map(normalizeProduct);
        setProducts((prev) => [...prev, ...incoming]);
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
    () => ({
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
      searchMeta,
    }),
    [categories, products, brandFacets, attributeFacets, isLoading, isLoadingMore, hasMore, error, searchMeta]
  );
}

export async function getProductById(id) {
  const productData = await apiGet(`/products/${id}`, { skipAuth: true });
  return normalizeProduct(productData);
}

export async function getCategories() {
  const data = await apiGet("/categories", { skipAuth: true });
  return toArray(data).map(normalizeCategory);
}

export async function createCategory(category) {
  const data = await apiPost("/categories", {
    name: category.name,
    description: category.description,
    iconUrl: category.iconUrl || "",
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
    iconUrl: category.iconUrl || "",
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
  const productData = await apiGet("/products", { skipAuth: true });
  return toArray(productData).map(normalizeProduct);
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
    subcategoryId: product.subcategoryId ? Number(product.subcategoryId) : null,
    subcategory_id: product.subcategoryId ? Number(product.subcategoryId) : null,
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
    subcategoryId: product.subcategoryId ? Number(product.subcategoryId) : null,
    subcategory_id: product.subcategoryId ? Number(product.subcategoryId) : null,
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

export async function getProductAttributeSuggestions(categoryId) {
  const query =
    categoryId && String(categoryId).trim()
      ? `/products/facets?categoryId=${encodeURIComponent(String(categoryId).trim())}`
      : "/products/facets";
  const data = await apiGet(query, { skipAuth: true });
  const attributes = data?.attributes && typeof data.attributes === "object" ? data.attributes : {};
  return Object.entries(attributes).reduce((acc, [name, values]) => {
    if (!name || !Array.isArray(values)) return acc;
    acc[name] = values.filter(Boolean);
    return acc;
  }, {});
}

export async function getSubcategories(categoryId) {
  if (!categoryId || String(categoryId).trim() === "" || String(categoryId) === "all") return [];
  const data = await apiGet(`/subcategories?categoryId=${encodeURIComponent(String(categoryId))}`, {
    skipAuth: true,
  });
  return toArray(data).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    iconUrl: toAbsoluteApiUrl(item.iconUrl || item.icon_url || ""),
    status: item.status,
    categoryId: item.categoryId || item.category_id,
  }));
}

export async function createSubcategory(payload) {
  const data = await apiPost("/subcategories", {
    name: payload.name,
    description: payload.description || "",
    iconUrl: payload.iconUrl || "",
    categoryId: Number(payload.categoryId),
    status: payload.status || "ACTIVE",
  });
  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    iconUrl: toAbsoluteApiUrl(data.iconUrl || data.icon_url || ""),
    status: data.status,
    categoryId: data.categoryId,
  };
}

export async function updateSubcategory(id, payload) {
  const data = await apiPut(`/subcategories/${id}`, {
    name: payload.name,
    description: payload.description || "",
    iconUrl: payload.iconUrl || "",
    categoryId: Number(payload.categoryId),
    status: payload.status || "ACTIVE",
  });
  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    iconUrl: toAbsoluteApiUrl(data.iconUrl || data.icon_url || ""),
    status: data.status,
    categoryId: data.categoryId,
  };
}

export async function deleteSubcategory(id) {
  return apiDelete(`/subcategories/${id}`);
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
    const normalizedMessage = String(error?.message || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/đ/gi, "d")
      .toLowerCase();
    if (
      normalizedMessage.includes("review not found") ||
      normalizedMessage.includes("khong tim thay danh gia")
    ) {
      return null;
    }
    throw error;
  }
}

export async function getProductReviewEligibility(productId) {
  try {
    const data = await apiGet(`/reviews/eligibility/products/${productId}`);
    return Boolean(data?.canReview);
  } catch {
    return false;
  }
}

export { normalizeProduct, normalizeCategory };
