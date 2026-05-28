import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  X,
  Tag,
  Percent,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  AlertCircle,
  Sparkles,
  TrendingDown,
} from "lucide-react";

export function AddCouponModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = "Tạo mã giảm giá mới",
  submitLabel = "Kích hoạt mã giảm giá",
}) {
  const [formData, setFormData] = useState({
    code: "",
    discountType: "",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) {
      setFormData({
        code: "",
        discountType: "",
        discountValue: "",
        minOrderValue: "",
        maxDiscount: "",
        usageLimit: "",
        startDate: "",
        endDate: "",
      });
    } else {
      setFormData({
        code: initialData.code || "",
        discountType: initialData.discount_type || "",
        discountValue: String(initialData.discount_value ?? ""),
        minOrderValue: String(initialData.min_order_value ?? ""),
        maxDiscount: initialData.max_discount_amount == null ? "" : String(initialData.max_discount_amount),
        usageLimit: initialData.usage_limit == null ? "" : String(initialData.usage_limit),
        startDate: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 10) : "",
        endDate: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 10) : "",
      });
    }
    setErrors({});
    setShowConfirmDialog(false);
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Mã giảm giá là bắt buộc";
    } else if (formData.code.length < 3) {
      newErrors.code = "Mã phải có ít nhất 3 ký tự";
    } else if (!/^[A-Z0-9]+$/i.test(formData.code)) {
      newErrors.code = "Mã chỉ được chứa chữ cái và số";
    }

    if (!formData.discountType) {
      newErrors.discountType = "Vui lòng chọn loại giảm giá";
    }

    if (!formData.discountValue.trim()) {
      newErrors.discountValue = "Giá trị giảm là bắt buộc";
    } else if (isNaN(Number(formData.discountValue)) || Number(formData.discountValue) <= 0) {
      newErrors.discountValue = "Giá trị giảm phải là số dương";
    } else if (formData.discountType === "PERCENTAGE" && Number(formData.discountValue) > 100) {
      newErrors.discountValue = "Phần trăm giảm không được vượt quá 100%";
    }

    if (
      formData.minOrderValue &&
      (isNaN(Number(formData.minOrderValue)) || Number(formData.minOrderValue) < 0)
    ) {
      newErrors.minOrderValue = "Giá trị đơn tối thiểu phải là số không âm";
    }

    if (formData.discountType === "PERCENTAGE" && formData.maxDiscount) {
      if (isNaN(Number(formData.maxDiscount)) || Number(formData.maxDiscount) <= 0) {
        newErrors.maxDiscount = "Giảm tối đa phải là số dương";
      }
    }

    if (
      formData.usageLimit &&
      (isNaN(Number(formData.usageLimit)) || Number(formData.usageLimit) <= 0)
    ) {
      newErrors.usageLimit = "Số lượt dùng phải là số dương";
    }

    if (!formData.endDate) {
      newErrors.endDate = "Ngày hết hạn là bắt buộc";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        newErrors.endDate = "Ngày hết hạn phải sau ngày bắt đầu";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    onSave(formData);
    setShowConfirmDialog(false);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      code: "",
      discountType: "",
      discountValue: "",
      minOrderValue: "",
      maxDiscount: "",
      usageLimit: "",
      startDate: "",
      endDate: "",
    });
    setErrors({});
    setShowConfirmDialog(false);
    onClose();
  };

  const formatCurrency = (value) => {
    const number = value.replace(/\D/g, "");
    return number ? Number(number).toLocaleString("vi-VN") : "";
  };

  const handleCurrencyChange = (field, value) => {
    const rawValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: rawValue });
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[86vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-purple-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Thiết lập thông tin mã giảm giá.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8 py-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Tag className="h-5 w-5 text-purple-600" />
                Thông tin mã giảm giá
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="couponCode" className="text-sm font-semibold text-slate-700">
                    Mã code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="couponCode"
                      type="text"
                      placeholder="Ví dụ: HBC50K"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      className={`h-11 border-slate-300 pl-11 font-mono text-base ${
                        errors.code ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="discountType" className="text-sm font-semibold text-slate-700">
                      Loại giảm giá <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <TrendingDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        id="discountType"
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({ ...formData, discountType: e.target.value, maxDiscount: "" })
                        }
                        className={`h-11 w-full rounded-md border bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20 ${
                          errors.discountType ? "border-red-500" : "border-slate-300"
                        }`}
                      >
                        <option value="">Chọn loại giảm</option>
                        <option value="PERCENTAGE">Giảm theo %</option>
                        <option value="FIXED_AMOUNT">Giảm tiền mặt cố định</option>
                      </select>
                    </div>
                    {errors.discountType && (
                      <p className="text-sm text-red-600">{errors.discountType}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="discountValue" className="text-sm font-semibold text-slate-700">
                      Giá trị giảm <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {formData.discountType === "PERCENTAGE" ? (
                          <Percent className="h-5 w-5" />
                        ) : (
                          <DollarSign className="h-5 w-5" />
                        )}
                      </div>
                      <Input
                        id="discountValue"
                        type="text"
                        placeholder={formData.discountType === "PERCENTAGE" ? "Ví dụ: 20" : "Ví dụ: 50000"}
                        value={
                          formData.discountType === "PERCENTAGE"
                            ? formData.discountValue
                            : formatCurrency(formData.discountValue)
                        }
                        onChange={(e) => {
                          if (formData.discountType === "PERCENTAGE") {
                            setFormData({ ...formData, discountValue: e.target.value });
                          } else {
                            handleCurrencyChange("discountValue", e.target.value);
                          }
                        }}
                        className={`h-11 border-slate-300 pl-11 pr-12 ${
                          errors.discountValue ? "border-red-500" : ""
                        }`}
                        disabled={!formData.discountType}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                        {formData.discountType === "PERCENTAGE" ? "%" : "đ"}
                      </div>
                    </div>
                    {errors.discountValue && (
                      <p className="text-sm text-red-600">{errors.discountValue}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Điều kiện áp dụng
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minOrderValue" className="text-sm font-semibold text-slate-700">
                    Giá trị đơn tối thiểu
                  </Label>
                  <Input
                    id="minOrderValue"
                    type="text"
                    value={formatCurrency(formData.minOrderValue)}
                    onChange={(e) => handleCurrencyChange("minOrderValue", e.target.value)}
                    className="h-11"
                    placeholder="Ví dụ: 500000"
                  />
                </div>
                {formData.discountType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount" className="text-sm font-semibold text-slate-700">
                      Giảm tối đa
                    </Label>
                    <Input
                      id="maxDiscount"
                      type="text"
                      value={formatCurrency(formData.maxDiscount)}
                      onChange={(e) => handleCurrencyChange("maxDiscount", e.target.value)}
                      className="h-11"
                      placeholder="Ví dụ: 100000"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Users className="h-5 w-5 text-green-600" />
                Giới hạn sử dụng
              </h3>
              <div className="space-y-2">
                <Label htmlFor="usageLimit" className="text-sm font-semibold text-slate-700">
                  Tổng số lượt dùng
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  placeholder="Ví dụ: 100"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="h-11 max-w-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Calendar className="h-5 w-5 text-orange-600" />
                Thời gian hiệu lực
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-slate-700">
                    Ngày bắt đầu
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={getTodayDate()}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-slate-700">
                    Ngày hết hạn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={formData.startDate || getTodayDate()}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`h-11 ${errors.endDate ? "border-red-500" : ""}`}
                  />
                  {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-200 pt-6 sm:gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="h-11 px-6">
              <X className="mr-2 h-4 w-4" />
              Hủy bỏ
            </Button>
            <Button type="submit" className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-white">
              <Sparkles className="mr-2 h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <AlertCircle className="h-6 w-6 text-purple-600" />
              {initialData ? "Xác nhận cập nhật mã giảm giá" : "Xác nhận kích hoạt mã giảm giá"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-2 space-y-3 text-sm text-gray-700">
                <p>Mã: <strong>{formData.code}</strong></p>
                <p>
                  Giá trị:{" "}
                  <strong>
                    {formData.discountType === "PERCENTAGE"
                      ? `${formData.discountValue}%`
                      : `${formatCurrency(formData.discountValue)} đ`}
                  </strong>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 pt-4 sm:gap-3">
            <AlertDialogCancel className="h-11 border-gray-300 px-6 text-gray-700 hover:bg-gray-100">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-white hover:from-purple-700 hover:to-blue-700"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

export default AddCouponModal;
