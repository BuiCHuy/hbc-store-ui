const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const AUTH_STORAGE_KEY = "auth_user";
const API_ROOT_URL = API_URL.replace(/\/api\/?$/, "");

function normalizeApiErrorMessage(rawMessage) {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();

  if (!message) return "Yêu cầu thất bại";

  const mappings = [
    ["failed to fetch", "Không thể kết nối máy chủ"],
    ["networkerror", "Không thể kết nối máy chủ"],
    ["api request failed", "Yêu cầu thất bại"],
    ["timeout", "Máy chủ phản hồi quá chậm, vui lòng thử lại"],
    ["unauthorized", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"],
    ["401", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"],
    ["forbidden", "Bạn không có quyền thực hiện thao tác này"],
    ["403", "Bạn không có quyền thực hiện thao tác này"],
    ["access denied", "Truy cập bị từ chối"],
    ["invalid credentials", "Email hoặc mật khẩu không đúng"],
    ["invalid email or password", "Email hoặc mật khẩu không đúng"],
    ["email already exists", "Email đã tồn tại"],
    ["account is banned", "Tài khoản đã bị khóa"],
    ["please verify your email before login", "Vui lòng xác thực email trước khi đăng nhập"],
    ["verification link is invalid", "Liên kết xác thực không hợp lệ"],
    ["verification link was already used", "Liên kết xác thực này đã được sử dụng"],
    ["verification link has expired", "Liên kết xác thực đã hết hạn"],
    ["email not found", "Không tìm thấy email"],
    ["this account uses social login", "Tài khoản này đang dùng đăng nhập mạng xã hội"],
    ["email already verified", "Email này đã được xác thực"],
    ["google login is not configured", "Đăng nhập Google chưa được cấu hình"],
    ["invalid google token", "Token đăng nhập Google không hợp lệ"],
    ["google email is not verified", "Email Google chưa được xác thực"],
    ["cannot verify google token", "Không thể xác minh đăng nhập Google"],
    ["invalid jwt token", "Phiên đăng nhập không hợp lệ"],
    ["user not found", "Không tìm thấy người dùng"],
    ["product not found", "Không tìm thấy sản phẩm"],
    ["order not found", "Không tìm thấy đơn hàng"],
    ["coupon not found", "Không tìm thấy mã giảm giá"],
    ["review not found", "Không tìm thấy đánh giá"],
    ["coupon code already exists", "Mã giảm giá đã tồn tại"],
    ["end date must be after start date", "Ngày kết thúc phải sau ngày bắt đầu"],
    ["please login to submit review", "Vui lòng đăng nhập để gửi đánh giá"],
    ["please login", "Vui lòng đăng nhập"],
    ["only admin can", "Bạn không có quyền thực hiện thao tác này"],
    ["you can only review products from delivered orders", "Bạn chỉ có thể đánh giá sản phẩm từ đơn đã giao"],
    ["only delivered orders can be refunded", "Chỉ đơn hàng đã giao mới được yêu cầu hoàn tiền"],
    ["only paid orders can be refunded", "Chỉ đơn hàng đã thanh toán mới được yêu cầu hoàn tiền"],
    [
      "a refund request for this order is already being processed",
      "Đơn hàng này đã có yêu cầu hoàn tiền đang được xử lý",
    ],
    ["unauthenticated request", "Yêu cầu chưa đăng nhập"],
    [
      "mock mode: payos payment link generated",
      "Đã tạo liên kết thanh toán PayOS ở chế độ thử nghiệm",
    ],
    ["payment link generated", "Đã tạo liên kết thanh toán"],
    ["cannot create payos payment link", "Không thể tạo liên kết thanh toán PayOS"],
    ["invalid signature", "Chữ ký xác thực không hợp lệ"],
    ["already paid", "Đơn hàng đã được thanh toán"],
    ["payment confirmed", "Thanh toán đã được xác nhận"],
    ["event received", "Đã nhận sự kiện thanh toán"],
    ["return received", "Đã nhận kết quả thanh toán"],
    ["admin account cannot create payment", "Tài khoản quản trị không thể tạo thanh toán"],
    ["you can only pay your own order", "Bạn chỉ có thể thanh toán đơn hàng của chính mình"],
    ["order payment method is not bank_transfer", "Đơn hàng này không dùng phương thức chuyển khoản"],
    ["order already paid", "Đơn hàng đã được thanh toán"],
    ["cancelled order cannot be paid", "Đơn hàng đã hủy không thể thanh toán"],
    ["delivered order cannot be paid", "Đơn hàng đã giao không thể thanh toán"],
    ["cannot verify checksum", "Không thể xác minh chữ ký thanh toán"],
    ["no files provided", "Chưa có tệp nào được chọn"],
    ["no valid image files provided", "Không có tệp ảnh hợp lệ nào được chọn"],
    ["only image files are allowed", "Chỉ được phép tải lên tệp ảnh"],
    ["image exceeds 5mb limit", "Ảnh vượt quá giới hạn 5MB"],
    ["cannot read image file", "Không thể đọc tệp ảnh"],
    ["cannot upload image to s3", "Không thể tải ảnh lên hệ thống lưu trữ"],
    ["validation", "Dữ liệu không hợp lệ"],
    ["bad request", "Dữ liệu không hợp lệ"],
    ["not found", "Không tìm thấy dữ liệu"],
  ];

  for (const [pattern, translated] of mappings) {
    if (lower.includes(pattern)) {
      return translated;
    }
  }

  return message;
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.token || null;
  } catch {
    return null;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "API request failed";
    throw new Error(normalizeApiErrorMessage(message));
  }

  return data;
}

export function getErrorMessageVi(error, fallback = "Đã xảy ra lỗi") {
  return normalizeApiErrorMessage(error?.message || fallback);
}

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const token = getStoredToken();
  const headers = new Headers(requestOptions.headers);

  if (
    !headers.has("Content-Type") &&
    requestOptions.body !== undefined &&
    !(requestOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  return parseResponse(response);
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut(path, body, options) {
  return apiRequest(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(path, options) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export async function apiPostFormData(path, formData, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    headers: options.headers,
    body: formData,
  });
}

export function toAbsoluteApiUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_ROOT_URL}${path}`;
  return `${API_ROOT_URL}/${path}`;
}
