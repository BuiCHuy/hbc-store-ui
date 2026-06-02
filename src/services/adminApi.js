import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from "../lib/api";

export function normalizeAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    phone_number: user.phoneNumber || "",
    address: user.address || "",
    role: user.role,
    status: user.status,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

function toUserPayload(user) {
  return {
    email: user.email,
    password: user.password,
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    address: user.address,
    role: user.role,
    status: user.status || "ACTIVE",
  };
}

export async function getUsers() {
  const data = await apiGet("/users");
  return data.map(normalizeAdminUser);
}

export async function createUser(user) {
  const data = await apiPost("/users", toUserPayload(user));
  return normalizeAdminUser(data);
}

export async function deleteUser(id) {
  return apiDelete(`/users/${id}`);
}

export async function updateUserStatus(user, status) {
  const data = await apiPut(`/users/${user.id}`, {
    email: user.email,
    fullName: user.full_name,
    phoneNumber: user.phone_number || "",
    address: user.address || "",
    role: user.role,
    status,
  });
  return normalizeAdminUser(data);
}

export function normalizePromotion(promotion) {
  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description || "",
    discount_type: promotion.discountType,
    discount_value: Number(promotion.discountValue || 0),
    start_date: promotion.startDate,
    end_date: promotion.endDate,
    status: promotion.status,
    priority: promotion.priority || 0,
    target_type: promotion.targetType,
    target_ids: promotion.targetIds || [],
    sale_stock_limit: promotion.saleStockLimit,
    sold_count: promotion.soldCount || 0,
    created_at: promotion.createdAt,
    updated_at: promotion.updatedAt,
  };
}

function toPromotionPayload(promotion) {
  const rawSaleLimit = promotion.sale_stock_limit;
  const hasSaleLimit =
    rawSaleLimit !== null &&
    rawSaleLimit !== undefined &&
    String(rawSaleLimit).trim() !== "";

  return {
    name: promotion.name,
    description: promotion.description,
    discountType: promotion.discount_type,
    discountValue: Number(promotion.discount_value),
    startDate: promotion.start_date,
    endDate: promotion.end_date,
    status: promotion.status,
    priority: Number(promotion.priority || 0),
    targetType: promotion.target_type,
    targetIds: promotion.target_ids,
    saleStockLimit: hasSaleLimit ? Number(rawSaleLimit) : null,
  };
}

export async function getPromotions() {
  const data = await apiGet("/promotions");
  return data.map(normalizePromotion);
}

export async function createPromotion(promotion) {
  const data = await apiPost("/promotions", toPromotionPayload(promotion));
  return normalizePromotion(data);
}

export async function updatePromotion(id, promotion) {
  const data = await apiPut(`/promotions/${id}`, toPromotionPayload(promotion));
  return normalizePromotion(data);
}

export async function deletePromotion(id) {
  return apiDelete(`/promotions/${id}`);
}

export function normalizeOrder(order) {
  return {
    id: order.id,
    code: `#HBC${String(order.id).padStart(6, "0")}`,
    user_id: order.userId,
    coupon_id: order.couponId ?? null,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    shipping_address: order.shippingAddress,
    order_date: order.orderDate,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    payment_expired_at: order.paymentExpiredAt || null,
    subtotal_amount: Number(order.subtotalAmount || 0),
    shipping_fee: Number(order.shippingFee || 0),
    discount_amount: Number(order.discountAmount || 0),
    total_amount: Number(order.totalAmount || 0),
    item_count: order.itemCount || 0,
    items: (order.items || []).map((item) => ({
      id: item.id,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice || 0),
      total_price: Number(item.totalPrice || 0),
    })),
  };
}

export async function getAdminOrders() {
  const data = await apiGet("/orders");
  return data.map(normalizeOrder);
}

export async function getMyOrders() {
  const data = await apiGet("/orders/mine");
  return data.map(normalizeOrder);
}

export async function getOrderById(id) {
  const data = await apiGet(`/orders/${id}`);
  return normalizeOrder(data);
}

