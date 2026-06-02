import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { User, Phone, Mail, MapPin, Banknote, Wallet, Ticket } from "lucide-react";
import {
  buildShippingAddress,
  isDistrictEnabledProvince,
  parseShippingAddress,
  VIETNAM_PROVINCES,
} from "../lib/shipping";
import { loadDistrictOptions, loadWardOptions } from "../lib/vietnamAddress";
import { quoteShipping } from "../services/adminApi";

const defaultFormData = {
  fullName: "",
  phoneNumber: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  detailAddress: "",
  address: "",
  voucherCode: "",
  paymentMethod: "COD",
};

export function GuestCheckoutModal({ isOpen, onClose, onSubmit, initialData, subtotal = 0 }) {
  const normalizedInitialData = useMemo(() => {
    const parsedAddress = parseShippingAddress(initialData?.address || "");
    return {
      ...defaultFormData,
      ...(initialData || {}),
      province: initialData?.province || parsedAddress.province,
      district: initialData?.district || parsedAddress.district,
      ward: initialData?.ward || parsedAddress.ward,
      detailAddress: initialData?.detailAddress || parsedAddress.detailAddress,
      paymentMethod: initialData?.paymentMethod || "COD",
    };
  }, [initialData]);

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [shippingQuote, setShippingQuote] = useState({
    shippingFee: 0,
    regionLabel: "Chưa xác định",
  });

  const shouldShowDistrict = isDistrictEnabledProvince(formData.province);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(normalizedInitialData);
    setErrors({});
  }, [isOpen, normalizedInitialData]);

  useEffect(() => {
    if (!isOpen || !formData.province) {
      setDistrictOptions([]);
      setWardOptions([]);
      return;
    }

    let mounted = true;
    setAddressLoading(true);
    setAddressError("");

    const loadAddressOptions = async () => {
      try {
        const [districts, wards] = await Promise.all([
          loadDistrictOptions(formData.province),
          loadWardOptions(formData.province, formData.district),
        ]);
        if (!mounted) return;
        setDistrictOptions(districts);
        setWardOptions(wards);
      } catch (error) {
        if (!mounted) return;
        setDistrictOptions([]);
        setWardOptions([]);
        setAddressError(error.message || "Không tải được dữ liệu địa chỉ.");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    };

    loadAddressOptions();

    return () => {
      mounted = false;
    };
  }, [isOpen, formData.province, formData.district]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const address = buildShippingAddress(
      formData.detailAddress,
      formData.ward,
      shouldShowDistrict ? formData.district : "",
      formData.province
    );
    quoteShipping({
      subtotal,
      province: formData.province,
      shippingAddress: address,
    })
      .then((quote) => {
        if (mounted) setShippingQuote(quote);
      })
      .catch(() => {
        if (mounted) {
          setShippingQuote({ shippingFee: 0, regionLabel: "Chưa xác định" });
        }
      });
    return () => {
      mounted = false;
    };
  }, [
    isOpen,
    subtotal,
    formData.province,
    formData.district,
    formData.ward,
    formData.detailAddress,
    shouldShowDistrict,
  ]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "province") {
        next.district = "";
        next.ward = "";
      }
      if (field === "district") {
        next.ward = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ và tên";
    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!/^(0|\+84)[0-9]{9,10}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      nextErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Email không hợp lệ";
    }
    if (!formData.province) nextErrors.province = "Vui lòng chọn tỉnh/thành phố";
    if (shouldShowDistrict && !formData.district) nextErrors.district = "Vui lòng chọn quận/huyện";
    if (!formData.ward) nextErrors.ward = "Vui lòng chọn phường/xã";
    if (!formData.detailAddress.trim()) {
      nextErrors.detailAddress = "Vui lòng nhập địa chỉ cụ thể";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const address = buildShippingAddress(
      formData.detailAddress,
      formData.ward,
      shouldShowDistrict ? formData.district : "",
      formData.province
    );
    onSubmit({
      ...formData,
      district: shouldShowDistrict ? formData.district : "",
      address,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Thông tin giao hàng
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500">
              Chọn tỉnh/thành phố để hệ thống tính phí vận chuyển theo miền.
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên người nhận *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="fullName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="h-12 pl-11"
                />
              </div>
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="h-12 pl-11"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-xs text-gray-400">(Tùy chọn)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Ví dụ: nguyenvana@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 pl-11"
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Tỉnh/Thành phố *</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <select
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="h-12 w-full rounded-md border border-gray-300 bg-white pl-11 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {VIETNAM_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
              {formData.province ? (
                <p className="text-xs text-gray-500">
                  Khu vực: {shippingQuote.regionLabel}. Phí dự kiến:{" "}
                  {new Intl.NumberFormat("vi-VN").format(shippingQuote.shippingFee)} đ
                </p>
              ) : null}
            </div>

            {shouldShowDistrict ? (
              <div className="space-y-2">
                <Label htmlFor="district">Quận/Huyện *</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    disabled={addressLoading}
                    className="h-12 w-full rounded-md border border-gray-300 bg-white pl-11 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 disabled:bg-gray-50"
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districtOptions.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.district && <p className="text-sm text-red-500">{errors.district}</p>}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="ward">Phường/Xã *</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <select
                  id="ward"
                  value={formData.ward}
                  onChange={(e) => handleInputChange("ward", e.target.value)}
                  disabled={!formData.province || addressLoading || (shouldShowDistrict && !formData.district)}
                  className="h-12 w-full rounded-md border border-gray-300 bg-white pl-11 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 disabled:bg-gray-50"
                >
                  <option value="">
                    {addressLoading ? "Đang tải phường/xã..." : "Chọn phường/xã"}
                  </option>
                  {wardOptions.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              </div>
              {errors.ward && <p className="text-sm text-red-500">{errors.ward}</p>}
              {addressError && <p className="text-sm text-red-500">{addressError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailAddress">Địa chỉ cụ thể *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Textarea
                  id="detailAddress"
                  placeholder="Số nhà, tên đường, tên tòa nhà..."
                  value={formData.detailAddress}
                  onChange={(e) => handleInputChange("detailAddress", e.target.value)}
                  className="min-h-[100px] resize-none pl-11"
                />
              </div>
              {errors.detailAddress && (
                <p className="text-sm text-red-500">{errors.detailAddress}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucherCode">
                Mã giảm giá <span className="text-xs text-gray-400">(Tùy chọn)</span>
              </Label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="voucherCode"
                  placeholder="Ví dụ: HBC50K"
                  value={formData.voucherCode || ""}
                  onChange={(e) => handleInputChange("voucherCode", e.target.value.toUpperCase())}
                  className="h-12 pl-11 uppercase"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Phương thức thanh toán *</Label>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
                className="space-y-3"
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4">
                  <RadioGroupItem value="COD" id="cod" className="mt-0.5" />
                  <Wallet className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span>
                    <span className="block font-semibold">Thanh toán khi nhận hàng (COD)</span>
                    <span className="block text-sm text-gray-600">
                      Thanh toán bằng tiền mặt khi nhận được hàng
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" className="mt-0.5" />
                  <Banknote className="mt-0.5 h-5 w-5 text-green-600" />
                  <span>
                    <span className="block font-semibold">Chuyển khoản ngân hàng</span>
                    <span className="block text-sm text-gray-600">
                      Thanh toán qua cổng PayOS
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
              Hủy bỏ
            </Button>
            <Button type="submit" className="h-12 bg-blue-600 px-8 text-white hover:bg-blue-700">
              Tiếp tục
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
