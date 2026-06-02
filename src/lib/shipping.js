const NORTH_PROVINCES = [
  "Hà Nội",
  "Hải Phòng",
  "Quảng Ninh",
  "Ninh Bình",
  "Hưng Yên",
  "Bắc Ninh",
  "Phú Thọ",
  "Tuyên Quang",
  "Lào Cai",
  "Thái Nguyên",
  "Lạng Sơn",
  "Cao Bằng",
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
];

const CENTRAL_PROVINCES = [
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Trị",
  "Huế",
  "Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đắk Lắk",
];

const SOUTH_PROVINCES = [
  "TP Hồ Chí Minh",
  "Đồng Nai",
  "Tây Ninh",
  "Vĩnh Long",
  "Đồng Tháp",
  "An Giang",
  "Cần Thơ",
  "Cà Mau",
];

export const VIETNAM_PROVINCES = [
  ...NORTH_PROVINCES,
  ...CENTRAL_PROVINCES,
  ...SOUTH_PROVINCES,
];

export const DEFAULT_SHIPPING_FEES = {
  north: 25000,
  central: 35000,
  south: 45000,
  freeShippingThreshold: 1000000,
};

const LEGACY_PROVINCE_ALIASES = {
  "Hà Tây": "Hà Nội",
  "Hòa Bình": "Phú Thọ",
  "Vĩnh Phúc": "Phú Thọ",
  "Hà Nam": "Ninh Bình",
  "Nam Định": "Ninh Bình",
  "Thái Bình": "Hưng Yên",
  "Hải Dương": "Hải Phòng",
  "Bắc Giang": "Bắc Ninh",
  "Yên Bái": "Lào Cai",
  "Hà Giang": "Tuyên Quang",
  "Bắc Kạn": "Thái Nguyên",
  "Quảng Bình": "Quảng Trị",
  "Thừa Thiên Huế": "Huế",
  "Quảng Nam": "Đà Nẵng",
  "Kon Tum": "Quảng Ngãi",
  "Bình Định": "Gia Lai",
  "Phú Yên": "Đắk Lắk",
  "Ninh Thuận": "Khánh Hòa",
  "Bình Thuận": "Lâm Đồng",
  "Đắk Nông": "Lâm Đồng",
  "Bình Dương": "TP Hồ Chí Minh",
  "Bà Rịa - Vũng Tàu": "TP Hồ Chí Minh",
  "Bà Rịa Vũng Tàu": "TP Hồ Chí Minh",
  "Hồ Chí Minh": "TP Hồ Chí Minh",
  "Long An": "Tây Ninh",
  "Tiền Giang": "Đồng Tháp",
  "Bến Tre": "Vĩnh Long",
  "Trà Vinh": "Vĩnh Long",
  "Sóc Trăng": "Cần Thơ",
  "Hậu Giang": "Cần Thơ",
  "Bạc Liêu": "Cà Mau",
  "Kiên Giang": "An Giang",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isDistrictEnabledProvince(province) {
  const normalized = normalizeText(province);
  return normalized === "ha noi" || normalized === "tp ho chi minh" || normalized === "ho chi minh";
}

export function getProvinceRegion(province) {
  if (NORTH_PROVINCES.includes(province)) return "north";
  if (CENTRAL_PROVINCES.includes(province)) return "central";
  if (SOUTH_PROVINCES.includes(province)) return "south";
  return "unknown";
}

export function getProvinceRegionLabel(province) {
  const region = getProvinceRegion(province);
  if (region === "north") return "Miền Bắc";
  if (region === "central") return "Miền Trung";
  if (region === "south") return "Miền Nam";
  return "Chưa xác định";
}

export function calculateShippingFee(subtotal, province) {
  const amount = Number(subtotal || 0);
  if (amount <= 0 || amount > DEFAULT_SHIPPING_FEES.freeShippingThreshold) return 0;

  const region = getProvinceRegion(province);
  if (region === "central") return DEFAULT_SHIPPING_FEES.central;
  if (region === "south") return DEFAULT_SHIPPING_FEES.south;
  return DEFAULT_SHIPPING_FEES.north;
}

export function buildShippingAddress(detailAddress, ward, district, province) {
  const detail = String(detailAddress || "").trim().replace(/,+$/g, "");
  const wardName = String(ward || "").trim().replace(/^,+|,+$/g, "");
  const districtName = String(district || "").trim().replace(/^,+|,+$/g, "");
  const city = String(province || "").trim();
  return [detail, wardName, districtName, city].filter(Boolean).join(", ");
}

export function parseShippingAddress(address) {
  const raw = String(address || "").trim();
  if (!raw) return { detailAddress: "", ward: "", district: "", province: "" };

  const normalizedRaw = normalizeText(raw);
  const candidates = [
    ...VIETNAM_PROVINCES.map((province) => [province, province]),
    ...Object.entries(LEGACY_PROVINCE_ALIASES),
  ];

  const match = candidates.find(([alias]) => normalizedRaw.includes(normalizeText(alias)));
  if (!match) return { detailAddress: raw, ward: "", district: "", province: "" };

  const [alias, province] = match;
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const filtered = parts.filter((part) => normalizeText(part) !== normalizeText(alias));
  const wardIndex = filtered.findIndex((part) =>
    /^(phường|phuong|xã|xa|thị trấn|thi tran|đặc khu|dac khu)\b/i.test(part.trim())
  );
  const districtIndex = filtered.findIndex((part) =>
    /^(quận|quan|huyện|huyen|thị xã|thi xa|thành phố|thanh pho)\b/i.test(part.trim())
  );
  const ward = wardIndex >= 0 ? filtered[wardIndex] : "";
  const district = districtIndex >= 0 ? filtered[districtIndex] : "";
  const detailParts = filtered.filter((_, index) => index !== wardIndex && index !== districtIndex);

  return {
    detailAddress: detailParts.length > 0 ? detailParts.join(", ") : raw,
    ward,
    district,
    province,
  };
}

export { normalizeText };