export async function updateOrderStatus(id, status) {
  const data = await apiRequest(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return normalizeOrder(data);
}

export async function cancelMyOrder(id) {
  return updateOrderStatus(id, "CANCELLED");
}

function toOrderPayload({ checkoutData, cartItems, couponId = null, shippingFee = 0, discountAmount = 0 }) {
  return {
    customerName: checkoutData.fullName,
    customerPhone: checkoutData.phoneNumber,
    customerEmail: checkoutData.email || "",
    shippingAddress: checkoutData.address,
    paymentMethod: checkoutData.paymentMethod,
    couponId,
    shippingFee,
    discountAmount,
    items: cartItems.map((item) => ({
      productId: Number(item.id),
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
    })),
  };
}

export async function createOrder(orderData) {
  const data = await apiPost("/orders", toOrderPayload(orderData));
  return normalizeOrder(data);
}

// Backward-compatible alias
export const createGuestOrder = createOrder;

export async function createPayOSPayment(orderId) {
  return apiPost("/payments/payos/create", { orderId: Number(orderId) });
}
export async function confirmPayOSReturn(params) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/payments/payos/return?${query}`, { skipAuth: true });
}

export async function syncPayOSPaymentStatus(payment) {
  const paymentLinkId = payment?.requestId || payment?.paymentLinkId || payment?.id;
  const orderCode = payment?.orderId || payment?.orderCode || payment?.externalId;
  if (!paymentLinkId && !orderCode) return null;

  return confirmPayOSReturn({
    ...(paymentLinkId ? { id: paymentLinkId } : {}),
    ...(orderCode ? { orderCode } : {}),
  });
}

export async function getPayOSSettings() {
  return apiGet("/payments/payos/settings");
}

export function normalizeShippingSettings(settings) {
  return {
    northFee: Number(settings.northFee || 0),
    centralFee: Number(settings.centralFee || 0),
    southFee: Number(settings.southFee || 0),
    freeShippingThreshold: Number(settings.freeShippingThreshold || 0),
  };
}

export async function getShippingSettings() {
  const data = await apiGet("/shipping/settings", { skipAuth: true });
  return normalizeShippingSettings(data);
}

export async function updateShippingSettings(settings) {
  const data = await apiPut("/admin/shipping/settings", {
    northFee: Number(settings.northFee || 0),
    centralFee: Number(settings.centralFee || 0),
    southFee: Number(settings.southFee || 0),
    freeShippingThreshold: Number(settings.freeShippingThreshold || 0),
  });
  return normalizeShippingSettings(data);
}

export async function quoteShipping({ subtotal, province, shippingAddress }) {
  const data = await apiPost(
    "/shipping/quote",
    {
      subtotal: Number(subtotal || 0),
      province: province || "",
      shippingAddress: shippingAddress || "",
    },
    { skipAuth: true }
  );
  return {
    shippingFee: Number(data.shippingFee || 0),
    region: data.region || "north",
    regionLabel: data.regionLabel || "Miền Bắc",
    freeShipping: Boolean(data.freeShipping),
  };
}

export function normalizeCoupon(coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discountType || coupon.discount_type,
    discount_value: Number(coupon.discountValue ?? coupon.discount_value ?? 0),
    min_order_value: Number(coupon.minOrderValue ?? coupon.min_order_value ?? 0),
    max_discount_amount:
      coupon.maxDiscountAmount ?? coupon.max_discount_amount ?? null,
    start_date: coupon.startDate || coupon.start_date,
    end_date: coupon.endDate || coupon.end_date,
    usage_limit: Number(coupon.usageLimit ?? coupon.usage_limit ?? 0),
    usage_count: Number(coupon.usedCount ?? coupon.usage_count ?? 0),
    status: (coupon.status || "ACTIVE").toLowerCase(),
  };
}

function toCouponPayload(coupon) {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderValue: Number(coupon.minOrderValue || 0),
    maxDiscountAmount:
      coupon.discountType === "PERCENTAGE" && coupon.maxDiscount
        ? Number(coupon.maxDiscount)
        : null,
    startDate: coupon.startDate || null,
    endDate: coupon.endDate,
    usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : null,
    status: "ACTIVE",
  };
}

export async function getCoupons() {
  const data = await apiGet("/coupons");
  return data.map(normalizeCoupon);
}

export async function createCoupon(coupon) {
  const data = await apiPost("/coupons", toCouponPayload(coupon));
  return normalizeCoupon(data);
}

export async function updateCoupon(id, coupon) {
  const data = await apiPut(`/coupons/${id}`, toCouponPayload(coupon));
  return normalizeCoupon(data);
}

export async function deleteCoupon(id) {
  return apiDelete(`/coupons/${id}`);
}

export async function getAdminReviews() {
  const data = await apiGet("/reviews");
  return data.map((review) => ({
    id: review.id,
    product_id: review.productId,
    product_name: review.productName || "",
    user_id: review.userId,
    author_name: review.authorName || "",
    rating: Number(review.rating || 0),
    content: review.content || "",
    admin_reply: review.adminReply || "",
    replied_at: review.repliedAt || null,
    status: review.status || "PENDING",
    created_at: review.createdAt,
    updated_at: review.updatedAt,
  }));
}

export async function updateReviewStatus(id, status) {
  const data = await apiRequest(`/reviews/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return {
    id: data.id,
    product_id: data.productId,
    product_name: data.productName || "",
    user_id: data.userId,
    author_name: data.authorName || "",
    rating: Number(data.rating || 0),
    content: data.content || "",
    admin_reply: data.adminReply || "",
    replied_at: data.repliedAt || null,
    status: data.status || "PENDING",
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

export async function replyReview(id, reply) {
  const data = await apiRequest(`/reviews/${id}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply }),
  });
  return {
    id: data.id,
    product_id: data.productId,
    product_name: data.productName || "",
    user_id: data.userId,
    author_name: data.authorName || "",
    rating: Number(data.rating || 0),
    content: data.content || "",
    admin_reply: data.adminReply || "",
    replied_at: data.repliedAt || null,
    status: data.status || "PENDING",
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

export function normalizeRefund(refund) {
  return {
    id: refund.id,
    order_id: refund.orderId,
    order_code: refund.orderCode,
    user_id: refund.userId,
    user_email: refund.userEmail,
    reason: refund.reason,
    status: refund.status,
    refund_amount: Number(refund.refundAmount || 0),
    admin_note: refund.adminNote || "",
    processed_by_email: refund.processedByEmail || "",
    processed_at: refund.processedAt,
    created_at: refund.createdAt,
    updated_at: refund.updatedAt,
  };
}

export async function createRefundRequest({ orderId, reason }) {
  const data = await apiPost("/refunds", { orderId, reason });
  return normalizeRefund(data);
}

export async function getMyRefundRequests() {
  const data = await apiGet("/refunds/mine");
  return data.map(normalizeRefund);
}

export async function getAdminRefundRequests() {
  const data = await apiGet("/refunds");
  return data.map(normalizeRefund);
}

export async function updateRefundStatus(id, status, adminNote = "") {
  const data = await apiRequest(`/refunds/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote }),
  });
  return normalizeRefund(data);
}
