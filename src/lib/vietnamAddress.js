import { isDistrictEnabledProvince, normalizeText } from "./shipping";

const ADDRESS_DATA_BASE_URL = "https://tracuuphuongxa.vercel.app/data/new/new_ward";
const provinceDataCache = new Map();

const PROVINCE_FILE_OVERRIDES = {
  "TP Hồ Chí Minh": "hochiminh",
  "Hồ Chí Minh": "hochiminh",
};

function toProvinceFileName(province) {
  if (PROVINCE_FILE_OVERRIDES[province]) return PROVINCE_FILE_OVERRIDES[province];

  return String(province || "")
    .replace(/^(TP|Tỉnh|Thành phố)\s+/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatAdministrativeName(value) {
  const text = String(value || "").trim();
  return text
    .replace(/^phường\b/i, "Phường")
    .replace(/^xã\b/i, "Xã")
    .replace(/^thị trấn\b/i, "Thị trấn")
    .replace(/^đặc khu\b/i, "Đặc khu");
}

function uniqueSorted(values) {
  const seen = new Set();
  const items = [];

  values.forEach((value) => {
    const text = formatAdministrativeName(value);
    const key = normalizeText(text);
    if (!text || seen.has(key)) return;
    seen.add(key);
    items.push(text);
  });

  return items.sort((a, b) => a.localeCompare(b, "vi"));
}

export async function loadProvinceWardData(province) {
  if (!province) return [];
  const cacheKey = toProvinceFileName(province);
  if (provinceDataCache.has(cacheKey)) return provinceDataCache.get(cacheKey);

  const response = await fetch(`${ADDRESS_DATA_BASE_URL}/${cacheKey}.json`);
  if (!response.ok) {
    throw new Error("Không tải được dữ liệu phường/xã.");
  }

  const data = await response.json();
  provinceDataCache.set(cacheKey, Array.isArray(data) ? data : []);
  return provinceDataCache.get(cacheKey);
}

export async function loadDistrictOptions(province) {
  if (!isDistrictEnabledProvince(province)) return [];
  const data = await loadProvinceWardData(province);

  return uniqueSorted(
    data.flatMap((item) => (item.old_ward || []).map((ward) => ward.district))
  );
}

export async function loadWardOptions(province, district = "") {
  if (!province) return [];
  const data = await loadProvinceWardData(province);
  const needsDistrict = isDistrictEnabledProvince(province);
  const selectedDistrict = normalizeText(district);

  const filtered = needsDistrict && selectedDistrict
    ? data.filter((item) =>
        (item.old_ward || []).some((ward) => normalizeText(ward.district) === selectedDistrict)
      )
    : data;

  return uniqueSorted(filtered.map((item) => item.new_ward));
}
