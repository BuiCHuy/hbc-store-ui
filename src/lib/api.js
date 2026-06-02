const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const AUTH_STORAGE_KEY = "auth_user";
const API_ROOT_URL = API_URL.replace(/\/api\/?$/, "");

function normalizeApiErrorMessage(rawMessage) {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();
  if (!message) return "Yêu cầu thất bại";

  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Không thể kết nối máy chủ";
  }
  if (lower.includes("api request failed")) {
    return "Yêu cầu thất bại";
  }
  if (lower.includes("unauthorized") || lower.includes("401")) {
    return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn";
  }
  if (lower.includes("forbidden") || lower.includes("403")) {
    return "Bạn không có quyền thực hiện thao tác này";
  }
  if (lower.includes("access denied")) {
    return "Truy cập bị từ chối";
  }
  if (lower.includes("invalid credentials")) {
    return "Email hoặc mật khẩu không đúng";
  }
  if (lower.includes("email already exists")) {
    return "Email đã tồn tại";
  }
  if (lower.includes("not found")) {
    return "Không tìm thấy dữ liệu";
  }
  if (lower.includes("validation") || lower.includes("bad request")) {
    return "Dữ liệu không hợp lệ";
  }
  if (lower.includes("timeout")) {
    return "Máy chủ phản hồi quá chậm, vui lòng thử lại";
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
