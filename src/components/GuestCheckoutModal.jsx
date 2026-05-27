import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { User, Phone, Mail, MapPin, Banknote, Wallet, Ticket } from "lucide-react";

const defaultFormData = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  voucherCode: "",
  paymentMethod: "COD",
};

export function GuestCheckoutModal({ isOpen, onClose, onSubmit, initialData }) {
  const normalizedInitialData = useMemo(
    () => ({
      ...defaultFormData,
      ...(initialData || {}),
      paymentMethod: initialData?.paymentMethod || "COD",
    }),
    [initialData]
  );

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData(normalizedInitialData);
    setErrors({});
  }, [isOpen, normalizedInitialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ nhận hàng";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Thông tin giao hàng</DialogTitle>
            <p className="mt-1 text-sm text-gray-500">Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng</p>
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
              <Label htmlFor="address">Địa chỉ nhận hàng *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Textarea
                  id="address"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="min-h-[100px] resize-none pl-11"
                />
              </div>
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
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
                    <span className="block text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận được hàng</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" className="mt-0.5" />
                  <Banknote className="mt-0.5 h-5 w-5 text-green-600" />
                  <span>
                    <span className="block font-semibold">Chuyển khoản ngân hàng</span>
                    <span className="block text-sm text-gray-600">Chuyển khoản trực tiếp đến tài khoản của cửa hàng</span>
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
