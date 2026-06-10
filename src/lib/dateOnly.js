export function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  const normalizedValue = value.slice(0, 10);
  const [year, month, day] = normalizedValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function getStartOfDateOnly(value) {
  const date = parseDateOnly(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getEndOfDateOnly(value) {
  const date = parseDateOnly(value);
  if (!date) return null;
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function formatDateOnlyVi(value) {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString("vi-VN") : "--";
}

export function normalizeDateOnlyInput(value) {
  if (!value || typeof value !== "string") return "";
  return value.slice(0, 10);
}

export function getTodayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
