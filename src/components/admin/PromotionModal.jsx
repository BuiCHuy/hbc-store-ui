import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Save, Sparkles, Tag, Target, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { getTodayDateOnly } from "../../lib/dateOnly";

const emptyForm = {
  name: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
  priority: "0",
  target_type: "PRODUCT",
  target_id: "",
};

function getTodayDate() {
  return getTodayDateOnly();
}

export function PromotionModal({
  isOpen,
  onClose,
  onSave,
  promotion,
  categories = [],
  products = [],
  brands = [],
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const isEdit = Boolean(promotion);

  useEffect(() => {
    if (!promotion) {
      setFormData(emptyForm);
      setErrors({});
      setShowConfirmDialog(false);
      return;
    }

    setFormData({
      name: promotion.name || "",
      description: promotion.description || "",
      discount_type: promotion.discount_type || "PERCENTAGE",
      discount_value: String(promotion.discount_value ?? ""),
      start_date: promotion.start_date || "",
      end_date: promotion.end_date || "",
      status: promotion.status || "ACTIVE",
      priority: String(promotion.priority ?? 0),
      target_type: promotion.target_type || "PRODUCT",
      target_id: String(promotion.target_ids?.[0] ?? ""),
    });
    setErrors({});
    setShowConfirmDialog(false);
  }, [promotion, isOpen]);

  const targetOptions = useMemo(() => {
    if (formData.target_type === "CATEGORY") {
      return categories.map((category) => ({ id: String(category.id), name: category.name }));
    }
    if (formData.target_type === "BRAND") {
      return brands.map((brand) => ({ id: String(brand.id), name: brand.name }));
    }
    return products.map((product) => ({ id: String(product.id), name: product.name }));
  }, [brands, categories, formData.target_type, products]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedDescription = formData.description.trim();
    const discountValue = Number(formData.discount_value);
    const priority = Number(formData.priority || 0);
    const today = getTodayDate();

    if (!trimmedName) nextErrors.name = "Vui lòng nhập tên chương trình";
    else if (trimmedName.length < 2) nextErrors.name = "Tên chương trình phải có ít nhất 2 ký tự";
    else if (trimmedName.length > 180) nextErrors.name = "Tên chương trình không được vượt quá 180 ký tự";

    if (!formData.discount_value) nextErrors.discount_value = "Vui lòng nhập giá trị giảm";
    if (Number.isNaN(discountValue) || discountValue <= 0) nextErrors.discount_value = "Giá trị giảm phải lớn hơn 0";
    if (formData.discount_type === "PERCENTAGE" && Number(formData.discount_value) > 100) {
      nextErrors.discount_value = "Phần trăm giảm không được vượt quá 100%";
    }
    if (
      (formData.discount_type === "FIXED_AMOUNT" || formData.discount_type === "FIXED_PRICE") &&
      !Number.isInteger(discountValue)
    ) {
      nextErrors.discount_value = "Giá trị giảm phải là số nguyên hợp lệ";
    }
    if (!formData.start_date) nextErrors.start_date = "Vui lòng chọn ngày bắt đầu";
    if (!formData.end_date) nextErrors.end_date = "Vui lòng chọn ngày kết thúc";
    if (formData.start_date && formData.start_date < today) {
      nextErrors.start_date = "Ngày bắt đầu không được nhỏ hơn ngày hiện tại";
    }
    if (formData.end_date && formData.end_date < today) {
      nextErrors.end_date = "Ngày kết thúc không được nhỏ hơn ngày hiện tại";
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      nextErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    if (!formData.target_id) nextErrors.target_id = "Vui lòng chọn phạm vi áp dụng";
    if (Number.isNaN(priority) || priority < 0 || !Number.isInteger(priority)) {
      nextErrors.priority = "Độ ưu tiên phải là số nguyên không âm";
    }
    if (trimmedDescription.length > 1000) {
      nextErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    ...promotion,
    name: formData.name.trim(),
    description: formData.description.trim(),
    discount_type: formData.discount_type,
    discount_value: Number(formData.discount_value),
    start_date: formData.start_date,
    end_date: formData.end_date,
    status: formData.status,
    priority: Number(formData.priority || 0),
    target_type: formData.target_type,
    target_ids: [Number(formData.target_id)],
    sold_count: promotion?.sold_count ?? 0,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    onSave(buildPayload());
    setShowConfirmDialog(false);
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setErrors({});
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-purple-600" />
            {isEdit ? "Cập nhật chương trình khuyến mại" : "Thêm chương trình khuyến mại"}
          </DialogTitle>
          <DialogDescription>
            Thiết lập sale trực tiếp cho sản phẩm, danh mục hoặc thương hiệu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4 md:grid-cols-2">
            <Field id="name" label="Tên chương trình" error={errors.name}>
              <Input id="name" value={formData.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ví dụ: Black Friday Sale" className="h-11" />
            </Field>

            <Field id="status" label="Trạng thái">
              <select id="status" value={formData.status} onChange={(event) => updateField("status", event.target.value)} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20">
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm ẩn</option>
              </select>
            </Field>

            <Field id="discount_type" label="Loại giảm giá">
              <select id="discount_type" value={formData.discount_type} onChange={(event) => updateField("discount_type", event.target.value)} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20">
                <option value="PERCENTAGE">Giảm theo phần trăm</option>
                <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
                <option value="FIXED_PRICE">Giá sale cố định</option>
              </select>
            </Field>

            <Field id="discount_value" label="Giá trị giảm" error={errors.discount_value}>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input id="discount_value" type="number" min="0" value={formData.discount_value} onChange={(event) => updateField("discount_value", event.target.value)} placeholder="20" className="h-11 pl-11" />
              </div>
            </Field>

            <Field id="start_date" label="Ngày bắt đầu" error={errors.start_date}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="start_date"
                  type="date"
                  min={getTodayDate()}
                  value={formData.start_date}
                  onChange={(event) => updateField("start_date", event.target.value)}
                  className="h-11 pl-11"
                />
              </div>
            </Field>

            <Field id="end_date" label="Ngày kết thúc" error={errors.end_date}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="end_date"
                  type="date"
                  min={formData.start_date || getTodayDate()}
                  value={formData.end_date}
                  onChange={(event) => updateField("end_date", event.target.value)}
                  className="h-11 pl-11"
                />
              </div>
            </Field>

            <Field id="target_type" label="Áp dụng cho">
              <select id="target_type" value={formData.target_type} onChange={(event) => { updateField("target_type", event.target.value); updateField("target_id", ""); }} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20">
                <option value="PRODUCT">Sản phẩm cụ thể</option>
                <option value="CATEGORY">Danh mục</option>
                <option value="BRAND">Thương hiệu</option>
              </select>
            </Field>

            <Field id="target_id" label="Phạm vi áp dụng" error={errors.target_id}>
              <div className="relative">
                <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select id="target_id" value={formData.target_id} onChange={(event) => updateField("target_id", event.target.value)} className="h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-purple-500 focus:ring-[3px] focus:ring-purple-500/20">
                  <option value="">Chọn phạm vi</option>
                  {targetOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field id="priority" label="Độ ưu tiên" error={errors.priority}>
              <Input id="priority" type="number" min="0" value={formData.priority} onChange={(event) => updateField("priority", event.target.value)} className="h-11" />
            </Field>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" value={formData.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Mô tả ngắn về chương trình khuyến mại" className="min-h-[90px] resize-none" />
              {errors.description ? <p className="text-xs text-red-600">{errors.description}</p> : null}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-gray-100 pt-5 sm:gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Hủy bỏ
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Lưu thay đổi" : "Tạo khuyến mại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEdit ? "Xác nhận cập nhật khuyến mãi" : "Xác nhận tạo khuyến mãi"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? `Bạn muốn cập nhật chương trình "${formData.name}"?`
                : `Bạn muốn tạo chương trình "${formData.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
