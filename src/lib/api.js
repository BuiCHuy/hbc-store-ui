const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const AUTH_STORAGE_KEY = "auth_user";
const API_ROOT_URL = API_URL.replace(/\/api\/?$/, "");

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
    throw new Error(message);
  }

  return data;
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
